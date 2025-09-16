// app/page.js
export default function Home() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold">COLO</h1>
      <p className="text-muted">
        Identidade aplicada com vinho e creme via tokens.
      </p>

      <div className="rounded-2xl bg-card shadow-soft border border-border p-6">
        <h2 className="text-xl mb-3">Cartão de exemplo</h2>
        <button className="px-4 py-2 rounded-xl bg-accent text-white hover:opacity-90 focus:outline-none ring-2 ring-transparent focus:ring-ring transition">
          Botão primário
        </button>
      </div>
    </main>
  );
}
