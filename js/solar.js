// Eco Solare · Calendario y dimensionamiento fotovoltaico preliminar
const $ = id => document.getElementById(id);
const INVENTARIO = "eco-solare-inventario-v1";
const AJUSTES = "eco-solare-solar-v1";
const campos = ["semanas-activas","hsp","factor-rendimiento","potencia-panel","cobertura"];
const numero = id => Number($(id).value);
const fmt = n => Number.isFinite(n) ? n.toPrecision(5) : "—";
function cargarInventario() {
  try {
    const datos = JSON.parse(localStorage.getItem(INVENTARIO) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch { return []; }
}
function consumoSemanal() {
  return cargarInventario().reduce((s, e) => {
    const n = Number(e.cantidad), w = Number(e.potencia), h = Number(e.horas), d = Number(e.dias);
    if (![n,w,h,d].every(Number.isFinite) || n < 1 || w <= 0 || h < 0 || h > 24 || d < 1 || d > 7) return s;
    return s + n*w*h*d/1000;
  }, 0);
}
function leerAjustes() {
  try {
    const datos = JSON.parse(localStorage.getItem(AJUSTES) || "{}");
    campos.forEach(id => {
      if (Number.isFinite(datos[id])) $(id).value = datos[id];
    });
  } catch { /* Mantener valores predeterminados */ }
}
function guardarAjustes() {
  try {
    const datos = {};
    campos.forEach(id => datos[id] = numero(id));
    localStorage.setItem(AJUSTES, JSON.stringify(datos));
  } catch { $("mensaje-solar").textContent = "No se pudieron guardar los parámetros en este navegador."; }
}
function resultadoLinea(contenedor, titulo, valor) {
  const p = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = titulo + ": ";
  p.append(strong, document.createTextNode(valor));
  contenedor.appendChild(p);
}
function calcular() {
  const semanal = consumoSemanal();
  const semanas = numero("semanas-activas");
  const hsp = numero("hsp");
  const pr = numero("factor-rendimiento")/100;
  const panel = numero("potencia-panel");
  const cobertura = numero("cobertura")/100;
  const salida = $("resultado-solar");
  salida.replaceChildren();
  $("mensaje-solar").textContent = "";
  if (!Number.isInteger(semanas) || semanas < 0 || semanas > 52 ||
      !Number.isFinite(hsp) || hsp <= 0 || hsp > 12 ||
      !Number.isFinite(pr) || pr <= 0 || pr > 1 ||
      !Number.isFinite(panel) || panel <= 0 || panel > 2000 ||
      !Number.isFinite(cobertura) || cobertura <= 0 || cobertura > 1) {
    $("mensaje-solar").textContent = "Revisa los parámetros: semanas 0–52, HSP 0–12, rendimiento 1–100 %, panel 0–2000 W y cobertura 1–100 %.";
    return;
  }
  guardarAjustes();
  const anual = semanal * semanas;
  const diarioPromedio = anual / 365;
  const objetivo = anual * cobertura;
  const potenciaKWp = objetivo / (365 * hsp * pr);
  const cantidadPaneles = Math.ceil(potenciaKWp*1000/panel);
  const potenciaInstaladaKWp = cantidadPaneles*panel/1000;
  const generacionAnual = potenciaInstaladaKWp*hsp*pr*365;
  const excedenteTeorico = Math.max(0, generacionAnual - anual);
  resultadoLinea(salida, "Consumo semanal en actividad", fmt(semanal) + " kWh");
  resultadoLinea(salida, "Consumo anual del aula", fmt(anual) + " kWh/año");
  resultadoLinea(salida, "Consumo diario promedio anual", fmt(diarioPromedio) + " kWh/día");
  if (anual === 0) {
    resultadoLinea(salida, "Dimensionamiento", "Sin demanda anual registrada; agrega equipos y semanas activas.");
    return;
  }
  resultadoLinea(salida, "Energía anual objetivo", fmt(objetivo) + " kWh/año");
  resultadoLinea(salida, "Potencia fotovoltaica teórica", fmt(potenciaKWp) + " kWp");
  resultadoLinea(salida, "Cantidad estimada de paneles", String(cantidadPaneles));
  resultadoLinea(salida, "Potencia nominal del arreglo", fmt(potenciaInstaladaKWp) + " kWp");
  resultadoLinea(salida, "Generación anual estimada", fmt(generacionAnual) + " kWh/año");
  resultadoLinea(salida, "Generación anual superior al consumo", fmt(excedenteTeorico) + " kWh/año (comparación de totales, no exportación a red)");
  const nota = document.createElement("p");
  nota.className = "solar-note";
  nota.textContent = "Modelo anual simplificado: generación = kWp × HSP × 365 × factor de rendimiento. No representa producción horaria, autoconsumo, tarifas, excedentes reales, sombras, inclinación, temperatura, degradación ni compatibilidad eléctrica del inversor. El porcentaje de cobertura es energético anual, no autonomía.";
  salida.appendChild(nota);
}
$("form-solar").addEventListener("submit", e => { e.preventDefault(); calcular(); });
$("recalcular-solar").addEventListener("click", calcular);
window.addEventListener("storage", e => { if (e.key === INVENTARIO) calcular(); });
document.addEventListener("eco-solare-inventario-actualizado", calcular);
leerAjustes();
calcular();
