// src/app/layout.js
import './globals.css'

export const metadata = {
  title: 'COLO',
  description: 'Plataforma de apoio ao pré-natal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full">
      {/* h-dvh + overflow-hidden garante que o scroll NÃO é no body */}
      <body className="h-dvh overflow-hidden bg-bg text-fg antialiased">
        {children}
      </body>
    </html>
  )
}
