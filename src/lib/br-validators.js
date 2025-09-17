export function onlyDigits(v) {
  return String(v || '').replace(/\D/g, '')
}

export function isValidCPF(cpfRaw) {
  const cpf = onlyDigits(cpfRaw)
  if (!cpf || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false
  let sum = 0, rest
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf.substring(9, 10))) return false
  sum = 0
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  return rest === parseInt(cpf.substring(10, 11))
}

/** CNS (SUS) 15 dígitos – checagem de dígito verificador comum */
export function isValidCNS(cnsRaw) {
  const cns = onlyDigits(cnsRaw)
  if (cns.length !== 15) return false
  let sum = 0
  for (let i = 0; i < 15; i++) sum += parseInt(cns[i]) * (15 - i)
  return sum % 11 === 0
}

/** mapeia CPF -> e-mail sintético para o Supabase Auth */
export function cpfAliasEmail(cpfRaw) {
  const cpf = onlyDigits(cpfRaw)
  return `${cpf}@gestante.colo`
}
