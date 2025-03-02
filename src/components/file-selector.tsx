"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { FolderOpen } from "lucide-react"

interface FileSelectorProps {
  onFileSelect: (files: FileList) => void
}

export default function FileSelector({ onFileSelect }: FileSelectorProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files)
    }
  }

  const handleDirectorySelect = async () => {
    try {
      // @ts-ignore - FileSystemDirectoryHandle is not in the TypeScript types yet
      const directoryHandle = await window.showDirectoryPicker()
      const audioFiles: File[] = []

      // Recursive function to get all files in a directory
      async function getFilesRecursively(dirHandle: any, path = "") {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === "file") {
            const file = await entry.getFile()
            if (file.type.includes("audio")) {
              // Create a new file with the path included
              const fileWithPath = new File([file], `${path}${file.name}`, {
                type: file.type,
                lastModified: file.lastModified,
              })
              audioFiles.push(fileWithPath)
            }
          } else if (entry.kind === "directory") {
            // Recursively get files from subdirectories
            await getFilesRecursively(entry, `${path}${entry.name}/`)
          }
        }
      }

      await getFilesRecursively(directoryHandle)

      // Convert array to FileList-like object
      const dataTransfer = new DataTransfer()
      audioFiles.forEach((file) => dataTransfer.items.add(file))
      onFileSelect(dataTransfer.files)
    } catch (error) {
      console.error("Error selecting directory:", error)
    }
  }

  return (
    <div className="w-full">
      <motion.div
        className={`relative p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-purple-500 bg-purple-900 bg-opacity-20"
            : "border-gray-700 hover:border-purple-500 bg-gray-900 bg-opacity-30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <input
          type="file"
          id="file-input"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          multiple
          accept="audio/*"
        />
        <div className="flex flex-col items-center justify-center py-4">
          <FolderOpen className="w-12 h-12 mb-2 text-purple-400" />
          <p className="text-white text-lg mb-1">Drag and drop audio files here</p>
          <p className="text-gray-400 text-sm">or click to select files</p>
        </div>
      </motion.div>

      <div className="mt-4 flex justify-center">
        <motion.button
          onClick={handleDirectorySelect}
          className="px-6 py-2 bg-purple-900 bg-opacity-30 backdrop-blur-md rounded-full text-white border border-purple-500 hover:bg-purple-800 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Select Folder
        </motion.button>
      </div>
    </div>
  )
}

