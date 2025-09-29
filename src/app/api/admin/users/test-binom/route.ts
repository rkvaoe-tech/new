import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { BinomService } from '@/lib/binom'

const testBinomSchema = z.object({
  binomApiKey: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = testBinomSchema.parse(body)

    // Для тестирования API ключа просто проверяем что он не пустой
    // В реальном приложении можно сделать тестовый запрос к Binom API
    console.log(`Admin ${session.user.email} testing Binom API key`)

    // Простая проверка формата API ключа
    if (validatedData.binomApiKey.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'API key seems too short'
      })
    }

    // В реальной реализации здесь можно сделать тестовый запрос к Binom
    // Пока просто возвращаем успех для любого ключа длиннее 10 символов
    const testResult = {
      success: true,
      message: 'API key format is valid'
    }

    return NextResponse.json({
      success: testResult.success,
      error: testResult.error,
      message: testResult.message
    })

  } catch (error) {
    console.error('Test Binom connection error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
