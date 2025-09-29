'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, Mail, Shield, Lock } from 'lucide-react'

const editUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  displayName: z.string().min(1, 'Display name is required'),
  role: z.enum(['USER', 'ADMIN'], {
    required_error: 'Please select a role',
  }),
  newPassword: z.string().optional(),
}).refine((data) => {
  // If password is provided, it must be at least 6 characters
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword.length >= 6
  }
  return true
}, {
  message: "Password must be at least 6 characters",
  path: ["newPassword"]
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface User {
  id: string
  email: string
  displayName: string | null
  role: 'USER' | 'ADMIN'
}

interface EditUserModalProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditUserModal({ user, open, onOpenChange, onSuccess }: EditUserModalProps) {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: user.email,
      displayName: user.displayName || '',
      role: user.role,
      newPassword: '',
    },
  })

  const editUserMutation = useMutation({
    mutationFn: async (data: EditUserFormData) => {
      const response = await fetch(`/api/admin/users/${user.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User updated successfully')
      form.reset({
        email: user.email,
        displayName: user.displayName || '',
        role: user.role,
        newPassword: '',
      })
      onSuccess()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = (data: EditUserFormData) => {
    editUserMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Edit User - {user.displayName || user.email}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Display Name
            </Label>
            <Input
              id="displayName"
              placeholder="John Doe"
              {...form.register('displayName')}
            />
            {form.formState.errors.displayName && (
              <p className="text-sm text-red-600">
                {form.formState.errors.displayName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role
            </Label>
            <Select
              value={form.watch('role')}
              onValueChange={(value: 'USER' | 'ADMIN') => form.setValue('role', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-red-600">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Leave empty to keep current password"
              {...form.register('newPassword')}
            />
            {form.formState.errors.newPassword && (
              <p className="text-sm text-red-600">
                {form.formState.errors.newPassword.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Leave empty to keep the current password unchanged
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={editUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
