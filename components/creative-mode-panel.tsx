"use client"

import type React from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type CreativeModeProps = {
  isOpen: boolean
  onClose: () => void
  currentMode: string
  onModeChange: (mode: string) => void
  modes: {
    id: string
    name: string
    icon: React.ReactNode
  }[]
}

export function CreativeModePanel({ isOpen, onClose, currentMode, onModeChange, modes }: CreativeModeProps) {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute top-24 left-4 z-50 w-64 bg-gray-900/90 backdrop-blur-lg rounded-2xl border border-gray-800/50 shadow-xl shadow-purple-900/10 overflow-hidden"
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-800/50">
        <h3 className="font-medium text-gray-200">Creative Modes</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={cn(
              "w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200",
              currentMode === mode.id ? "bg-purple-900/30 text-purple-200" : "hover:bg-gray-800/50 text-gray-300",
            )}
          >
            <div className={cn("p-2 rounded-lg", currentMode === mode.id ? "bg-purple-800/30" : "bg-gray-800/50")}>
              {mode.icon}
            </div>
            <span>{mode.name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
