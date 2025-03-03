"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { FolderOpen } from "lucide-react"

// Properly type the File System Access API
declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode: string }) => Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemDirectoryHandle {
  kind: 'directory';
  name: string;
  entries: () => AsyncIterable<[string, FileSystemHandle]>;
}

interface FileSystemFileHandle {
  kind: 'file';
  name: string;
  getFile: () => Promise<File>;
}

type FileSystemHandle = FileSystemDirectoryHandle | FileSystemFileHandle;

interface FileSelectorProps {
  onFileSelect: (files: FileList) => void
}

export default function FileSelector({ onFileSelect }: FileSelectorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    // Check if File System Access API is available
    if (typeof window === 'undefined' || !window.showDirectoryPicker) {
      setError("Your browser doesn't support folder selection. Try dragging files instead.")
      return;
    }

    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: "read",
      });

      const audioFiles: File[] = [];

      // Recursive function to get all files
      async function getFilesRecursively(handle: FileSystemDirectoryHandle, path = "") {
        for await (const entry of handle.entries()) {
          const [name, fileHandle] = entry;
          if (fileHandle.kind === "file") {
            try {
              const file = await (fileHandle as FileSystemFileHandle).getFile();
              if (file.type.includes("audio")) {
                audioFiles.push(file);
              }
            } catch (err) {
              console.error("Error accessing file:", err);
            }
          } else if (fileHandle.kind === "directory") {
            await getFilesRecursively(fileHandle as FileSystemDirectoryHandle, `${path}${fileHandle.name}/`);
          }
        }
      }

      await getFilesRecursively(dirHandle);

      if (audioFiles.length > 0) {
        if (typeof DataTransfer === 'undefined') {
          setError("Your browser doesn't fully support this feature. Try dragging files instead.");
          return;
        }
        
        // Convert array to FileList-like object
        const dataTransfer = new DataTransfer();
        audioFiles.forEach((file) => dataTransfer.items.add(file));
        onFileSelect(dataTransfer.files);
      } else {
        setError("No audio files found in the selected directory");
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
      if (error instanceof Error) {
        if (error.name === "SecurityError") {
          setError("Permission denied to access directory");
        } else if (error.name === "NotAllowedError") {
          setError("Permission to access directory was denied");
        } else if (error.name !== "AbortError") { // Don't show error if user just canceled
          setError(`Failed to select directory: ${error.message}`);
        }
      } else {
        setError("Failed to select directory. Please try again");
      }
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

      {error && (
        <motion.div className="mt-2 text-red-400 text-sm text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.div>
      )}

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