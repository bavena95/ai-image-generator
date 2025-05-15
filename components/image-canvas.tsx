"use client"

import { useRef, useEffect } from "react"

type ImageCanvasProps = {
  width?: number
  height?: number
  activeMode?: string
}

export function ImageCanvas({ width = 1920, height = 1080, activeMode = "general" }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Create a gradient background based on active mode
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)

        // Different gradient colors based on mode
        switch (activeMode) {
          case "branding":
            gradient.addColorStop(0, "rgba(236, 72, 153, 0.1)")
            gradient.addColorStop(1, "rgba(251, 146, 60, 0.05)")
            break
          case "photo-effects":
            gradient.addColorStop(0, "rgba(6, 182, 212, 0.1)")
            gradient.addColorStop(1, "rgba(59, 130, 246, 0.05)")
            break
          case "animals":
            gradient.addColorStop(0, "rgba(34, 197, 94, 0.1)")
            gradient.addColorStop(1, "rgba(16, 185, 129, 0.05)")
            break
          case "food":
            gradient.addColorStop(0, "rgba(234, 179, 8, 0.1)")
            gradient.addColorStop(1, "rgba(249, 115, 22, 0.05)")
            break
          case "enhance":
            gradient.addColorStop(0, "rgba(124, 58, 237, 0.1)")
            gradient.addColorStop(1, "rgba(79, 70, 229, 0.05)")
            break
          default:
            gradient.addColorStop(0, "rgba(76, 29, 149, 0.1)")
            gradient.addColorStop(1, "rgba(124, 58, 237, 0.05)")
        }

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw some particles
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * canvas.width
          const y = Math.random() * canvas.height
          const radius = Math.random() * 2
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(139, 92, 246, 0.3)"
          ctx.fill()
        }

        // Draw connecting lines between some particles
        ctx.strokeStyle = "rgba(139, 92, 246, 0.1)"
        ctx.lineWidth = 0.5
        for (let i = 0; i < 20; i++) {
          const x1 = Math.random() * canvas.width
          const y1 = Math.random() * canvas.height
          const x2 = Math.random() * canvas.width
          const y2 = Math.random() * canvas.height
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
      }
    }
  }, [activeMode])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-30 pointer-events-none transition-opacity duration-1000"
      width={width}
      height={height}
    />
  )
}
