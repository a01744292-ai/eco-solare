
import {
  calcularPotencia,
  calcularEnergia,
  calcularEnergiaSemanal
} from "./consumo.js";

const formulario = document.getElementById("form-consumo");
const resultado = document.getElementById("resultado-consumo");

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const cantidad = Number(document.getElementById("cantidad").value);
  const potencia = Number(document.getElementById("potencia").value);
  const horas = Number(document.getElementById("horas").value);
  const dias = Number(document.getElementById("dias").value);

  if (
    !Number.isInteger(cantidad) || cantidad < 1 ||
    !Number.isFinite(potencia) || potencia <= 0 ||
    !Number.isFinite(horas) || horas < 0 || horas > 24 ||
    !Number.isInteger(dias) || dias < 1 || dias > 7
  ) {
    resultado.textContent = "Introduce valores válidos.";
    return;
  }

  const potenciaTotal = calcularPotencia(cantidad, potencia);
  const energiaDiaria = calcularEnergia(cantidad, potencia, horas);
  const energiaSemanal = calcularEnergiaSemanal(cantidad, potencia, horas, dias);

  resultado.innerHTML = `
    <strong>Resultados del consumo</strong>
    <p>Potencia total: ${potenciaTotal.toPrecision(5)} W</p>
    <p>Energía diaria: ${energiaDiaria.toPrecision(5)} kWh</p>
    <p>Energía semanal: ${energiaSemanal.toPrecision(5)} kWh</p>
  `;
});
