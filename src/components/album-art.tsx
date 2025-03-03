"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"

interface AlbumArtProps {
  track: { id: string; title: string; url: string } | undefined
  isPlaying: boolean
  audioData: number[]
}

export default function AlbumArt({ track, isPlaying, audioData }: AlbumArtProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef<number>(0)
  const requestRef = useRef<number>(0)

  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return
      const canvas = canvasRef.current
      const container = containerRef.current

      canvas.style.width = "100%"
      canvas.style.height = "100%"
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      const ctx = canvas.getContext("2d")
      if (ctx) ctx.scale(dpr, dpr)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const height = canvas.height / dpr
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2.2

      ctx.clearRect(0, 0, width, height)

      if (isPlaying) rotationRef.current += 0.0582 // 33 1/3 RPM at ~60 FPS

      // Vinyl disc
      ctx.save()
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = "#111"
      ctx.fill()
      ctx.restore()

      // Rotating grooves and label
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotationRef.current)
      ctx.translate(-centerX, -centerY)

      // Grooves
      for (let i = 1; i < 40; i++) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * (0.8 - i * 0.015), 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(30, 30, 30, ${0.3 + (i % 3 === 0 ? 0.2 : 0)})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Reflective highlight
      const gradient = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius)
      gradient.addColorStop(0, "rgba(120, 120, 120, 0.1)")
      gradient.addColorStop(0.5, "rgba(200, 200, 200, 0.2)")
      gradient.addColorStop(1, "rgba(120, 120, 120, 0.1)")
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 0.78, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Center label
      const labelRadius = radius * 0.25
      const labelGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, labelRadius)
      labelGradient.addColorStop(0, "#ffffff")
      labelGradient.addColorStop(1, "#d4d4d8")
      ctx.beginPath()
      ctx.arc(centerX, centerY, labelRadius, 0, Math.PI * 2)
      ctx.fillStyle = labelGradient
      ctx.fill()

      // Center hole
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 0.05, 0, Math.PI * 2)
      ctx.fillStyle = "#111"
      ctx.fill()

      // Label text
      ctx.font = "bold 24px Arial"
      ctx.fillStyle = "#111"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
     

      ctx.restore()

      // Audio-reactive glow
      if (isPlaying && audioData.length > 0) {
        const avgAudioData = audioData.reduce((sum, value) => sum + value, 0) / audioData.length
        const intensity = avgAudioData / 255
        ctx.save()
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 1.05, 0, Math.PI * 2)
        const glowGradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius * 1.2)
        glowGradient.addColorStop(0, `rgba(138, 43, 226, ${intensity * 0.5})`)
        glowGradient.addColorStop(1, "rgba(138, 43, 226, 0)")
        ctx.fillStyle = glowGradient
        ctx.fill()
        ctx.restore()
      }

      requestRef.current = requestAnimationFrame(render)
    }

    requestRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(requestRef.current)
  }, [isPlaying, audioData])

  if (!track) {
    return (
      <div className="w-full aspect-square rounded-lg bg-gray-800 flex items-center justify-center">
        <p className="text-gray-500">No track selected</p>
      </div>
    )
  }

  return (
    <motion.div
      ref={containerRef}
      className="w-full aspect-square rounded-lg overflow-hidden relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      key={track.id}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      <div
        className={`absolute inset-0 -z-10 bg-purple-600 bg-opacity-10 rounded-lg blur-2xl transition-opacity duration-1000 ${
          isPlaying ? "opacity-70" : "opacity-0"
        }`}
      />
      <div
        className={`absolute top-3 right-3 flex items-center bg-black/50 px-2 py-1 rounded-full transition-opacity duration-300 ${
          isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
        <span className="text-xs text-green-400 font-medium">PLAYING</span>
      </div>
    </motion.div>
  )
}