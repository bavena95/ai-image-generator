"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"

type ToolPanelProps = {
  isOpen: boolean
  onClose: () => void
}

export function ToolPanel({ isOpen, onClose }: ToolPanelProps) {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: isOpen ? 0 : 300, opacity: isOpen ? 1 : 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute top-24 right-4 z-50 w-64 bg-gray-900/90 backdrop-blur-lg rounded-2xl border border-gray-800/50 shadow-xl shadow-purple-900/10 overflow-hidden"
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-800/50">
        <h3 className="font-medium text-gray-200">Tools</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="text-sm text-gray-300 mb-2 block">Image Resolution</label>
          <select className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg p-2 text-sm text-gray-200">
            <option>512 x 512</option>
            <option>768 x 768</option>
            <option>1024 x 1024</option>
            <option>Custom...</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-300 mb-2 block">Generation Steps</label>
          <div className="flex items-center">
            <input
              type="range"
              min="20"
              max="100"
              defaultValue="50"
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="ml-2 text-sm text-gray-400">50</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300 mb-2 block">Guidance Scale</label>
          <div className="flex items-center">
            <input
              type="range"
              min="1"
              max="20"
              defaultValue="7"
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="ml-2 text-sm text-gray-400">7</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300 mb-2 block">Seed (Optional)</label>
          <input
            type="text"
            placeholder="Random"
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg p-2 text-sm text-gray-200"
          />
        </div>

        <div className="pt-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">Save Parameters</span>
          </label>
        </div>
      </div>
    </motion.div>
  )
}
