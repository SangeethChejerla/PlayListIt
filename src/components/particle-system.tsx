"use client"

import { useRef, useEffect } from "react"

interface ParticleSystemProps {
  audioData: number[]
  isPlaying: boolean
}

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

export default function ParticleSystem({ audioData, isPlaying }: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Initialize particles
    particlesRef.current = []

    const resizeHandler = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", resizeHandler)

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return

      // Clear canvas with a semi-transparent black to create trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      const particles = particlesRef.current

      // Create new particles based on audio data
      if (isPlaying && audioData.length > 0) {
        const avgAudioData = audioData.reduce((sum, value) => sum + value, 0) / audioData.length
        const intensity = avgAudioData / 255

        // Create particles based on audio intensity
        if (Math.random() < intensity * 0.3) {
          const bassIntensity = audioData.slice(0, 10).reduce((sum, value) => sum + value, 0) / 10 / 255
          const midIntensity = audioData.slice(10, 30).reduce((sum, value) => sum + value, 0) / 20 / 255
          const highIntensity = audioData.slice(30, 50).reduce((sum, value) => sum + value, 0) / 20 / 255

          // Create particles at random positions
          for (let i = 0; i < Math.floor(intensity * 3); i++) {
            const x = Math.random() * canvas.width
            const y = Math.random() * canvas.height

            // Determine color based on frequency range
            let color
            const colorRand = Math.random()
            if (colorRand < 0.33) {
              // Bass - red/pink
              color = `hsl(${320 + Math.random() * 20}, 100%, ${50 + bassIntensity * 30}%)`
            } else if (colorRand < 0.66) {
              // Mid - purple
              color = `hsl(${270 + Math.random() * 30}, 100%, ${50 + midIntensity * 30}%)`
            } else {
              // High - blue/cyan
              color = `hsl(${180 + Math.random() * 40}, 100%, ${50 + highIntensity * 30}%)`
            }

            particles.push({
              x,
              y,
              size: 1 + Math.random() * 3 * intensity,
              speedX: (Math.random() - 0.5) * 2 * intensity,
              speedY: (Math.random() - 0.5) * 2 * intensity,
              color,
              alpha: 0.7 + Math.random() * 0.3,
              life: 0,
              maxLife: 100 + Math.random() * 100,
            })
          }
        }
      }

      // Update and draw existing particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]

        // Update position
        p.x += p.speedX
        p.y += p.speedY

        // Update life
        p.life++

        // Fade out as life increases
        p.alpha = Math.max(0, 1 - p.life / p.maxLife)

        // Remove dead particles
        if (p.life >= p.maxLife || p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()

        // Add glow effect
        ctx.shadowColor = p.color
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }

      ctx.globalAlpha = 1

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeHandler)
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [audioData, isPlaying])

  // Update particle behavior based on audio data
  useEffect(() => {
    if (!isPlaying || audioData.length === 0) return

    const particles = particlesRef.current
    const avgAudioData = audioData.reduce((sum, value) => sum + value, 0) / audioData.length
    const intensity = avgAudioData / 255

    // Modify existing particles based on audio intensity
    particles.forEach((p) => {
      // Add some randomness to movement based on audio
      p.speedX += (Math.random() - 0.5) * 0.1 * intensity
      p.speedY += (Math.random() - 0.5) * 0.1 * intensity

      // Limit max speed
      const maxSpeed = 2 * intensity
      const speed = Math.sqrt(p.speedX * p.speedX + p.speedY * p.speedY)
      if (speed > maxSpeed) {
        p.speedX = (p.speedX / speed) * maxSpeed
        p.speedY = (p.speedY / speed) * maxSpeed
      }
    })
  }, [audioData, isPlaying])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

