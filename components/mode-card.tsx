"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { useState, useRef } from "react"

type ModeCardProps = {
  name: string
  description: string
  icon: ReactNode
  gradient: string
  isActive: boolean
  onClick: () => void
}

export function ModeCard({ name, description, icon, gradient, isActive, onClick }: ModeCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLButtonElement>(null)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  // Track mouse position for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current || isMobile) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left // x position within the element
    const y = e.clientY - rect.top // y position within the element

    // Calculate position as percentage of card dimensions
    const xPercent = (x / rect.width) * 100
    const yPercent = (y / rect.height) * 100

    setMousePosition({ x: xPercent, y: yPercent })
  }

  // Reset position when mouse leaves
  const handleMouseLeave = () => {
    setIsHovered(false)
    setMousePosition({ x: 50, y: 50 }) // Center position
  }

  // Calculate 3D transform based on mouse position
  const calculateTransform = () => {
    if (!isHovered || isMobile) return {}

    // Calculate tilt angles (max 15 degrees)
    const tiltX = ((mousePosition.y - 50) / 50) * -10
    const tiltY = ((mousePosition.x - 50) / 50) * 10

    return {
      transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.05, 1.05, 1.05)`,
      transition: "transform 0.1s ease",
    }
  }

  return (
    <motion.button
      ref={cardRef}
      onClick={() => {
        // Create ripple animation effect
        const ripple = document.createElement("div")
        ripple.className = "absolute inset-0 bg-white/30 rounded-xl animate-ripple"
        const button = document.activeElement as HTMLElement
        button?.appendChild(ripple)
        setTimeout(() => ripple.remove(), 1000)

        onClick()
      }}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        transformStyle: "preserve-3d",
        ...(isHovered ? calculateTransform() : {}),
      }}
      whileHover={{
        scale: isMobile ? 1.02 : 1.05,
        transition: { duration: 0.2 },
      }}
      whileTap={{
        scale: 0.95,
        rotateX: 0,
        rotateY: 0,
        transition: { duration: 0.1 },
      }}
      animate={
        isActive
          ? {
              scale: [1, 1.08, 1.05],
              boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.5)",
              transition: { duration: 0.5 },
            }
          : {
              scale: 1,
              boxShadow: "0 0px 0px 0px rgba(139, 92, 246, 0)",
              transition: { duration: 0.3 },
            }
      }
      className={cn(
        "flex-shrink-0 w-full h-40 md:h-56 rounded-xl overflow-hidden relative group transition-all duration-300",
        isActive ? "ring-2 ring-white/50 shadow-lg shadow-purple-900/30" : "",
        isHovered ? "shadow-xl" : "shadow-md",
      )}
    >
      {/* 3D lighting effect overlay */}
      {isHovered && !isMobile && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)`,
            mixBlendMode: "overlay",
          }}
        />
      )}

      {/* Background gradient with animated movement */}
      <motion.div
        className={cn("absolute inset-0 bg-gradient-to-br", gradient)}
        animate={
          isHovered || isActive
            ? {
                backgroundPosition: ["0% 0%", "100% 100%"],
                transition: { duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", ease: "linear" },
              }
            : {}
        }
        style={{
          backgroundSize: "200% 200%",
          transform: "translateZ(-10px)", // Push back in 3D space
        }}
      />

      {/* Overlay for better text readability */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
        style={{ transform: "translateZ(-5px)" }} // Push back in 3D space
      />

      {/* Floating particles effect for active card */}
      {isActive && (
        <>
          <motion.div
            className="absolute w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-white/60 blur-[1px]"
            animate={{
              x: [0, 20, 10, 30, 0],
              y: [0, 30, 10, 20, 0],
              opacity: [0, 1, 0.5, 1, 0],
              scale: [0.5, 1, 0.8, 1.2, 0.5],
              z: [5, 15, 10, 20, 5], // Z-axis animation for 3D effect
            }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
            style={{ transformStyle: "preserve-3d" }}
          />
          <motion.div
            className="absolute w-1 h-1 rounded-full bg-white/60 blur-[1px]"
            animate={{
              x: [40, 20, 50, 10, 40],
              y: [30, 10, 40, 50, 30],
              opacity: [0, 0.5, 1, 0.5, 0],
              scale: [0.2, 0.8, 0.4, 1, 0.2],
              z: [10, 20, 15, 5, 10], // Z-axis animation for 3D effect
            }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", delay: 0.5 }}
            style={{ transformStyle: "preserve-3d" }}
          />
          <motion.div
            className="absolute w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-white/60 blur-[1px]"
            animate={{
              x: [50, 30, 20, 40, 50],
              y: [10, 40, 30, 20, 10],
              opacity: [0, 1, 0.5, 1, 0],
              scale: [0.3, 1, 0.6, 0.8, 0.3],
              z: [15, 5, 20, 10, 15], // Z-axis animation for 3D effect
            }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", delay: 1 }}
            style={{ transformStyle: "preserve-3d" }}
          />
        </>
      )}

      {/* Content */}
      <div
        className="absolute inset-0 p-3 md:p-5 flex flex-col justify-end"
        style={{ transform: "translateZ(20px)" }} // Bring forward in 3D space
      >
        <motion.div
          className="mb-auto"
          animate={
            isActive
              ? {
                  y: [0, -5, 0],
                  z: [0, 10, 0], // Z-axis animation for 3D effect
                  transition: {
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  },
                }
              : {}
          }
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.div
            className="p-2 md:p-2.5 bg-white/20 backdrop-blur-sm rounded-xl w-fit"
            whileHover={{ rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
            animate={
              isActive
                ? {
                    scale: [1, 1.1, 1],
                    z: [0, 15, 0], // Z-axis animation for 3D effect
                    transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                  }
                : {}
            }
            style={{ transformStyle: "preserve-3d" }}
          >
            {icon}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ transform: "translateZ(30px)" }} // Bring text forward in 3D space
        >
          <h3 className="text-base md:text-lg font-bold text-white mb-0.5 md:mb-1">{name}</h3>
          <p className="text-xs text-white/80 line-clamp-2">{description}</p>
        </motion.div>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            className="absolute top-2 md:top-3 right-2 md:right-3 w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-white"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
              z: [20, 40, 20], // Z-axis animation for 3D effect
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            style={{ transformStyle: "preserve-3d" }}
          />
        )}
      </div>

      {/* 3D edge effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
          isHovered ? "opacity-100" : "",
        )}
        style={{
          boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)",
          transform: "translateZ(5px)", // Slightly forward in 3D space
        }}
      />

      {/* Selection effect */}
      {isActive && (
        <motion.div
          className="absolute inset-0 border-2 border-white/0 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            borderColor: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.8)", "rgba(255,255,255,0.2)"],
            z: [10, 20, 10], // Z-axis animation for 3D effect
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          style={{ transformStyle: "preserve-3d" }}
        />
      )}
    </motion.button>
  )
}
