"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from "lucide-react"
import { formatTime } from "@/lib/utils"

interface MusicControlsProps {
  isPlaying: boolean
  duration: number
  currentTime: number
  volume: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  onNext: () => void
  onPrevious: () => void
  onVolumeChange: (volume: number) => void
}

export default function MusicControls({
  isPlaying,
  duration,
  currentTime,
  volume,
  onPlayPause,
  onSeek,
  onNext,
  onPrevious,
  onVolumeChange,
}: MusicControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [seekHoverPosition, setSeekHoverPosition] = useState<number | null>(null)

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number.parseFloat(e.target.value))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(Number.parseFloat(e.target.value))
  }

  const handleSeekBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    setSeekHoverPosition(position * duration)
  }

  const handleSeekBarLeave = () => {
    setSeekHoverPosition(null)
  }

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    onSeek(position * duration)
  }

  const VolumeIcon = () => {
    if (volume === 0) return <VolumeX />
    if (volume < 0.5) return <Volume1 />
    return <Volume2 />
  }

  return (
    <div className="w-full">
      {/* Seek bar */}
      <div
        className="relative w-full h-12 group cursor-pointer"
        onMouseMove={handleSeekBarHover}
        onMouseLeave={handleSeekBarLeave}
        onClick={handleSeekBarClick}
      >
        {/* Seek hover time tooltip */}
        {seekHoverPosition !== null && (
          <div
            className="absolute bottom-full mb-2 px-2 py-1 bg-black bg-opacity-80 text-white text-xs rounded transform -translate-x-1/2 pointer-events-none z-10"
            style={{ left: `${(seekHoverPosition / duration) * 100}%` }}
          >
            {formatTime(seekHoverPosition)}
          </div>
        )}

        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 rounded-full overflow-hidden">
          {/* Progress bar */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />

          {/* Hover indicator */}
          {seekHoverPosition !== null && (
            <div
              className="absolute top-0 left-0 h-full bg-white bg-opacity-30"
              style={{ width: `${(seekHoverPosition / duration) * 100}%` }}
            />
          )}
        </div>

        {/* Time indicators */}
        <div className="absolute bottom-3 left-0 text-xs text-gray-400">{formatTime(currentTime)}</div>
        <div className="absolute bottom-3 right-0 text-xs text-gray-400">{formatTime(duration)}</div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={onPrevious}
            className="p-2 text-white rounded-full hover:bg-gray-800"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>

          <motion.button
            onClick={onPlayPause}
            className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
          </motion.button>

          <motion.button
            onClick={onNext}
            className="p-2 text-white rounded-full hover:bg-gray-800"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="relative">
          <motion.button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="p-2 text-white rounded-full hover:bg-gray-800"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <VolumeIcon />
          </motion.button>

          {showVolumeSlider && (
            <motion.div
              className="absolute bottom-full mb-2 p-2 bg-gray-900 bg-opacity-90 backdrop-blur-md rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

