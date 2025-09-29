'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Settings } from 'lucide-react'

const userIntegrationsSchema = z.object({
  binomApiKey: z.string().optional(),
  googleSheetsId: z.string().optional(),
})

type UserIntegrationsFormData = z.infer<typeof userIntegrationsSchema>

interface User {
  id: string
  email: string
  displayName: string | null
  binomApiKey: string | null
  googleSheetsId: string | null
}

interface EditUserIntegrationsModalProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditBinomModal({ user, open, onOpenChange, onSuccess }: EditUserIntegrationsModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserIntegrationsFormData>({
    resolver: zodResolver(userIntegrationsSchema),
    defaultValues: {
      binomApiKey: user.binomApiKey || '',
      googleSheetsId: user.googleSheetsId || '',
    },
  })

  const onSubmit = async (data: UserIntegrationsFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/integrations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binomApiKey: data.binomApiKey || null,
          googleSheetsId: data.googleSheetsId || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update Binom settings')
      }

      toast.success('User integrations updated successfully')
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update integrations')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            User Integrations - {user.displayName || user.email}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="binomApiKey">Binom API Key</Label>
            <Input
              id="binomApiKey"
              type="password"
              placeholder="Enter user's Binom API key"
              {...register('binomApiKey')}
            />
            {errors.binomApiKey && (
              <p className="text-sm text-red-500">{errors.binomApiKey.message}</p>
            )}
            <p className="text-xs text-gray-500">
              This API key will be used to automatically add domains to the user's Binom tracker
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleSheetsId">Google Sheets ID</Label>
            <Input
              id="googleSheetsId"
              type="text"
              placeholder="Enter Google Sheets ID from URL"
              {...register('googleSheetsId')}
            />
            <p className="text-xs text-gray-500">
              Copy the ID from the Google Sheets URL: /spreadsheets/d/[ID]/edit
            </p>
            {errors.googleSheetsId && (
              <p className="text-sm text-red-500">{errors.googleSheetsId.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Settings
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
