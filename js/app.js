import { calcularPotencia, calcularEnergia, calcularEnergiaSemanal } from "./consumo.js";

const CLAVE = "eco-solare-inventario-v1";
const $ = (id) => document.getElementById(id);
const formulario = $("form-consumo");
const tabla = $("tabla-equipos");
const resultado = $("resultado-consumo");
const grafica = $("grafica-consumo");
const mensaje = $("mensaje-consumo");
const botonBorrar = $("borrar-inventario");
const botonExportar = $("exportar-inventario");
const botonCancelar = $("cancelar-edicion");
const botonGuardar = $("guardar-equipo");
let equipos = [];
let indiceEdicion = -1;

function validarEquipo(e) {
  return typeof e.nombre === "string" && e.nombre.trim().length > 0 &&
    e.nombre.length <= 120 && Number.isInteger(e.cantidad) && e.cantidad >= 1 &&
    Number.isFinite(e.potencia) && e.potencia > 0 &&
    Number.isFinite(e.horas) && e.horas >= 0 && e.horas <= 24 &&
    Number.isInteger(e.dias) && e.dias >= 1 && e.dias <= 7;
}
function formato(n) { return Number(n).toPrecision(5); }
function consumo(e) {
  return {
    potencia: calcularPotencia(e.cantidad, e.potencia),
    diaria: calcularEnergia(e.cantidad, e.potencia, e.horas),
    semanal: calcularEnergiaSemanal(e.cantidad, e.potencia, e.horas, e.dias)
  };
}
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(equipos)); return true; }
  catch { mensaje.textContent = "No se pudieron guardar los datos en este navegador."; return false; }
}
function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    equipos = Array.isArray(datos) ? datos.filter(validarEquipo) : [];
  } catch {
    equipos = [];
    mensaje.textContent = "No fue posible recuperar el inventario guardado.";
  }
}
function celda(fila, valor) {
  const td = document.createElement("td");
  td.textContent = valor;
  td.style.padding = "12px";
  td.style.borderBottom = "1px solid #dce8df";
  fila.appendChild(td);
  return td;
}
function botonAccion(texto, accion) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = texto;
  boton.addEventListener("click", accion);
  return boton;
}
function cancelarEdicion() {
  indiceEdicion = -1;
  formulario.reset();
  botonGuardar.textContent = "Agregar equipo";
  botonCancelar.hidden = true;
}
function editar(i) {
  const e = equipos[i];
  indiceEdicion = i;
  $("equipo").value = e.nombre;
  $("cantidad").value = e.cantidad;
  $("potencia").value = e.potencia;
  $("horas").value = e.horas;
  $("dias").value = e.dias;
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;
  formulario.scrollIntoView({ behavior: "smooth", block: "center" });
  $("equipo").focus();
}
function actualizar() {
  tabla.replaceChildren();
  grafica.replaceChildren();
  let totalPotencia = 0;
  let totalDiaria = 0;
  let totalSemanal = 0;
  const consumos = [];

  equipos.forEach((e, i) => {
    const c = consumo(e);
    totalPotencia += c.potencia;
    totalDiaria += c.diaria;
    totalSemanal += c.semanal;
    consumos.push({ nombre: e.nombre, semanal: c.semanal });
    const fila = document.createElement("tr");
    celda(fila, e.nombre);
    celda(fila, formato(c.potencia) + " W");
    celda(fila, formato(c.diaria));
    celda(fila, formato(c.semanal));
    const acciones = celda(fila, "");
    acciones.append(
      botonAccion("Editar", () => editar(i)),
      document.createTextNode(" "),
      botonAccion("Eliminar", () => {
        if (indiceEdicion === i) cancelarEdicion();
        else if (indiceEdicion > i) indiceEdicion--;
        equipos.splice(i, 1);
        guardar();
        actualizar();
      })
    );
    tabla.appendChild(fila);
  });

  const promedioDiario = totalSemanal / 7;
  const mensual = totalSemanal * 365 / (7 * 12);
  resultado.replaceChildren();
  const titulo = document.createElement("h3");
  titulo.textContent = "Resumen del inventario";
  resultado.appendChild(titulo);
  [
    ["Potencia nominal total", totalPotencia, " W"],
    ["Energía de un día de operación", totalDiaria, " kWh"],
    ["Energía semanal", totalSemanal, " kWh"],
    ["Promedio diario semanal", promedioDiario, " kWh/día"],
    ["Estimación mensual promedio", mensual, " kWh/mes"]
  ].forEach(([nombre, valor, unidad]) => {
    const p = document.createElement("p");
    p.textContent = nombre + ": " + formato(valor) + unidad;
    resultado.appendChild(p);
  });
  const nota = document.createElement("small");
  nota.textContent = "Estimación mensual = consumo semanal × 365 ÷ (7 × 12). Supone el mismo patrón semanal durante todo el año; no considera vacaciones ni cambios estacionales.";
  resultado.appendChild(nota);

  consumos.sort((a, b) => b.semanal - a.semanal);
  consumos.forEach((dato) => {
    const porcentaje = totalSemanal > 0 ? dato.semanal / totalSemanal * 100 : 0;
    const bloque = document.createElement("div");
    bloque.style.marginBottom = "16px";
    const etiqueta = document.createElement("div");
    etiqueta.textContent = dato.nombre + ": " + formato(dato.semanal) + " kWh (" + porcentaje.toFixed(1) + "%)";
    etiqueta.style.marginBottom = "5px";
    const fondo = document.createElement("div");
    fondo.style.background = "#e8efea";
    fondo.style.borderRadius = "8px";
    fondo.style.height = "22px";
    fondo.setAttribute("role", "img");
    fondo.setAttribute("aria-label", etiqueta.textContent);
    const barra = document.createElement("div");
    barra.style.width = porcentaje + "%";
    barra.style.height = "100%";
    barra.style.background = "#08783F";
    barra.style.borderRadius = "8px";
    fondo.appendChild(barra);
    bloque.append(etiqueta, fondo);
    grafica.appendChild(bloque);
  });
  if (equipos.length === 0) {
    grafica.textContent = "Agrega equipos para visualizar el consumo.";
    const fila = document.createElement("tr");
    const vacia = celda(fila, "Todavía no hay equipos registrados.");
    vacia.colSpan = 5;
    tabla.appendChild(fila);
  }
  botonExportar.disabled = equipos.length === 0;
  botonBorrar.disabled = equipos.length === 0;
  const resumenPrincipal = $("consumo-resumen-principal");
  if (resumenPrincipal) resumenPrincipal.textContent = equipos.length ? formato(totalSemanal) + " kWh/semana" : "Por calcular";
}
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const e = {
    nombre: $("equipo").value.trim(),
    cantidad: Number($("cantidad").value),
    potencia: Number($("potencia").value),
    horas: Number($("horas").value),
    dias: Number($("dias").value)
  };
  if (!validarEquipo(e)) {
    mensaje.textContent = "Revisa los datos: cantidad y días enteros, potencia positiva, horas entre 0 y 24.";
    return;
  }
  if (indiceEdicion >= 0) equipos[indiceEdicion] = e;
  else equipos.push(e);
  const guardado = guardar();
  actualizar();
  cancelarEdicion();
  if (guardado) mensaje.textContent = "Inventario actualizado y guardado.";
});
botonCancelar.addEventListener("click", cancelarEdicion);
botonBorrar.addEventListener("click", () => {
  if (!confirm("¿Eliminar todos los equipos registrados?")) return;
  equipos = [];
  cancelarEdicion();
  guardar();
  actualizar();
  mensaje.textContent = "Inventario eliminado.";
});
botonExportar.addEventListener("click", () => {
  const encabezados = ["Equipo", "Cantidad", "Potencia por equipo (W)", "Horas por día", "Días por semana", "Potencia total (W)", "Energía diaria (kWh)", "Energía semanal (kWh)"];
  const filas = equipos.map((e) => {
    const c = consumo(e);
    return [e.nombre, e.cantidad, e.potencia, e.horas, e.dias, c.potencia, c.diaria, c.semanal];
  });
  const escapar = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = [encabezados, ...filas].map((fila) => fila.map(escapar).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "eco-solare-inventario.csv";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  mensaje.textContent = "Inventario exportado a CSV.";
});
cargar();
actualizar();
