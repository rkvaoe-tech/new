import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const setupSchema = z.object({
  domains: z.string().min(1),
  cost: z.number().min(0).max(999999.99).nullable().optional(),
  cloudflareApiKey: z.string().min(1),
  cloudflareEmail: z.string().email(),
  namecheapApiUser: z.string().min(1),
  namecheapApiKey: z.string().min(1),
  namecheapUsername: z.string().min(1),
  clientIp: z.string().min(1),
  targetIp: z.string().min(1),
})

interface CloudflareZoneResponse {
  success: boolean
  result?: {
    id: string
    name_servers: string[]
  }
  errors?: Array<{ message: string; code: string }>
}

interface CloudflareDnsResponse {
  success: boolean
  result?: {
    content: string
  }
  errors?: Array<{ message: string; code: string }>
}

interface NamecheapResponse {
  success: boolean
  message?: string
}

// Функция для добавления домена в Cloudflare
async function addDomainToCloudflare(
  apiKey: string,
  email: string,
  domain: string
): Promise<CloudflareZoneResponse> {
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/zones', {
      method: 'POST',
      headers: {
        'X-Auth-Email': email,
        'X-Auth-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
        jump_start: false,
        type: 'full',
      }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      errors: [{ message: `Network error: ${error}`, code: 'NETWORK_ERROR' }],
    }
  }
}

// Функция для удаления всех DNS записей
async function deleteAllDnsRecords(
  apiKey: string,
  email: string,
  zoneId: string
): Promise<{ success: boolean; total: number; deleted: number; failed: number }> {
  try {
    // Получаем все DNS записи
    const listResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=100`,
      {
        headers: {
          'X-Auth-Email': email,
          'X-Auth-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    const listResult = await listResponse.json()
    if (!listResult.success) {
      return { success: false, total: 0, deleted: 0, failed: 0 }
    }

    const records = listResult.result
    const totalRecords = records.length
    let deletedCount = 0
    let failedCount = 0

    // Удаляем каждую запись
    for (const record of records) {
      try {
        const deleteResponse = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`,
          {
            method: 'DELETE',
            headers: {
              'X-Auth-Email': email,
              'X-Auth-Key': apiKey,
              'Content-Type': 'application/json',
            },
          }
        )

        const deleteResult = await deleteResponse.json()
        if (deleteResult.success) {
          deletedCount++
        } else {
          failedCount++
        }
      } catch {
        failedCount++
      }
    }

    return {
      success: true,
      total: totalRecords,
      deleted: deletedCount,
      failed: failedCount,
    }
  } catch {
    return { success: false, total: 0, deleted: 0, failed: 0 }
  }
}

// Функция для добавления A-записи
async function addCloudflareARecord(
  apiKey: string,
  email: string,
  zoneId: string,
  name: string,
  ipAddress: string
): Promise<CloudflareDnsResponse> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'X-Auth-Email': email,
          'X-Auth-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'A',
          name: name,
          content: ipAddress,
          ttl: 1,
          proxied: true,
        }),
      }
    )

    const result = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      errors: [{ message: `Network error: ${error}`, code: 'NETWORK_ERROR' }],
    }
  }
}

// Функция для обновления name-серверов в Namecheap
async function updateNamecheapNameservers(
  apiUser: string,
  apiKey: string,
  username: string,
  clientIp: string,
  domain: string,
  nameServers: string[]
): Promise<NamecheapResponse> {
  try {
    const domainParts = domain.split('.')
    let sld = domainParts[0]
    let tld = domainParts.slice(1).join('.')

    if (domainParts.length > 2) {
      sld = domainParts[0]
      tld = domainParts.slice(1).join('.')
    }

    const params = new URLSearchParams({
      ApiUser: apiUser,
      ApiKey: apiKey,
      UserName: username,
      Command: 'namecheap.domains.dns.setCustom',
      ClientIp: clientIp,
      SLD: sld,
      TLD: tld,
      Nameservers: nameServers.join(','),
    })

    const response = await fetch(
      `https://api.namecheap.com/xml.response?${params.toString()}`
    )

    const responseText = await response.text()

    // Простая проверка XML ответа
    if (responseText.includes('Status="OK"')) {
      return { success: true }
    } else {
      // Попытка извлечь сообщение об ошибке
      const errorMatch = responseText.match(/<Error[^>]*>(.*?)<\/Error>/i)
      const errorMessage = errorMatch ? errorMatch[1] : 'Unknown Namecheap error'
      return { success: false, message: errorMessage }
    }
  } catch (error) {
    return { success: false, message: `Network error: ${error}` }
  }
}

// Функция задержки
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// POST /api/admin/cloudflare/setup - Setup domains in Cloudflare
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = setupSchema.parse(body)

    const domains = validatedData.domains
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0)

    const results = []

    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i]
      const domainNum = i + 1
      console.log(`🌐 Processing domain ${domainNum}/${domains.length}: ${domain}`)

      const domainResult: any = {
        domain,
        cloudflare: { success: false },
        logs: [] // Добавляем массив логов для каждого домена
      }

      // Добавляем лог о начале обработки
      domainResult.logs.push(`🌐 Processing domain ${domainNum}/${domains.length}: ${domain}`)

      // Добавляем домен в Cloudflare
      domainResult.logs.push(`📡 Adding domain to Cloudflare...`)
      const cloudflareResult = await addDomainToCloudflare(
        validatedData.cloudflareApiKey,
        validatedData.cloudflareEmail,
        domain
      )

      domainResult.cloudflare = cloudflareResult

      if (cloudflareResult.success && cloudflareResult.result) {
        const zoneId = cloudflareResult.result.id
        domainResult.logs.push(`✅ Domain added to Cloudflare successfully`)
        domainResult.logs.push(`📋 Zone ID: ${zoneId}`)
        domainResult.logs.push(`🌐 Name servers: ${cloudflareResult.result.name_servers.join(', ')}`)

        // Удаляем все DNS записи
        domainResult.logs.push(`🧹 Cleaning up existing DNS records...`)
        const deleteResult = await deleteAllDnsRecords(
          validatedData.cloudflareApiKey,
          validatedData.cloudflareEmail,
          zoneId
        )
        domainResult.delete_dns = deleteResult
        domainResult.logs.push(`🧹 Deleted ${deleteResult.deleted}/${deleteResult.total} DNS records`)

        // Добавляем A-запись
        domainResult.logs.push(`📍 Creating A-record (${validatedData.targetIp})...`)
        const dnsResult = await addCloudflareARecord(
          validatedData.cloudflareApiKey,
          validatedData.cloudflareEmail,
          zoneId,
          domain,
          validatedData.targetIp
        )
        domainResult.dns = dnsResult
        
        if (dnsResult.success) {
          domainResult.logs.push(`✅ A-record created: ${validatedData.targetIp}`)
        } else {
          domainResult.logs.push(`❌ Failed to create A-record`)
        }

        // Обновляем name-серверы в Namecheap
        domainResult.logs.push(`🔄 Updating Namecheap nameservers...`)
        const namecheapResult = await updateNamecheapNameservers(
          validatedData.namecheapApiUser,
          validatedData.namecheapApiKey,
          validatedData.namecheapUsername,
          validatedData.clientIp,
          domain,
          cloudflareResult.result.name_servers
        )
        domainResult.namecheap = namecheapResult
        
        if (namecheapResult.success) {
          domainResult.logs.push(`✅ Namecheap nameservers updated`)
        } else {
          domainResult.logs.push(`❌ Failed to update Namecheap nameservers: ${namecheapResult.message || 'Unknown error'}`)
        }

        // Если все операции успешны, добавляем домен в базу данных
        if (dnsResult.success && namecheapResult.success) {
          try {
            domainResult.logs.push(`💾 Adding domain to database...`)
            
            // Проверяем, не существует ли уже такой домен
            const existingDomain = await prisma.domain.findUnique({
              where: { domain: domain }
            })

            if (!existingDomain) {
              const newDomain = await prisma.domain.create({
                data: {
                  domain: domain,
                  isAssigned: false,
                  cost: validatedData.cost || null,
                }
              })
              
              console.log(`✅ Domain added to database: ${domain} (ID: ${newDomain.id})`)
              const costLog = validatedData.cost ? ` with cost $${validatedData.cost}` : ' (no cost set)'
              domainResult.logs.push(`✅ Domain added to database (ID: ${newDomain.id})${costLog}`)
              domainResult.database = { success: true, id: newDomain.id }
            } else {
              console.log(`ℹ️ Domain already exists in database: ${domain}`)
              domainResult.logs.push(`ℹ️ Domain already exists in database`)
              domainResult.database = { success: true, id: existingDomain.id, existing: true }
            }
          } catch (dbError) {
            console.error(`❌ Failed to add domain to database: ${domain}`, dbError)
            const errorMsg = `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
            domainResult.logs.push(`❌ ${errorMsg}`)
            domainResult.database = { 
              success: false, 
              error: errorMsg
            }
          }
        }
        
        if (dnsResult.success && namecheapResult.success) {
          domainResult.logs.push(`🎉 Domain ${domainNum}/${domains.length}: ${domain} - Complete!`)
        }
      } else {
        domainResult.logs.push(`❌ Failed to add domain to Cloudflare`)
        if (cloudflareResult.errors?.length) {
          cloudflareResult.errors.forEach(error => {
            domainResult.logs.push(`   ⚠️ ${error.message} (${error.code})`)
          })
        }
      }

      results.push(domainResult)

      // Добавляем задержку между доменами (кроме последнего)
      if (i < domains.length - 1) {
        const delayTime = Math.floor(Math.random() * (180 - 60 + 1)) + 60 // 60-180 секунд
        console.log(`⏳ Waiting ${delayTime} seconds before next domain...`)
        domainResult.logs.push(`⏳ Waiting ${delayTime} seconds before next domain...`)
        await delay(delayTime * 1000)
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in Cloudflare setup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

