// File: /src/components/painel/AppFooter.js
import Link from "next/link";

export default function AppFooter() {
    return (
        <footer className="border-t border-zinc-200/70 bg-white">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-3 text-sm text-zinc-600 flex items-center justify-between">
                <span>© {new Date().getFullYear()} Colo</span>
                <span>
                    Desenvolvido por {" "}
                    <Link href="https://bitbloomai.com" className="font-medium text-[#4e0a26] hover:underline" target="_blank">
                        BitBloom AI
                    </Link>
                </span>
            </div>
        </footer>
    );
}