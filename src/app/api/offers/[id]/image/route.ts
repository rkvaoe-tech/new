import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'
import { existsSync, mkdirSync } from 'fs'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/offers/[id]/image - загрузить изображение для оффера
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    // Проверяем, что оффер существует
    const offer = await prisma.offer.findUnique({
      where: { id }
    })
    
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    
    console.log('FormData keys:', Array.from(formData.keys()))
    console.log('File received:', file ? file.name : 'no file')
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 400 })
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must not exceed 5MB' }, { status: 400 })
    }

    // Создаем директорию для загрузок если её нет
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'offers')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    // Генерируем уникальное имя файла
    const extension = path.extname(file.name)
    const filename = `${id}-${Date.now()}${extension}`
    const filepath = path.join(uploadsDir, filename)

    // Сохраняем файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Формируем URL для изображения
    const imageUrl = `/uploads/offers/${filename}`
    
    console.log('Generated imageUrl:', imageUrl)
    console.log('File saved to:', filepath)

    // Обновляем оффер с новым URL изображения
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: { imageUrl },
      include: { landings: true }
    })
    
    console.log('Updated offer imageUrl:', updatedOffer.imageUrl)

    return NextResponse.json({
      imageUrl,
      offer: updatedOffer
    })

  } catch (error) {
    const { id } = await params
    console.error(`POST /api/offers/${id}/image error:`, error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
