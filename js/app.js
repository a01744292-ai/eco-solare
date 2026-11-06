
import {
  calcularPotencia,
  calcularEnergia,
  calcularEnergiaSemanal
} from "./consumo.js";

const CLAVE = "eco-solare-inventario-v1";

const formulario = document.getElementById("form-consumo");
const tabla = document.getElementById("tabla-equipos");
const resultado = document.getElementById("resultado-consumo");
const grafica = document.getElementById("grafica-consumo");
const mensaje = document.getElementById("mensaje-consumo");
const botonBorrar = document.getElementById("borrar-inventario");

let equipos = [];

function validarEquipo(equipo) {
  return (
    typeof equipo.nombre === "string" &&
    equipo.nombre.trim().length > 0 &&
    Number.isInteger(equipo.cantidad) &&
    equipo.cantidad >= 1 &&
    Number.isFinite(equipo.potencia) &&
    equipo.potencia > 0 &&
    Number.isFinite(equipo.horas) &&
    equipo.horas >= 0 &&
    equipo.horas <= 24 &&
    Number.isInteger(equipo.dias) &&
    equipo.dias >= 1 &&
    equipo.dias <= 7
  );
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(equipos));
    return true;
  } catch {
    mensaje.textContent =
      "No fue posible guardar los datos en este navegador.";
    return false;
  }
}

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    equipos = Array.isArray(datos)
      ? datos.filter(validarEquipo)
      : [];
  } catch {
    equipos = [];
    mensaje.textContent =
      "No se pudieron recuperar los datos guardados.";
  }
}

function formato(numero) {
  return Number(numero).toPrecision(5);
}

function crearCelda(fila, texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  celda.style.padding = "12px";
  celda.style.borderBottom = "1px solid #dce8df";
  fila.appendChild(celda);
  return celda;
}

function actualizar() {
  tabla.replaceChildren();
  grafica.replaceChildren();

  let potenciaTotal = 0;
  let energiaDiariaTotal = 0;
  let energiaSemanalTotal = 0;

  const consumos = [];

  equipos.forEach((equipo, indice) => {
    const potencia = calcularPotencia(
      equipo.cantidad, equipo.potencia
    );

    const diaria = calcularEnergia(
      equipo.cantidad, equipo.potencia, equipo.horas
    );

    const semanal = calcularEnergiaSemanal(
      equipo.cantidad, equipo.potencia,
      equipo.horas, equipo.dias
    );

    potenciaTotal += potencia;
    energiaDiariaTotal += diaria;
    energiaSemanalTotal += semanal;

    consumos.push({
      nombre: equipo.nombre,
      energia: semanal
    });

    const fila = document.createElement("tr");

    crearCelda(fila, equipo.nombre);
    crearCelda(fila, formato(potencia) + " W");
    crearCelda(fila, formato(diaria));
    crearCelda(fila, formato(semanal));

    const celdaAccion = crearCelda(fila, "");
    const boton = document.createElement("button");

    boton.textContent = "Eliminar";
    boton.type = "button";
    boton.style.cursor = "pointer";
    boton.style.color = "#08783F";

    boton.addEventListener("click", () => {
      equipos.splice(indice, 1);
      guardar();
      actualizar();
    });

    celdaAccion.appendChild(boton);
    tabla.appendChild(fila);
  });

  resultado.replaceChildren();

  const resumen = document.createElement("div");
  resumen.innerHTML = `
    <h3>Resumen del inventario</h3>
    <p>Potencia instalada: ${formato(potenciaTotal)} W</p>
    <p>Energía diaria de referencia:
       ${formato(energiaDiariaTotal)} kWh/día</p>
    <p>Energía semanal:
       ${formato(energiaSemanalTotal)} kWh/semana</p>
  `;
  resultado.appendChild(resumen);

  // Gráfica de barras sin librerías externas
  consumos.forEach((dato) => {
    const porcentaje = energiaSemanalTotal > 0
      ? dato.energia / energiaSemanalTotal * 100
      : 0;

    const bloque = document.createElement("div");
    bloque.style.marginBottom = "16px";

    const etiqueta = document.createElement("div");
    etiqueta.textContent =
      `${dato.nombre}: ${formato(dato.energia)} kWh`;
    etiqueta.style.marginBottom = "5px";

    const fondo = document.createElement("div");
    fondo.style.background = "#e8efea";
    fondo.style.borderRadius = "8px";
    fondo.style.height = "22px";

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
  }
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const equipo = {
    nombre: document.getElementById("equipo").value.trim(),
    cantidad: Number(document.getElementById("cantidad").value),
    potencia: Number(document.getElementById("potencia").value),
    horas: Number(document.getElementById("horas").value),
    dias: Number(document.getElementById("dias").value)
  };

  if (!validarEquipo(equipo)) {
    mensaje.textContent = "Revisa los datos introducidos.";
    return;
  }

  equipos.push(equipo);
  const guardado = guardar();
  actualizar();

  if (guardado) {
    mensaje.textContent = "Equipo agregado y guardado.";
  }

  formulario.reset();
});

botonBorrar.addEventListener("click", () => {
  if (confirm("¿Eliminar todos los equipos registrados?")) {
    equipos = [];
    guardar();
    actualizar();
    mensaje.textContent = "Inventario eliminado.";
  }
});

cargar();
actualizar();
