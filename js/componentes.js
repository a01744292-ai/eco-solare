// Eco Solare: registro de fichas técnicas y evaluación preliminar de componentes.
const $ = id => document.getElementById(id);
const KEY = "eco-solare-componentes-v1";
const SOLAR = "eco-solare-solar-v1";
const INV = "eco-solare-inventario-v1";
const ids = ["panel-modelo","panel-ficha","panel-wp","panel-voc","panel-vmp","panel-isc","panel-imp","inversor-modelo","inversor-ficha","inversor-kw","inversor-maxdc","inversor-mppt-min","inversor-mppt-max","inversor-corriente","serie"];
const numeric = new Set(ids.filter(x => !x.endsWith("modelo") && !x.endsWith("ficha")));
const num = id => Number($(id).value);
const fmt = x => Number.isFinite(x) ? x.toPrecision(5) : "—";
function save() {
  const data = {};
  ids.forEach(id => data[id] = $(id).value);
  try { localStorage.setItem(KEY,JSON.stringify(data)); }
  catch { $("mensaje-componentes").textContent = "No se pudieron guardar los datos en este navegador."; }
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "{}");
    ids.forEach(id => { if (typeof d[id] === "string") $(id).value = d[id]; });
  } catch { /* valores iniciales */ }
}
function inventario() {
  try {
    const d = JSON.parse(localStorage.getItem(INV) || "[]");
    return Array.isArray(d) ? d.reduce((sum,e) => {
      const a = [e.cantidad,e.potencia,e.horas,e.dias].map(Number);
      return a.every(Number.isFinite) && a[0]>=1 && a[1]>0 && a[2]>=0 && a[2]<=24 && a[3]>=1 && a[3]<=7
        ? sum + a[0]*a[1]*a[2]*a[3]/1000 : sum;
    },0) : 0;
  } catch { return 0; }
}
function demanda() {
  try {
    const d=JSON.parse(localStorage.getItem(SOLAR)||"{}");
    const semanas=Number(d["semanas-activas"]??40), hsp=Number(d.hsp??5);
    const pr=Number(d["factor-rendimiento"]??80)/100, cobertura=Number(d.cobertura??100)/100;
    if (![semanas,hsp,pr,cobertura].every(Number.isFinite) || semanas<0 || semanas>52 || hsp<=0 || pr<=0 || pr>1 || cobertura<=0 || cobertura>1) return null;
    return { objetivo:inventario()*semanas*cobertura, hsp, pr };
  } catch { return null; }
}
function linea(out,label,value) {
  const p=document.createElement("p");
  const b=document.createElement("strong"); b.textContent=label+": ";
  p.append(b,document.createTextNode(value)); out.appendChild(p);
}
function evaluar() {
  const out=$("resultado-componentes");
  out.replaceChildren();
  const avisos=$("avisos-componentes");
  avisos.replaceChildren();
  $("mensaje-componentes").textContent="";
  const obligatorios=["panel-modelo","panel-ficha","panel-wp","panel-voc","panel-vmp","panel-isc","panel-imp","inversor-modelo","inversor-ficha","inversor-kw","inversor-maxdc","inversor-mppt-min","inversor-mppt-max","inversor-corriente","serie"];
  if (obligatorios.some(id => !$(id).value.trim()) ||
      [...numeric].some(id => !Number.isFinite(num(id)) || num(id)<=0) ||
      !Number.isInteger(num("serie"))) {
    $("mensaje-componentes").textContent="Completa los modelos, enlaces a fichas y valores numéricos positivos. Los paneles por cadena deben ser un entero.";
    return;
  }
  const u = ["panel-ficha","inversor-ficha"].map(id => {
    try {const url=new URL($(id).value);return ["https:","http:"].includes(url.protocol);} catch {return false;}
  });
  if (!u.every(Boolean)) {
    $("mensaje-componentes").textContent="Introduce enlaces HTTP o HTTPS válidos para las fichas técnicas.";
    return;
  }
  const p=num("panel-wp"), voc=num("panel-voc"), vmp=num("panel-vmp");
  const isc=num("panel-isc"), imp=num("panel-imp"), inv=num("inversor-kw");
  const maxdc=num("inversor-maxdc"), mpptmin=num("inversor-mppt-min"), mpptmax=num("inversor-mppt-max");
  const corriente=num("inversor-corriente"), serie=num("serie");
  if (vmp>=voc || imp>isc || mpptmin>=mpptmax) {
    $("mensaje-componentes").textContent="Datos inconsistentes: Vmp debe ser menor que Voc, Imp no mayor que Isc y el rango MPPT debe ser creciente.";
    return;
  }
  const d=demanda();
  if (!d || d.objetivo<=0) {
    $("mensaje-componentes").textContent="Primero registra consumo y configura el calendario solar con demanda anual positiva.";
    return;
  }
  save();
  const kwp=d.objetivo/(365*d.hsp*d.pr);
  const paneles=Math.ceil(kwp*1000/p);
  const panelesInstalados=Math.ceil(paneles/serie)*serie;
  const cadenas=panelesInstalados/serie;
  const kwReal=panelesInstalados*p/1000;
  const ratio=kwReal/inv;
  const vmpCadena=serie*vmp, vocCadena=serie*voc;
  const generacion=kwReal*d.hsp*d.pr*365;
  linea(out,"Potencia objetivo",fmt(kwp)+" kWp");
  linea(out,"Paneles mínimos por energía",String(paneles));
  linea(out,"Paneles con cadenas completas",String(panelesInstalados));
  linea(out,"Cadenas calculadas",String(cadenas));
  linea(out,"Potencia FV del arreglo",fmt(kwReal)+" kWp");
  linea(out,"Relación potencia DC/AC",fmt(ratio));
  linea(out,"Vmp nominal por cadena",fmt(vmpCadena)+" V");
  linea(out,"Voc nominal por cadena",fmt(vocCadena)+" V");
  linea(out,"Generación anual teórica",fmt(generacion)+" kWh/año");
  function aviso(t) { const li=document.createElement("li");li.textContent=t;avisos.appendChild(li); }
  aviso(vmpCadena>=mpptmin && vmpCadena<=mpptmax
    ? "Vmp nominal dentro del rango MPPT declarado."
    : "Atención: Vmp nominal fuera del rango MPPT declarado.");
  aviso(vocCadena<=maxdc
    ? "Voc nominal no supera la tensión DC máxima declarada; falta comprobar Voc a temperatura mínima."
    : "Atención: Voc nominal supera la tensión DC máxima del inversor.");
  aviso(isc<=corriente
    ? "Isc de una cadena no supera el valor declarado del inversor; revisar el límite por entrada y el número de cadenas en paralelo."
    : "Atención: Isc de una cadena supera el valor de corriente introducido.");
  aviso("Relación DC/AC = "+fmt(ratio)+". Su aceptación depende del fabricante, del límite de sobredimensionamiento y del diseño.");
  aviso("Las "+cadenas+" cadenas no se asignan automáticamente a entradas MPPT. No se han validado corrientes sumadas, fusibles, conductores ni protecciones.");
  aviso("Sin coeficientes térmicos, temperaturas extremas, límites por MPPT y topología del inversor NO es posible certificar compatibilidad eléctrica.");
}
$("form-componentes").addEventListener("submit",e=>{e.preventDefault();evaluar();});
$("limpiar-componentes").addEventListener("click",()=>{
  if (!confirm("¿Borrar las fichas y parámetros guardados de componentes?")) return;
  $("form-componentes").reset();
  try {localStorage.removeItem(KEY);} catch {}
  $("resultado-componentes").replaceChildren();
  $("avisos-componentes").replaceChildren();
  $("mensaje-componentes").textContent="Datos de componentes eliminados.";
});
load();
