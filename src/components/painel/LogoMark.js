// File: /src/components/painel/LogoMark.js
import Image from "next/image";

export default function LogoMark() {
    return (
        <div className="flex items-center gap-2">
            <Image
                src="/brand/logo.png"
                alt="Colo logo"
                width={90}
                height={36}
                className=""
                priority
            />
        </div>
    );
}