import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

interface RouteParams {
  params: {
    filename: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { filename } = params
    
    // Проверяем безопасность пути
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 })
    }

    const filepath = path.join(process.cwd(), 'public', 'uploads', 'offers', filename)
    
    if (!existsSync(filepath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    const file = await readFile(filepath)
    
    // Определяем тип контента по расширению
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.png':
        contentType = 'image/png'
        break
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.webp':
        contentType = 'image/webp'
        break
      case '.svg':
        contentType = 'image/svg+xml'
        break
    }

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('Error serving image:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
