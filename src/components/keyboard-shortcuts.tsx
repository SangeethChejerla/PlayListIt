"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Keyboard, X } from "lucide-react"

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  const shortcuts = [
    { key: "Space", description: "Play/Pause" },
    { key: "←", description: "Previous track" },
    { key: "→", description: "Next track" },
    { key: "L", description: "Toggle loop mode" },
    { key: "S", description: "Toggle shuffle" },
    { key: "P", description: "Toggle playlist view" },
  ]

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-900 bg-opacity-70 backdrop-blur-md rounded-full text-white shadow-lg hover:bg-gray-800"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Keyboard Shortcuts"
      >
        <Keyboard className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-70 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-90 backdrop-blur-md p-6 rounded-xl shadow-2xl z-50 w-80"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Keyboard Shortcuts</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <motion.div
                    key={shortcut.key}
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="text-white">{shortcut.description}</span>
                    <span className="px-3 py-1 bg-gray-800 rounded-md text-purple-400 font-mono text-sm">
                      {shortcut.key}
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.p
                className="mt-4 text-sm text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Press these keys anywhere in the app to control playback.
              </motion.p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

