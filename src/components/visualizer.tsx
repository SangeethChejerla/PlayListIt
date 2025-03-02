"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"

interface VisualizerProps {
  audioData: number[]
  isPlaying: boolean
}

export default function Visualizer({ audioData, isPlaying }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    if (!isPlaying || audioData.length === 0) {
      // Draw idle state
      const barCount = 64
      const barWidth = rect.width / barCount
      const barMargin = 2

      ctx.fillStyle = "rgba(139, 92, 246, 0.3)" // Purple with low opacity

      for (let i = 0; i < barCount; i++) {
        const height = Math.random() * 10 + 5
        ctx.fillRect(i * barWidth + barMargin / 2, rect.height / 2 - height / 2, barWidth - barMargin, height)
      }
      return
    }

    // Draw waveform visualization
    const barCount = Math.min(audioData.length, 128)
    const barWidth = rect.width / barCount
    const barMargin = 2

    for (let i = 0; i < barCount; i++) {
      const height = (audioData[i] / 255) * rect.height * 0.8

      // Create gradient
      const gradient = ctx.createLinearGradient(0, rect.height / 2 - height / 2, 0, rect.height / 2 + height / 2)
      gradient.addColorStop(0, "#f0f")
      gradient.addColorStop(0.5, "#8b5cf6")
      gradient.addColorStop(1, "#06b6d4")

      ctx.fillStyle = gradient

      // Draw bar with rounded corners
      const x = i * barWidth + barMargin / 2
      const y = rect.height / 2 - height / 2
      const width = barWidth - barMargin

      ctx.beginPath()
      ctx.moveTo(x + 2, y)
      ctx.lineTo(x + width - 2, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + 2)
      ctx.lineTo(x + width, y + height - 2)
      ctx.quadraticCurveTo(x + width, y + height, x + width - 2, y + height)
      ctx.lineTo(x + 2, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - 2)
      ctx.lineTo(x, y + 2)
      ctx.quadraticCurveTo(x, y, x + 2, y)
      ctx.closePath()
      ctx.fill()

      // Add glow effect
      ctx.shadowColor = "#8b5cf6"
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
  }, [audioData, isPlaying])

  return (
    <motion.div
      className="w-full h-24 mb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </motion.div>
  )
}

