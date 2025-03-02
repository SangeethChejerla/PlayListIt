"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Track } from "@/types"
import { Music, Plus, ChevronLeft, MoreHorizontal } from "lucide-react"
import { formatTime } from "@/lib/utils"

interface PlaylistProps {
  tracks: Track[]
  currentTrackIndex: number
  onTrackSelect: (index: number) => void
  playlists: { name: string; tracks: Track[] }[]
  onCreatePlaylist: (name: string) => void
  onAddToPlaylist: (playlistIndex: number, track: Track) => void
  onBack: () => void
}

export default function Playlist({
  tracks,
  currentTrackIndex,
  onTrackSelect,
  playlists,
  onCreatePlaylist,
  onAddToPlaylist,
  onBack,
}: PlaylistProps) {
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false)
  const [activePlaylistIndex, setActivePlaylistIndex] = useState<number | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number; trackIndex: number } | null>(
    null,
  )

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName)
      setNewPlaylistName("")
      setShowNewPlaylistInput(false)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, trackIndex: number) => {
    e.preventDefault()
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY,
      trackIndex,
    })
  }

  const handleAddToPlaylist = (playlistIndex: number) => {
    if (contextMenuPosition !== null) {
      onAddToPlaylist(playlistIndex, tracks[contextMenuPosition.trackIndex])
      setContextMenuPosition(null)
    }
  }

  const closeContextMenu = () => {
    setContextMenuPosition(null)
  }

  return (
    <div className="w-full bg-gray-900 bg-opacity-50 backdrop-blur-lg rounded-xl p-6">
      <div className="flex items-center mb-6">
        <motion.button
          onClick={onBack}
          className="p-2 text-white rounded-full hover:bg-gray-800 mr-4"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <h2 className="text-2xl font-bold text-white">Your Music</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* All Tracks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">All Tracks</h3>
            <div className="text-sm text-gray-400">{tracks.length} tracks</div>
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {tracks.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No tracks added yet</div>
            ) : (
              <ul className="space-y-2">
                {tracks.map((track, index) => (
                  <motion.li
                    key={track.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer ${
                      index === currentTrackIndex ? "bg-purple-900 bg-opacity-50" : "hover:bg-gray-800"
                    }`}
                    onClick={() => onTrackSelect(index)}
                    onContextMenu={(e) => handleContextMenu(e, index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                      {index === currentTrackIndex ? (
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                      ) : (
                        <Music className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{track.title}</div>
                      <div className="text-gray-400 text-sm truncate">{track.artist}</div>
                    </div>
                    <div className="text-gray-400 text-sm ml-3">{formatTime(track.duration)}</div>
                    <button
                      className="ml-2 p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContextMenu(e, index)
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Playlists */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Playlists</h3>
            <motion.button
              onClick={() => setShowNewPlaylistInput(true)}
              className="p-1 text-white rounded-full hover:bg-gray-800"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>

          <AnimatePresence>
            {showNewPlaylistInput && (
              <motion.div
                className="flex items-center space-x-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreatePlaylist()
                    if (e.key === "Escape") setShowNewPlaylistInput(false)
                  }}
                />
                <motion.button
                  onClick={handleCreatePlaylist}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {playlists.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No playlists created yet</div>
            ) : (
              <ul className="space-y-4">
                {playlists.map((playlist, index) => (
                  <li key={index} className="space-y-2">
                    <motion.button
                      className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700"
                      onClick={() => setActivePlaylistIndex(activePlaylistIndex === index ? null : index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-white font-medium">{playlist.name}</span>
                      <span className="text-gray-400 text-sm">{playlist.tracks.length} tracks</span>
                    </motion.button>

                    <AnimatePresence>
                      {activePlaylistIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-4 border-l-2 border-purple-600 ml-4"
                        >
                          {playlist.tracks.length === 0 ? (
                            <div className="text-gray-500 text-sm p-2">No tracks in this playlist</div>
                          ) : (
                            <ul className="space-y-1">
                              {playlist.tracks.map((track, trackIndex) => (
                                <motion.li
                                  key={`${track.id}-${trackIndex}`}
                                  className="flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                                  whileHover={{ x: 5 }}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: trackIndex * 0.05 }}
                                >
                                  <div className="text-white truncate">{track.title}</div>
                                </motion.li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenuPosition && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
            <motion.div
              className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
              style={{
                top: contextMenuPosition.y,
                left: contextMenuPosition.x,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
            >
              <div className="py-1">
                <div className="px-4 py-2 text-sm text-gray-400">Add to playlist</div>
                {playlists.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">No playlists available</div>
                ) : (
                  playlists.map((playlist, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-700"
                      onClick={() => handleAddToPlaylist(index)}
                    >
                      {playlist.name}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

