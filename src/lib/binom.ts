interface BinomConfig {
  apiKey: string
}

interface BinomDomain {
  id?: number
  name: string
  status?: string
}

interface BinomResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class BinomService {
  private config: BinomConfig

  constructor(config: BinomConfig) {
    this.config = config
  }

  /**
   * Генерирует UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Добавляет домен в Binom трекер
   * Использует endpoint: POST /public/api/v1/domain/{id}
   */
  async addDomain(domain: string): Promise<BinomResponse<BinomDomain>> {
    try {
      // Генерируем UUID v4 для домена
      const domainId = this.generateUUID()
      // Используем базовый URL из переменных окружения
      const baseUrl = process.env.BINOM_BASE_URL || 'https://your-binom-tracker.com'
      const url = `${baseUrl.replace(/\/$/, '')}/public/api/v1/domain/${domainId}`
      
      console.log(`Binom: Adding domain ${domain} with ID ${domainId} to ${url}`)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          host: domain
        }),
      })

      const responseText = await response.text()
      console.log(`Binom response status: ${response.status}`)
      console.log(`Binom response body: ${responseText}`)

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`
        }
      }

      let data
      try {
        data = responseText ? JSON.parse(responseText) : { id: domainId, host: domain }
      } catch (parseError) {
        // Если ответ не JSON, считаем что домен успешно создан
        data = { id: domainId, host: domain }
      }

      return {
        success: true,
        data: {
          id: data.id || domainId,
          name: data.host || domain,
          status: 'active'
        }
      }

    } catch (error) {
      console.error('Binom API error:', error)
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Удаляет домен из Binom трекера
   * Использует endpoint: DELETE /public/api/v1/domain/{id}
   */
  async deleteDomain(domainId: string): Promise<BinomResponse> {
    try {
      const baseUrl = process.env.BINOM_BASE_URL || 'https://your-binom-tracker.com'
      const url = `${baseUrl.replace(/\/$/, '')}/public/api/v1/domain/${domainId}`
      
      console.log(`Binom: Deleting domain ID ${domainId} from ${url}`)
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'api-key': this.config.apiKey,
        },
      })

      const responseText = await response.text()
      console.log(`Binom delete response status: ${response.status}`)
      console.log(`Binom delete response body: ${responseText}`)

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Binom API delete error:', error)
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Получает список доменов пользователя из Binom
   * Использует endpoint: GET /public/api/v1/domain
   */
  async getDomains(): Promise<BinomResponse<BinomDomain[]>> {
    try {
      const baseUrl = process.env.BINOM_BASE_URL || 'https://your-binom-tracker.com'
      const url = `${baseUrl.replace(/\/$/, '')}/public/api/v1/domain`
      
      console.log(`Binom: Getting domains from ${url}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'api-key': this.config.apiKey,
        },
      })

      const responseText = await response.text()
      console.log(`Binom get domains response status: ${response.status}`)

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`
        }
      }

      let data
      try {
        data = responseText ? JSON.parse(responseText) : []
      } catch (parseError) {
        return {
          success: false,
          error: `Invalid JSON response: ${responseText}`
        }
      }

      // Предполагаем, что API возвращает массив доменов или объект с полем data
      const domains = Array.isArray(data) ? data : (data.data || [])

      return {
        success: true,
        data: domains.map((domain: any) => ({
          id: domain.id,
          name: domain.host || domain.name,
          status: domain.status || 'active'
        }))
      }

    } catch (error) {
      console.error('Binom API get domains error:', error)
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Проверяет подключение к Binom API
   * Использует тестовый запрос к API для проверки доступности
   */
  async testConnection(): Promise<BinomResponse> {
    try {
      // Используем общий endpoint для проверки доступности API
      const baseUrl = process.env.BINOM_BASE_URL || 'https://your-binom-tracker.com'
      const url = `${baseUrl.replace(/\/$/, '')}/public/api/v1/domain`
      
      console.log(`Binom: Testing connection to ${url}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'api-key': this.config.apiKey,
        },
      })

      console.log(`Binom test connection response status: ${response.status}`)

      if (response.ok || response.status === 404) {
        // 404 может быть нормальным ответом для GET запроса к endpoint доменов
        return { success: true, message: 'Connection successful' }
      } else if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: `Authentication failed: Invalid API key or insufficient permissions`
        }
      } else {
        const responseText = await response.text()
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`
        }
      }

    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

/**
 * Создает экземпляр BinomService для пользователя
 */
export function createBinomService(user: {
  binomApiKey: string | null
}): BinomService | null {
  if (!user.binomApiKey) {
    console.log('Binom: Missing API key for user')
    return null
  }

  return new BinomService({
    apiKey: user.binomApiKey,
  })
}
