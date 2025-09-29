import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['USER', 'ADMIN'])
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    // Строим условия фильтрации
    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role && role !== 'all') {
      where.role = role
    }

    if (status && status !== 'all') {
      where.isBlocked = status === 'blocked'
    }

    // Получаем общее количество пользователей
    const total = await prisma.appUser.count({ where })

    // Получаем пользователей с пагинацией
    const users = await prisma.appUser.findMany({
      where,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        binomApiKey: true,
        googleSheetsId: true,
        _count: {
          select: {
            domainRequests: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return NextResponse.json({
      users,
      total,
      page,
      pageSize
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Проверяем, не существует ли пользователь с таким email
    const existingUser = await prisma.appUser.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Создаем нового пользователя
    const newUser = await prisma.appUser.create({
      data: {
        email: validatedData.email,
        displayName: validatedData.displayName,
        passwordHash: passwordHash,
        role: validatedData.role,
        isBlocked: false,
      },
      include: {
        _count: {
          select: {
            domainRequests: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: newUser 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
