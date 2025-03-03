"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Repeat, Repeat1, Shuffle } from "lucide-react"

interface MusicControlsProps {
  isPlaying: boolean
  duration: number
  currentTime: number
  volume: number
  loopMode: "none" | "one" | "all"
  shuffleMode: boolean
  playbackSpeed: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  onNext: () => void
  onPrevious: () => void
  onVolumeChange: (volume: number) => void
  onToggleLoop: () => void
  onToggleShuffle: () => void
  onPlaybackSpeedChange: (speed: number) => void
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

export default function MusicControls({
  isPlaying,
  duration,
  currentTime,
  volume,
  loopMode,
  shuffleMode,
  onPlayPause,
  onSeek,
  onNext,
  onPrevious,
  onVolumeChange,
  onToggleLoop,
  onToggleShuffle,
}: MusicControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [seekHoverPosition, setSeekHoverPosition] = useState<number | null>(null)

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => onSeek(parseFloat(e.target.value))
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => onVolumeChange(parseFloat(e.target.value))

  const handleSeekBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    const hoverTime = position * duration
    if (hoverTime >= 0 && hoverTime <= duration) setSeekHoverPosition(hoverTime)
  }

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    const seekTime = position * duration
    if (seekTime >= 0 && seekTime <= duration) onSeek(seekTime)
  }

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div className="w-full">
      <div
        className="relative w-full h-12 cursor-pointer"
        onMouseMove={handleSeekBarHover}
        onMouseLeave={() => setSeekHoverPosition(null)}
        onClick={handleSeekBarClick}
      >
        {seekHoverPosition !== null && (
          <div
            className="absolute bottom-full mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded -translate-x-1/2"
            style={{ left: `${(seekHoverPosition / duration) * 100}%` }}
          >
            {formatTime(seekHoverPosition)}
          </div>
        )}
        <div className="absolute bottom-0 w-full h-1 bg-gray-700 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          />
          {seekHoverPosition !== null && (
            <div
              className="absolute h-full bg-white/30"
              style={{ width: `${(seekHoverPosition / duration) * 100}%` }}
            />
          )}
        </div>
        <div className="absolute bottom-3 left-0 text-xs text-gray-400">{formatTime(currentTime)}</div>
        <div className="absolute bottom-3 right-0 text-xs text-gray-400">{formatTime(duration)}</div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={onToggleShuffle}
            className={`p-2 rounded-full ${shuffleMode ? "text-purple-400 bg-purple-900/30" : "text-white hover:bg-gray-800"}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Shuffle className="w-5 h-5" />
          </motion.button>
          <motion.button onClick={onPrevious} className="p-2 text-white hover:bg-gray-800 rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <SkipBack className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={onPlayPause}
            className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
          </motion.button>
          <motion.button onClick={onNext} className="p-2 text-white hover:bg-gray-800 rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <SkipForward className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={onToggleLoop}
            className={`p-2 rounded-full ${loopMode !== "none" ? "text-purple-400 bg-purple-900/30" : "text-white hover:bg-gray-800"}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {loopMode === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </motion.button>
        </div>
        <div className="relative">
          <motion.button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="p-2 text-white hover:bg-gray-800 rounded-full"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <VolumeIcon />
          </motion.button>
          {showVolumeSlider && (
            <motion.div
              className="absolute bottom-full mb-2 p-2 bg-gray-900/90 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-700 rounded-lg cursor-pointer"
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}