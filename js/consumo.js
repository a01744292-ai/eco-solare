
/**
 * Eco Solare
 * Módulo de cálculo de consumo eléctrico
 */

// Calcula la potencia total en watts
export function calcularPotencia(cantidad, potencia) {
  return cantidad * potencia;
}

// Calcula la energía diaria en kWh
export function calcularEnergia(cantidad, potencia, horas) {
  return (cantidad * potencia * horas) / 1000;
}

// Calcula la energía semanal en kWh
export function calcularEnergiaSemanal(
  cantidad,
  potencia,
  horas,
  dias
) {
  return calcularEnergia(cantidad, potencia, horas) * dias;
}

