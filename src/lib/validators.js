export const onlyDigits = (v) => String(v || '').replace(/\D/g, '')
export const isCPF = (cpf) => onlyDigits(cpf).length === 11
