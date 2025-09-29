'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  offerId: string
  currentImageUrl?: string
  onSuccess?: (imageUrl: string) => void
}

export function ImageUpload({ offerId, currentImageUrl, onSuccess }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`/api/offers/${offerId}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast.success('Изображение загружено успешно')
      onSuccess?.(data.imageUrl)
    },
    onError: (error: Error) => {
      console.error('Error uploading image:', error)
      toast.error(error.message)
    },
  })

  const handleFileSelect = (file: File) => {
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      toast.error('Файл должен быть изображением')
      return
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB')
      return
    }

    uploadMutation.mutate(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Текущее изображение */}
      {currentImageUrl && (
        <div className="relative aspect-square w-full max-w-xs mx-auto">
          <Image
            src={currentImageUrl}
            alt="Current image"
            fill
            className="object-cover rounded-lg"
            unoptimized={currentImageUrl.startsWith('https://cdn.example.com') || currentImageUrl.startsWith('https://example.com')}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Зона загрузки */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploadMutation.isPending}
        />

        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">Загрузка изображения...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              Перетащите изображение сюда или нажмите для выбора
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF до 5MB
            </p>
          </div>
        )}
      </div>

      {/* Кнопка загрузки */}
      <Button
        onClick={handleClick}
        disabled={uploadMutation.isPending}
        className="w-full"
        variant="outline"
      >
        {uploadMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Загрузка...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Выбрать файл
          </>
        )}
      </Button>
    </div>
  )
}
