"use client"
import { cn } from "@/lib/utils"

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "3:2" | "2:3"

interface ThumbnailAspectRatioSelectorProps {
  onChange: (ratio: AspectRatio) => void
  value: AspectRatio
  mode?: string
}

export function ThumbnailAspectRatioSelector({ onChange, value, mode = "general" }: ThumbnailAspectRatioSelectorProps) {
  // Definições de proporções com descrições adaptadas ao contexto
  const aspectRatios: { value: AspectRatio; label: string; description: string }[] = [
    { value: "16:9", label: "Landscape", description: "Ideal for videos, desktop displays" },
    { value: "9:16", label: "Portrait", description: "Perfect for mobile, stories" },
    { value: "1:1", label: "Square", description: "Social media posts" },
    { value: "4:5", label: "Vertical", description: "Instagram, social feeds" },
    { value: "3:2", label: "Classic", description: "Photography, prints" },
    { value: "2:3", label: "Tall", description: "Posters, book covers" },
  ]

  // Descrições específicas para cada modo
  const getModeSpecificDescription = (ratio: AspectRatio) => {
    if (mode === "thumbnails") {
      switch (ratio) {
        case "16:9":
          return "YouTube"
        case "9:16":
          return "TikTok, Stories"
        case "1:1":
          return "Instagram"
        case "4:5":
          return "Instagram Feed"
        default:
          return ""
      }
    } else if (mode === "branding") {
      switch (ratio) {
        case "16:9":
          return "Presentations, headers"
        case "1:1":
          return "Profile pictures, logos"
        case "3:2":
          return "Business cards"
        default:
          return ""
      }
    }
    return ""
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Aspect Ratio</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {aspectRatios.map((ratio) => (
          <button
            key={ratio.value}
            onClick={() => onChange(ratio.value)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 text-xs",
              value === ratio.value
                ? "bg-purple-900/30 border-purple-500/50 text-purple-300"
                : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800/70",
            )}
          >
            <div
              className={cn(
                "mb-1 border border-current",
                ratio.value === "16:9" && "w-12 h-[6.75px] md:w-16 md:h-9",
                ratio.value === "9:16" && "w-[6.75px] h-12 md:w-9 md:h-16",
                ratio.value === "1:1" && "w-8 h-8 md:w-10 md:h-10",
                ratio.value === "4:5" && "w-8 h-10 md:w-10 md:h-[12.5px]",
                ratio.value === "3:2" && "w-12 h-8 md:w-15 md:h-10",
                ratio.value === "2:3" && "w-8 h-12 md:w-10 md:h-15",
              )}
            ></div>
            <span>{ratio.label}</span>
            <span className="text-[10px] text-gray-500 mt-0.5">
              {getModeSpecificDescription(ratio.value) || ratio.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
