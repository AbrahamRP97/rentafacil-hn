export function calcularCargo(monto, porcentaje) {
  const centavos = Math.round(Number(monto) * 100)
  const centesimas = Math.round(Number(porcentaje) * 100)
  if (!Number.isFinite(centavos) || !Number.isFinite(centesimas) || centavos <= 0) return 0
  return Math.round((centavos * centesimas) / 10000) / 100
}

export const formatoL = (n) =>
  Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })