"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import type { Track } from "@/types"

interface AlbumArtProps {
  track: Track | undefined
  isPlaying: boolean
  audioData: number[]
}

export default function AlbumArt({ track, isPlaying, audioData }: AlbumArtProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!track) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.clientWidth * dpr
    canvas.height = canvas.clientHeight * dpr
    ctx.scale(dpr, dpr)

    // Load album art
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = track.coverUrl

    img.onload = () => {
      const animate = () => {
        if (!canvas || !ctx) return

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

        // Draw album art
        ctx.save()
        ctx.beginPath()
        ctx.arc(
          canvas.width / (2 * dpr),
          canvas.height / (2 * dpr),
          Math.min(canvas.width, canvas.height) / (2.2 * dpr),
          0,
          Math.PI * 2,
        )
        ctx.closePath()
        ctx.clip()

        const size = Math.min(canvas.width, canvas.height) / dpr
        ctx.drawImage(img, (canvas.width / dpr - size) / 2, (canvas.height / dpr - size) / 2, size, size)

        // Apply effects based on audio data if playing
        if (isPlaying && audioData.length > 0) {
          // Create a distortion effect based on audio data
          const avgAudioData = audioData.reduce((sum, value) => sum + value, 0) / audioData.length
          const distortionFactor = (avgAudioData / 255) * 10

          // Apply a subtle wave effect
          ctx.globalCompositeOperation = "source-atop"

          // Draw ripple effects
          for (let i = 0; i < 3; i++) {
            const radius = Math.min(canvas.width, canvas.height) / (2.2 * dpr) + i * 10 + distortionFactor * 2
            const opacity = 0.5 - i * 0.15

            ctx.strokeStyle = `rgba(138, 43, 226, ${opacity})`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(canvas.width / (2 * dpr), canvas.height / (2 * dpr), radius, 0, Math.PI * 2)
            ctx.stroke()
          }

          // Add glow effect
          ctx.shadowColor = "#8b5cf6"
          ctx.shadowBlur = 15 + distortionFactor
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        }

        // Draw vinyl record effect
        ctx.beginPath()
        ctx.arc(canvas.width / (2 * dpr), canvas.height / (2 * dpr), 20 / dpr, 0, Math.PI * 2)
        ctx.fillStyle = "#000"
        ctx.fill()

        ctx.beginPath()
        ctx.arc(canvas.width / (2 * dpr), canvas.height / (2 * dpr), 8 / dpr, 0, Math.PI * 2)
        ctx.fillStyle = "#333"
        ctx.fill()

        ctx.restore()

        // Rotation animation for vinyl effect
        if (isPlaying) {
          ctx.save()
          ctx.translate(canvas.width / (2 * dpr), canvas.height / (2 * dpr))
          ctx.rotate((Date.now() / 1000) % (Math.PI * 2))
          ctx.translate(-canvas.width / (2 * dpr), -canvas.height / (2 * dpr))

          // Draw grooves
          for (let i = 1; i < 10; i++) {
            ctx.beginPath()
            ctx.arc(
              canvas.width / (2 * dpr),
              canvas.height / (2 * dpr),
              (Math.min(canvas.width, canvas.height) / (2.2 * dpr)) * (0.4 + i * 0.06),
              0,
              Math.PI * 2,
            )
            ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`
            ctx.lineWidth = 1
            ctx.stroke()
          }

          ctx.restore()
        }

        requestAnimationFrame(animate)
      }

      animate()
    }

    return () => {
      // Cleanup
    }
  }, [track, isPlaying, audioData])

  if (!track) {
    return (
      <div className="w-full aspect-square rounded-lg bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">No track selected</p>
      </div>
    )
  }

  return (
    <motion.div
      className="w-full aspect-square rounded-lg overflow-hidden relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      key={track.id}
    >
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Vinyl record center hole */}
      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2">
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-gray-700 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Glow effect */}
      <div
        className={`absolute inset-0 bg-purple-500 bg-opacity-20 rounded-lg filter blur-xl transition-opacity duration-500 ${
          isPlaying ? "opacity-100" : "opacity-0"
        }`}
      />
    </motion.div>
  )
}

