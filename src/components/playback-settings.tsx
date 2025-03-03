"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings } from "lucide-react"

interface PlaybackSettingsProps {
  speed: number
  onSpeedChange: (speed: number) => void
}

export default function PlaybackSettings({ speed, onSpeedChange }: PlaybackSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full ${
          speed !== 1 ? "text-purple-400 bg-purple-900 bg-opacity-30" : "text-white hover:bg-gray-800"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Playback Speed"
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-900 bg-opacity-90 backdrop-blur-md rounded-lg z-50 min-w-[120px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="space-y-1">
                {speeds.map((s) => (
                  <button
                    key={s}
                    className={`w-full px-3 py-1.5 text-sm rounded-md text-left ${
                      speed === s ? "bg-purple-600 text-white" : "text-gray-200 hover:bg-gray-800"
                    }`}
                    onClick={() => {
                      onSpeedChange(s)
                      setIsOpen(false)
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

