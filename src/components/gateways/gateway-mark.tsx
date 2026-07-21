import Image from "next/image";

export function GatewayMark({ initials, color, logo, logoFill = false }: { initials: string; color: string; logo?: string; logoFill?: boolean }) {
  return <span className={`grid size-10 shrink-0 overflow-hidden rounded-xl border border-white/90 text-[11px] font-bold text-white shadow-[0_6px_16px_rgba(50,43,100,.1)] ${logo ? "bg-white" : color}`}>{logo ? <Image unoptimized src={logo} alt="" width={40} height={40} className={logoFill ? "size-full object-cover" : "m-auto size-7 object-contain"} /> : initials}</span>;
}
