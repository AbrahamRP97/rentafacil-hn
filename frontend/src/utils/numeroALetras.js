const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis',
  'veintisiete', 'veintiocho', 'veintinueve']
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

function menorMil(n) {
  if (n === 0) return ''
  if (n === 100) return 'cien'
  const c = Math.floor(n / 100)
  const r = n % 100
  const partes = []
  if (c > 0) partes.push(CENTENAS[c])
  if (r > 0) {
    if (r < 30) partes.push(UNIDADES[r])
    else {
      const d = Math.floor(r / 10)
      const u = r % 10
      partes.push(u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`)
    }
  }
  return partes.join(' ')
}

function enteroALetras(n) {
  if (n === 0) return 'cero'
  const millones = Math.floor(n / 1000000)
  const miles = Math.floor((n % 1000000) / 1000)
  const resto = n % 1000
  const partes = []

  if (millones > 0) {
    partes.push(millones === 1 ? 'un millón' : `${apocopar(menorMil(millones))} millones`)
  }
  if (miles > 0) {
    partes.push(miles === 1 ? 'mil' : `${apocopar(menorMil(miles))} mil`)
  }
  if (resto > 0) partes.push(menorMil(resto))
  return partes.join(' ')
}

function apocopar(texto) {
  return texto.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')
}

export function montoALetras(monto) {
  const valor = Math.round(Number(monto) * 100)
  if (!Number.isFinite(valor) || valor < 0) return ''
  const entero = Math.floor(valor / 100)
  const centavos = String(valor % 100).padStart(2, '0')
  const base = apocopar(enteroALetras(entero)) // "treinta y uno" -> "treinta y un lempiras"
  const letras = entero >= 1000000 && entero % 1000000 === 0 ? `${base} de` : base
  const moneda = entero === 1 ? 'lempira' : 'lempiras'
  const completo = `${letras} ${moneda} con ${centavos}/100`
  return completo.charAt(0).toUpperCase() + completo.slice(1)
}