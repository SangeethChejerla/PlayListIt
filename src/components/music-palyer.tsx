"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Howl } from "howler"
import FileSelector from "./file-selector"
import MusicControls from "./music-controls"
import Visualizer from "@/components/visualizer"
import Playlist from "@/components/Playlist"
import type { Track } from "@/types"
import AlbumArt from "./album-art"
import ParticleSystem from "@/components/particle-system"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

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
          playNextTrack()
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
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect()
    }

    analyserRef.current = audioContextRef.current.createAnalyser()
    analyserRef.current.fftSize = 256

    // Connect Howler to the analyser
    const source = audioContextRef.current.createMediaElementSource((Howler as any)._howls[0]._sounds[0]._node)
    source.connect(analyserRef.current)
    analyserRef.current.connect(audioContextRef.current.destination)

    const updateAudioData = () => {
      if (!analyserRef.current) return

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      setAudioData(Array.from(dataArray))
      animationRef.current = requestAnimationFrame(updateAudioData)
    }

    updateAudioData()
  }

  const updateSeek = () => {
    if (soundRef.current && isPlaying) {
      setSeek(soundRef.current.seek())
      animationRef.current = requestAnimationFrame(updateSeek)
    }
  }

  const handleFileSelect = async (files: FileList) => {
    const newTracks: Track[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.includes("audio")) {
        const url = URL.createObjectURL(file)

        // Create a temporary Howl to get metadata
        const tempSound = new Howl({
          src: [url],
          format: [file.name.split(".").pop() || ""],
        })

        newTracks.push({
          id: `track-${Date.now()}-${i}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Unknown Artist",
          album: "Unknown Album",
          url: url,
          duration: 0,
          coverUrl: "/placeholder.svg?height=300&width=300",
          file: file,
        })
      }
    }

    setTracks((prev) => [...prev, ...newTracks])

    if (currentTrackIndex === -1 && newTracks.length > 0) {
      setCurrentTrackIndex(0)
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

  const playNextTrack = () => {
    if (tracks.length === 0) return
    const nextIndex = (currentTrackIndex + 1) % tracks.length
    setCurrentTrackIndex(nextIndex)
  }

  const playPreviousTrack = () => {
    if (tracks.length === 0) return
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length
    setCurrentTrackIndex(prevIndex)
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

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    " ": handlePlayPause,
    ArrowRight: playNextTrack,
    ArrowLeft: playPreviousTrack,
    p: () => setShowPlaylist(!showPlaylist),
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
                    onPlayPause={handlePlayPause}
                    onSeek={handleSeek}
                    onNext={playNextTrack}
                    onPrevious={playPreviousTrack}
                    onVolumeChange={handleVolumeChange}
                  />
                </div>
              </div>

              <div className="w-full mt-6">
                <FileSelector onFileSelect={handleFileSelect} />

                <motion.button
                  onClick={() => setActiveView("playlist")}
                  className="mt-4 px-6 py-2 bg-purple-900 bg-opacity-30 backdrop-blur-md rounded-full text-white border border-purple-500 hover:bg-purple-800 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Playlist
                </motion.button>
              </div>
            </div>
          ) : (
            <Playlist
              tracks={tracks}
              currentTrackIndex={currentTrackIndex}
              onTrackSelect={handleTrackSelect}
              playlists={playlists}
              onCreatePlaylist={createPlaylist}
              onAddToPlaylist={addToPlaylist}
              onBack={() => setActiveView("player")}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

