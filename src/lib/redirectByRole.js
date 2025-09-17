// src/lib/redirectByRole.js
export function redirectByRole(role) {
  // Ajuste se você tiver mais papéis depois
  switch (role) {
    case 'UBS_ADMIN':
    case 'UBS_STAFF':
    case 'ACS':
      return '/ubs/dashboard'
    case 'GESTANTE':
      return '/first-access' // ou a landing da gestante
    default:
      return '/ubs/dashboard'
  }
}
