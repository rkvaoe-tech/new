'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { 
  Settings, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'

const binomSettingsSchema = z.object({
  binomUrl: z.string().url('Please enter a valid URL'),
  binomApiKey: z.string().min(1, 'API key is required'),
  binomUserId: z.number().optional().nullable()
})

type BinomSettingsFormData = z.infer<typeof binomSettingsSchema>

interface BinomSettings {
  binomUrl: string | null
  binomApiKey: string | null
  binomUserId: number | null
  isConfigured: boolean
}

export function BinomSettings() {
  const [showApiKey, setShowApiKey] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<BinomSettingsFormData>({
    resolver: zodResolver(binomSettingsSchema),
    defaultValues: {
      binomUrl: '',
      binomApiKey: '',
      binomUserId: null,
    },
  })

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<BinomSettings>({
    queryKey: ['binom-settings'],
    queryFn: async () => {
      const response = await fetch('/api/user/binom-settings')
      if (!response.ok) {
        throw new Error('Failed to fetch Binom settings')
      }
      return response.json()
    },
  })

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.setValue('binomUrl', settings.binomUrl || '')
      form.setValue('binomUserId', settings.binomUserId)
      // Don't set API key as it's hidden for security
    }
  }, [settings, form])

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: BinomSettingsFormData) => {
      const response = await fetch('/api/user/binom-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binom-settings'] })
      toast.success('Binom settings saved successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Remove settings mutation
  const removeSettingsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/binom-settings', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove settings')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binom-settings'] })
      form.reset()
      toast.success('Binom settings removed successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = (data: BinomSettingsFormData) => {
    saveSettingsMutation.mutate(data)
  }

  const handleRemoveSettings = () => {
    if (confirm('Are you sure you want to remove Binom settings?')) {
      removeSettingsMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading Binom settings...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Binom Tracker Integration
          </CardTitle>
          {settings?.isConfigured ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Configured
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500 border-gray-300">
              <XCircle className="w-3 h-3 mr-1" />
              Not Configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">About Binom Integration</h4>
            <p className="text-sm text-blue-700 mb-2">
              When you request a domain, it will be automatically added to your Binom tracker account.
              This integration requires your Binom API credentials.
            </p>
            <a 
              href="https://docs.binom.org/api.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Binom API Documentation
            </a>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="binomUrl">Binom Tracker URL</Label>
              <Input
                id="binomUrl"
                placeholder="https://your-tracker.com"
                {...form.register('binomUrl')}
              />
              {form.formState.errors.binomUrl && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.binomUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="binomApiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="binomApiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={settings?.isConfigured ? 'API key is configured' : 'Enter your API key'}
                  {...form.register('binomApiKey')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.binomApiKey && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.binomApiKey.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                You can find your API key in Binom: Settings → User → API Key
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="binomUserId">User ID (Optional)</Label>
              <Input
                id="binomUserId"
                type="number"
                placeholder="Leave empty for super admin access"
                {...form.register('binomUserId', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' ? null : Number(value)
                })}
              />
              <p className="text-xs text-gray-500">
                Specific user ID in Binom (optional, leave empty for full admin access)
              </p>
            </div>

            <div className="flex justify-between pt-4">
              {settings?.isConfigured && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRemoveSettings}
                  disabled={removeSettingsMutation.isPending}
                >
                  {removeSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Settings
                    </>
                  )}
                </Button>
              )}

              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={saveSettingsMutation.isPending}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing & Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Test & Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
