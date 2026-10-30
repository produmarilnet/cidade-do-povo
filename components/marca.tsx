export function Marca({ grande = false }: { grande?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className={grande ? "h-10 w-10" : "h-8 w-8"} aria-hidden>
        <rect width="32" height="32" rx="7" fill="#214DB0" />
        <path d="M7 25 V15 L12 11 L17 15 V25 Z M17 25 V9 L25 13 V25 Z" fill="#fff" />
        <circle cx="25" cy="7" r="2.5" fill="#FBBF24" />
      </svg>
      <div className="leading-tight">
        <div className={grande ? "text-lg font-semibold" : "font-semibold"}>Cidade do Povo</div>
        <div className="text-xs text-stone-500">Gestão de serviços</div>
      </div>
    </div>
  );
}
