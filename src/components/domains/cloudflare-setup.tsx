'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Cloud, Settings, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const setupFormSchema = z.object({
  domains: z.string().min(1, 'Please enter at least one domain'),
  cost: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return null
    const num = parseFloat(val)
    return isNaN(num) || num < 0 ? null : num
  }),
  cloudflareApiKey: z.string().min(1, 'Cloudflare API Key is required'),
  cloudflareEmail: z.string().email('Valid email is required'),
  namecheapApiUser: z.string().min(1, 'Namecheap API User is required'),
  namecheapApiKey: z.string().min(1, 'Namecheap API Key is required'),
  namecheapUsername: z.string().min(1, 'Namecheap Username is required'),
  clientIp: z.string().min(1, 'Client IP is required'),
  targetIp: z.string().min(1, 'Target IP for A-record is required'),
})

type SetupFormData = z.infer<typeof setupFormSchema>

interface CloudflareSetupProps {
  editMode: boolean
}

interface DomainResult {
  domain: string
  cloudflare: {
    success: boolean
    message?: string
    result?: {
      id: string
      name_servers: string[]
    }
    errors?: Array<{ message: string; code: string }>
  }
  dns?: {
    success: boolean
    message?: string
    result?: {
      content: string
    }
  }
  namecheap?: {
    success: boolean
    message?: string
  }
  delete_dns?: {
    success: boolean
    total: number
    deleted: number
    failed: number
  }
  database?: {
    success: boolean
    id?: string
    existing?: boolean
    error?: string
  }
}

export function CloudflareSetup({ editMode }: CloudflareSetupProps) {
  const [results, setResults] = useState<DomainResult[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(true)
  const queryClient = useQueryClient()

  // Функция для добавления лога
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => {
      const newLogs = [...prev, `[${timestamp}] ${message}`]
      
      // Автоскролл в конец лога
      setTimeout(() => {
        const logContainer = document.getElementById('cloudflare-log-container')
        if (logContainer) {
          logContainer.scrollTop = logContainer.scrollHeight
        }
      }, 100)
      
      return newLogs
    })
  }

  // Функция для очистки логов
  const clearLogs = () => {
    setLogs([])
  }

  // Функция для загрузки сохраненных значений
  const loadSavedValues = (): Partial<SetupFormData> => {
    if (typeof window === 'undefined') return {}
    
    try {
      const saved = localStorage.getItem('cloudflare-setup-form')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading saved form values:', error)
    }
    
    // Возвращаем значения по умолчанию если нет сохраненных
    return {
      cloudflareApiKey: 'fe7e69450f8aacd7131dbdd22a86338945699',
      cloudflareEmail: 'qcb1a90@push.tg',
      namecheapApiUser: 'cpabomj',
      namecheapApiKey: '306cf18bbf7247c08acafff0d8a5dc7c',
      namecheapUsername: 'cpabomj',
      clientIp: '92.118.151.121',
      targetIp: '92.118.151.121',
    }
  }

  // Функция для сохранения значений
  const saveValues = (values: SetupFormData) => {
    if (typeof window === 'undefined') return
    
    try {
      // Сохраняем все кроме доменов (их не нужно запоминать)
      const { domains, ...valuesToSave } = values
      localStorage.setItem('cloudflare-setup-form', JSON.stringify(valuesToSave))
    } catch (error) {
      console.error('Error saving form values:', error)
    }
  }

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      domains: '',
      ...loadSavedValues(),
    },
  })

  // Загружаем сохраненные значения при монтировании компонента
  useEffect(() => {
    const savedValues = loadSavedValues()
    if (Object.keys(savedValues).length > 0) {
      Object.entries(savedValues).forEach(([key, value]) => {
        if (key !== 'domains' && value) {
          form.setValue(key as keyof SetupFormData, value)
        }
      })
    }
  }, [])

  const setupMutation = useMutation({
    mutationFn: async (data: SetupFormData) => {
      // Очищаем старые логи и результаты
      clearLogs()
      setResults([])
      
      const domains = data.domains.split('\n').map(d => d.trim()).filter(d => d.length > 0)
      addLog(`🚀 Starting setup for ${domains.length} domains`)
      addLog(`📧 Using Cloudflare email: ${data.cloudflareEmail}`)
      addLog(`🏢 Using Namecheap user: ${data.namecheapUsername}`)
      addLog(`🌐 Target IP: ${data.targetIp}`)
      
      const response = await fetch('/api/admin/cloudflare/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        addLog(`❌ API Error: ${error.error || 'Setup failed'}`)
        throw new Error(error.error || 'Setup failed')
      }

      const result = await response.json()
      addLog(`✅ Setup completed successfully`)
      addLog(`📊 Processed ${result.results?.length || 0} domains`)
      
      return result
    },
    onSuccess: (data) => {
      setResults(data.results || [])
      
      // Добавляем детальные логи по результатам
      data.results?.forEach((result: DomainResult, index: number) => {
        // Если у результата есть собственные логи, используем их
        if ((result as any).logs && Array.isArray((result as any).logs)) {
          (result as any).logs.forEach((logMessage: string) => {
            addLog(logMessage)
          })
        } else {
          // Fallback к старому формату логов
          const domainNum = index + 1
          if (result.cloudflare.success) {
            addLog(`✅ Domain ${domainNum}/${data.results.length}: ${result.domain} - Success`)
            if (result.dns?.success) {
              addLog(`   📡 DNS A-record created: ${result.dns.result?.content}`)
            }
            if (result.namecheap?.success) {
              addLog(`   🔄 Namecheap nameservers updated`)
            }
            if (result.database?.success) {
              if (result.database.existing) {
                addLog(`   💾 Domain already exists in database`)
              } else {
                addLog(`   💾 Domain added to database (ID: ${result.database.id})`)
              }
            } else if (result.database?.error) {
              addLog(`   ❌ Database error: ${result.database.error}`)
            }
          } else {
            addLog(`❌ Domain ${domainNum}/${data.results.length}: ${result.domain} - Failed`)
            if (result.cloudflare.errors?.length) {
              result.cloudflare.errors.forEach(error => {
                addLog(`   ⚠️ ${error.message} (${error.code})`)
              })
            }
          }
        }
      })
      
      addLog(`🎉 All done! Check results below.`)
      
      // Обновляем кэш доменов, если были добавлены новые домены
      const addedDomains = data.results?.filter((result: DomainResult) => 
        result.database?.success && !result.database.existing
      ).length || 0
      
      if (addedDomains > 0) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] })
        addLog(`🔄 Updated domains list (+${addedDomains} new domains)`)
      }
      
      toast.success(`Setup completed for ${data.results?.length || 0} domains`)
    },
    onError: (error: Error) => {
      addLog(`💥 Fatal error: ${error.message}`)
      toast.error(error.message)
    },
  })

  const onSubmit = (data: SetupFormData) => {
    // Сохраняем введенные значения перед отправкой
    saveValues(data)
    setupMutation.mutate(data)
  }

  if (!editMode) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Cloudflare setup is only available in edit mode.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Cloudflare Domain Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cloudflare Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Cloudflare API</h3>
                <div>
                  <Label htmlFor="cloudflareEmail">Email</Label>
                  <Input
                    id="cloudflareEmail"
                    {...form.register('cloudflareEmail')}
                    placeholder="Enter Cloudflare email"
                  />
                  {form.formState.errors.cloudflareEmail && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.cloudflareEmail.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cloudflareApiKey">API Key</Label>
                  <Input
                    id="cloudflareApiKey"
                    type="password"
                    {...form.register('cloudflareApiKey')}
                    placeholder="Enter Cloudflare API Key"
                  />
                  {form.formState.errors.cloudflareApiKey && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.cloudflareApiKey.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Namecheap Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Namecheap API</h3>
                <div>
                  <Label htmlFor="namecheapApiUser">API User</Label>
                  <Input
                    id="namecheapApiUser"
                    {...form.register('namecheapApiUser')}
                    placeholder="Enter Namecheap API User"
                  />
                  {form.formState.errors.namecheapApiUser && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.namecheapApiUser.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="namecheapApiKey">API Key</Label>
                  <Input
                    id="namecheapApiKey"
                    type="password"
                    {...form.register('namecheapApiKey')}
                    placeholder="Enter Namecheap API Key"
                  />
                  {form.formState.errors.namecheapApiKey && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.namecheapApiKey.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="namecheapUsername">Username</Label>
                  <Input
                    id="namecheapUsername"
                    {...form.register('namecheapUsername')}
                    placeholder="Enter Namecheap Username"
                  />
                  {form.formState.errors.namecheapUsername && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.namecheapUsername.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientIp">Client IP</Label>
                 <Input
                   id="clientIp"
                   {...form.register('clientIp')}
                   placeholder="Enter Client IP"
                 />
                {form.formState.errors.clientIp && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.clientIp.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="targetIp">Target IP (A-record)</Label>
                 <Input
                   id="targetIp"
                   {...form.register('targetIp')}
                   placeholder="Enter Target IP"
                 />
                {form.formState.errors.targetIp && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.targetIp.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="domains">Domains (one per line)</Label>
              <Textarea
                id="domains"
                {...form.register('domains')}
                placeholder={`example.com\nexample.org\nexample.net`}
                rows={6}
                className="font-mono"
              />
              {form.formState.errors.domains && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.domains.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="cost">Domain Cost (USD) - Optional</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                {...form.register('cost')}
                placeholder="0.00"
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                This cost will be applied to all domains being added. Leave empty for no cost.
              </p>
              {form.formState.errors.cost && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.cost.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={setupMutation.isPending}
              className="w-full"
            >
              {setupMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 mr-2" />
                  Setup Domains
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Execution Log */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Execution Log
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                disabled={setupMutation.isPending}
              >
                Clear Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              id="cloudflare-log-container"
              className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-80 overflow-y-auto scroll-smooth"
            >
              {logs.map((log, index) => (
                <div key={index} className="mb-1 whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              {setupMutation.isPending && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    result.cloudflare.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">{result.domain}</h4>
                    {result.cloudflare.success ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>

                  {result.cloudflare.success ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Cloudflare:</strong> Successfully added</p>
                      <p><strong>Zone ID:</strong> {result.cloudflare.result?.id}</p>
                      <p><strong>Name servers:</strong> {result.cloudflare.result?.name_servers.join(', ')}</p>
                      
                      {result.delete_dns && (
                        <p><strong>DNS Cleanup:</strong> Deleted {result.delete_dns.deleted} of {result.delete_dns.total} records</p>
                      )}
                      
                      {result.dns && (
                        <p><strong>A-record:</strong> {result.dns.success ? `Added (${result.dns.result?.content})` : `Failed - ${result.dns.message}`}</p>
                      )}
                      
                      {result.namecheap && (
                        <p><strong>Namecheap:</strong> {result.namecheap.success ? 'Name servers updated' : `Failed - ${result.namecheap.message}`}</p>
                      )}
                      
                      {result.database && (
                        <p><strong>Database:</strong> {
                          result.database.success 
                            ? result.database.existing 
                              ? 'Domain already exists' 
                              : `Added to available domains (ID: ${result.database.id})`
                            : `Failed - ${result.database.error}`
                        }</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p><strong>Cloudflare:</strong> Failed</p>
                      {result.cloudflare.errors && result.cloudflare.errors.length > 0 && (
                        <ul className="list-disc list-inside">
                          {result.cloudflare.errors.map((error, errorIndex) => (
                            <li key={errorIndex}>
                              {error.message} (Code: {error.code})
                            </li>
                          ))}
                        </ul>
                      )}
                      {result.cloudflare.message && (
                        <p>{result.cloudflare.message}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
