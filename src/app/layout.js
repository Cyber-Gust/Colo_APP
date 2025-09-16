// app/layout.js
import './globals.css';

export const metadata = {
  title: 'COLO',
  description: 'Plataforma de apoio ao pré-natal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-bg text-fg antialiased">
        <div className="mx-auto max-w-5xl p-6">{children}</div>
      </body>
    </html>
  );
}
