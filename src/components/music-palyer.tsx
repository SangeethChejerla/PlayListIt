"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Howl } from "howler"
import FileSelector from "./file-selector"
import MusicControls from "./music-controls"
import Visualizer from "./visualizer"
import Playlist from "./Playlist"
import type { Track } from "@/types"
import AlbumArt from "./album-art"
import ParticleSystem from "./particle-system"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import KeyboardShortcuts from "./keyboard-shortcuts"

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [seek, setSeek] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [audioData, setAudioData] = useState<number[]>([])
  const [playlists, setPlaylists] = useState<{ name: string; tracks: Track[] }[]>([])
  const [activeView, setActiveView] = useState<"player" | "playlist">("player")
  const [loopMode, setLoopMode] = useState<"none" | "one" | "all">("none")
  const [shuffleMode, setShuffleMode] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const soundRef = useRef<Howl | null>(null)
  const animationRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const currentTrack = tracks[currentTrackIndex]

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unload()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.rate(playbackSpeed)
    }
  }, [playbackSpeed])

  useEffect(() => {
    if (currentTrackIndex >= 0 && tracks.length > 0) {
      if (soundRef.current) {
        soundRef.current.unload()
      }

      const sound = new Howl({
        src: [tracks[currentTrackIndex].url],
        format: ["mp3", "wav", "flac"],
        html5: true,
        volume: volume,
        onload: () => {
          setDuration(sound.duration())
          setupAudioAnalyser(sound)
          // Auto-play when a track is loaded
          sound.play()
        },
        onplay: () => {
          setIsPlaying(true)
          requestAnimationFrame(updateSeek)
        },
        onpause: () => {
          setIsPlaying(false)
        },
        onstop: () => {
          setIsPlaying(false)
        },
        onend: () => {
          handleTrackEnd()
        },
      })

      soundRef.current = sound
    }
  }, [currentTrackIndex, tracks, volume])

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume)
    }
  }, [volume])

  const setupAudioAnalyser = (sound: Howl) => {
    // Create AudioContext if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Clean up previous connections
    if (analyserRef.current) {
      analyserRef.current.disconnect()
    }

    try {
      // Create and configure analyser node
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256

      // Get the current Howler audio node
      const audioNode = (sound as any)._sounds[0]._node

      // Create and connect the audio source
      const source = audioContextRef.current.createMediaElementSource(audioNode)
      source.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)

      // Update audio data for visualization
      const updateAudioData = () => {
        if (!analyserRef.current) return

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        setAudioData(Array.from(dataArray))
        animationRef.current = requestAnimationFrame(updateAudioData)
      }

      updateAudioData()
    } catch (error) {
      console.error('Error setting up audio analyser:', error)
      // Reset audio data if visualization fails
      setAudioData([])
    }
  }

  const updateSeek = () => {
    if (soundRef.current && isPlaying) {
      setSeek(soundRef.current.seek())
      animationRef.current = requestAnimationFrame(updateSeek)
    }
  }

  const handleFileSelect = async (files: FileList) => {
    try {
      const newTracks: Track[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.type.includes("audio")) {
          // Create a copy of the file to avoid permission issues
          const fileData = await file.arrayBuffer()
          const newFile = new File([fileData], file.name, { type: file.type })
          const url = URL.createObjectURL(newFile)

          // Create a temporary audio element to get duration
          const audio = new Audio()
          audio.src = url

          // Wait for metadata to load to get duration
          await new Promise((resolve) => {
            audio.addEventListener("loadedmetadata", () => {
              resolve(true)
            })
          })

          newTracks.push({
            id: `track-${Date.now()}-${i}`,
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: "Unknown Artist",
            album: "Unknown Album",
            url: url,
            duration: audio.duration,
            coverUrl: "/placeholder.svg?height=300&width=300",
            file: newFile,
          })
        }
      }

      if (newTracks.length > 0) {
        setTracks((prev) => [...prev, ...newTracks])

        // If no track is currently selected, select the first new track
        if (currentTrackIndex === -1) {
          setCurrentTrackIndex(0)
        }
      }
    } catch (error) {
      console.error("Error processing files:", error)
    }
  }

  const handlePlayPause = () => {
    if (!soundRef.current) return

    if (isPlaying) {
      soundRef.current.pause()
    } else {
      soundRef.current.play()
    }
  }

  const handleSeek = (value: number) => {
    if (!soundRef.current) return
    soundRef.current.seek(value)
    setSeek(value)
  }

  const handleTrackEnd = () => {
    if (loopMode === "one") {
      // Replay the same track
      if (soundRef.current) {
        soundRef.current.seek(0)
        soundRef.current.play()
      }
    } else if (tracks.length > 0) {
      if (shuffleMode && tracks.length > 1) {
        // Play a random track (different from current)
        let randomIndex
        do {
          randomIndex = Math.floor(Math.random() * tracks.length)
        } while (randomIndex === currentTrackIndex && tracks.length > 1)
        setCurrentTrackIndex(randomIndex)
      } else if (loopMode === "all") {
        // Play next track or loop back to first
        const nextIndex = (currentTrackIndex + 1) % tracks.length
        setCurrentTrackIndex(nextIndex)
      } else if (currentTrackIndex < tracks.length - 1) {
        // Play next track if available
        setCurrentTrackIndex(currentTrackIndex + 1)
      }
    }
  }

  const playNextTrack = () => {
    if (tracks.length === 0) return

    if (shuffleMode && tracks.length > 1) {
      // Play a random track (different from current)
      let randomIndex
      do {
        randomIndex = Math.floor(Math.random() * tracks.length)
      } while (randomIndex === currentTrackIndex && tracks.length > 1)
      setCurrentTrackIndex(randomIndex)
    } else {
      // Play next track or loop back to first
      const nextIndex = (currentTrackIndex + 1) % tracks.length
      setCurrentTrackIndex(nextIndex)
    }
  }

  const playPreviousTrack = () => {
    if (tracks.length === 0) return

    if (shuffleMode && tracks.length > 1) {
      // Play a random track (different from current)
      let randomIndex
      do {
        randomIndex = Math.floor(Math.random() * tracks.length)
      } while (randomIndex === currentTrackIndex && tracks.length > 1)
      setCurrentTrackIndex(randomIndex)
    } else {
      // Play previous track or loop to last
      const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length
      setCurrentTrackIndex(prevIndex)
    }
  }

  const handleVolumeChange = (value: number) => {
    setVolume(value)
  }

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index)
    if (soundRef.current) {
      soundRef.current.stop()
      soundRef.current.play()
    }
  }

  const createPlaylist = (name: string) => {
    setPlaylists([...playlists, { name, tracks: [] }])
  }

  const addToPlaylist = (playlistIndex: number, track: Track) => {
    const updatedPlaylists = [...playlists]
    updatedPlaylists[playlistIndex].tracks.push(track)
    setPlaylists(updatedPlaylists)
  }

  const toggleLoopMode = () => {
    setLoopMode((current) => {
      if (current === "none") return "one"
      if (current === "one") return "all"
      return "none"
    })
  }

  const toggleShuffleMode = () => {
    setShuffleMode((current) => !current)
  }

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
  }

  const toggleShortcutsDisplay = () => {
    setShowShortcuts(!showShortcuts)
  }

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    " ": handlePlayPause,
    ArrowRight: playNextTrack,
    ArrowLeft: playPreviousTrack,
    l: toggleLoopMode,
    s: toggleShuffleMode,
    p: () => setShowPlaylist(!showPlaylist),
    k: toggleShortcutsDisplay,
  })

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center">
      <ParticleSystem audioData={audioData} isPlaying={isPlaying} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative z-10 w-full max-w-4xl"
        >
          {activeView === "player" ? (
            <div className="flex flex-col items-center">
              <div className="w-full flex flex-col md:flex-row gap-8 p-6">
                <div className="flex-1">
                  <AlbumArt track={currentTrack} isPlaying={isPlaying} audioData={audioData} />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="mb-8">
                    <motion.h1
                      className="text-4xl font-bold text-white mb-2 line-clamp-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={currentTrack?.title}
                      transition={{ delay: 0.2 }}
                    >
                      {currentTrack?.title || "No track selected"}
                    </motion.h1>
                    <motion.p
                      className="text-xl text-purple-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={currentTrack?.artist}
                      transition={{ delay: 0.3 }}
                    >
                      {currentTrack?.artist || "Select a track to play"}
                    </motion.p>
                  </div>

                  <Visualizer audioData={audioData} isPlaying={isPlaying} />

                  <MusicControls
                    isPlaying={isPlaying}
                    duration={duration}
                    currentTime={seek}
                    volume={volume}
                    loopMode={loopMode}
                    shuffleMode={shuffleMode}
                    playbackSpeed={playbackSpeed}
                    onPlayPause={handlePlayPause}
                    onSeek={handleSeek}
                    onNext={playNextTrack}
                    onPrevious={playPreviousTrack}
                    onVolumeChange={handleVolumeChange}
                    onToggleLoop={toggleLoopMode}
                    onToggleShuffle={toggleShuffleMode}
                    onPlaybackSpeedChange={handlePlaybackSpeedChange}
                  />
                </div>
              </div>

              <div className="w-full p-4">
                <FileSelector onFileSelect={handleFileSelect} />
                
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => setActiveView("playlist")}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-md text-white transition-colors"
                  >
                    View Playlist
                  </button>
                  <button
                    onClick={toggleShortcutsDisplay}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-md text-white transition-colors"
                  >
                    Keyboard Shortcuts
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-black/80 backdrop-blur-lg p-6 rounded-xl">
              <Playlist
                tracks={tracks}
                currentTrackIndex={currentTrackIndex}
                onTrackSelect={handleTrackSelect}
                playlists={playlists}
                onCreatePlaylist={createPlaylist}
                onAddToPlaylist={addToPlaylist}
                onBackToPlayer={() => setActiveView("player")}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Keyboard shortcuts modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={toggleShortcutsDisplay}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 p-8 rounded-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <KeyboardShortcuts />
              <button 
                className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-md text-white transition-colors"
                onClick={toggleShortcutsDisplay}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}