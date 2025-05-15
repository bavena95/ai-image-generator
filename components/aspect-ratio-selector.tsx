// components/aspect-ratio-selector.tsx
"use client";
import { cn } from "@/lib/utils";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "3:2" | "2:3";

interface AspectRatioSelectorProps {
  onChange: (ratio: AspectRatio) => void;
  value: AspectRatio;
  mode?: string; // 'thumbnails', 'branding', 'general'
  compact?: boolean;
}

export function AspectRatioSelector({
  onChange,
  value,
  mode = "general",
  compact = false,
}: AspectRatioSelectorProps) {
  const aspectRatios: {
    value: AspectRatio;
    label: string;
    description: string;
    iconClass: string;
  }[] = [
    { value: "16:9", label: "Landscape", description: "Vídeos, desktop", iconClass: compact ? "w-10 h-[5.625px]" : "w-12 h-[6.75px] md:w-16 md:h-9" },
    { value: "9:16", label: "Portrait",  description: "Mobile, stories", iconClass: compact ? "w-[5.625px] h-10" : "w-[6.75px] h-12 md:w-9 md:h-16" },
    { value: "4:5",  label: "Vertical",  description: "Posts de feed", iconClass: compact ? "w-8 h-10"         : "w-8 h-10 md:w-8 md:h-10" },
    { value: "1:1",  label: "Square",    description: "Posts sociais", iconClass: compact ? "w-8 h-8"          : "w-8 h-8 md:w-9 md:h-9" },
    { value: "3:2",  label: "Classic",   description: "Fotografia",    iconClass: compact ? "w-9 h-6"          : "w-12 h-8 md:w-12 md:h-8" },
    { value: "2:3",  label: "Tall",      description: "Posters, capas",iconClass: compact ? "w-6 h-9"          : "w-8 h-12 md:w-8 md:h-12" },
  ];

  const getModeSpecificDescription = (ratioValue: AspectRatio) => {
    if (mode === "thumbnails") {
      switch (ratioValue) {
        case "16:9": return "YouTube";
        case "9:16": return "TikTok, Stories";
        case "1:1":  return "Instagram Post";
        case "4:5":  return "Instagram Feed";
        default:     return "";
      }
    } else if (mode === "branding") {
      switch (ratioValue) {
        case "16:9": return "Banners, Apresentações";
        case "1:1":  return "Logos, Avatares";
        case "4:5":  return "Posts Verticais";
        case "3:2":  return "Cartões de visita";
        default:     return "";
      }
    }
    const ratioConfig = aspectRatios.find(r => r.value === ratioValue);
    return ratioConfig ? ratioConfig.description : "";
  };

  return (
    // O div que envolve todo o seletor
    // A classe de espaçamento geral (space-y-X) é controlada aqui
    <div className={`space-y-${compact ? "1" : "2"}`}>
      {/*
        Título para a seção de Aspect Ratio.
        Aparece apenas se 'compact' for false.
        A div que você mencionou no app/page.tsx para "Aspect Ratio"
        ( <h3 className="text-base font-medium mb-3">Aspect Ratio</h3> )
        será substituída por este título interno ao componente, para melhor encapsulamento.
      */}
      {!compact && (
        <h3 className="text-sm font-medium text-gray-300">
          Formato da Imagem {/* Ou "Proporção", "Tamanho" */}
        </h3>
      )}
      {/* Grid com os botões de aspect ratio */}
      <div className={`grid grid-cols-3 ${compact ? "gap-1.5" : "gap-2"}`}>
        {aspectRatios.map((ratio) => (
          <button
            key={ratio.value}
            onClick={() => onChange(ratio.value)}
            title={`${ratio.label} (${ratio.value}) - ${getModeSpecificDescription(ratio.value)}`}
            className={cn(
              `flex flex-col items-center justify-center ${compact ? "p-1.5 py-2" : "p-2"} rounded-lg border transition-all duration-200 text-xs focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 outline-none`,
              value === ratio.value
                ? "bg-purple-900/40 border-purple-600 text-purple-300 shadow-md"
                : "bg-gray-800/60 border-gray-700/70 text-gray-400 hover:bg-gray-700/60 hover:border-gray-600",
            )}
          >
            <div
              className={cn(
                "mb-1.5 border border-current",
                ratio.iconClass
              )}
            ></div>
            <span className={`text-[11px] ${compact ? 'font-medium' : ''}`}>{ratio.label}</span>
            {/* A descrição detalhada só aparece se não for compacto */}
            {!compact && (
              <span className="text-[9px] text-gray-500 mt-0.5 truncate w-full px-0.5">
                {getModeSpecificDescription(ratio.value)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}