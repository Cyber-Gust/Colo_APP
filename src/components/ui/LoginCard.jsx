// components/LoginCard.js
import Image from "next/image";

export default function LoginCard({ title, children }) {
  return (
    <div className="min-w-[400px] mx-auto rounded-2xl bg-card shadow-soft border border-border p-8">
      <div className="flex justify-center mb-4">
        <Image
          src="/brand/logo.png"
          alt="Logo COLO"
          width={200}
          height={120}
          priority
        />
      </div>
      <h1 className="text-2xl font-semibold text-center mb-6">{title}</h1>
      {children}
    </div>
  );
}
