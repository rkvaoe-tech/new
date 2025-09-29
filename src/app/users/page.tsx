'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Users, 
  MoreVertical,
  Shield,
  ShieldOff,
  Trash2,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  Edit,
  UserX,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { CreateUserModal } from '@/components/users/create-user-modal'
import { EditBinomModal } from '@/components/users/edit-binom-modal'
import { EditUserModal } from '@/components/users/edit-user-modal'

interface User {
  id: string
  email: string
  displayName: string | null
  role: 'ADMIN' | 'USER'
  isBlocked: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  binomApiKey: string | null
  googleSheetsId: string | null
  _count: {
    domainRequests: number
  }
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [page, setPage] = useState(1)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [editBinomUser, setEditBinomUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const pageSize = 20

  // Проверяем права админа
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const { data: usersData, isLoading, refetch, error } = useQuery<UsersResponse>({
    queryKey: ['admin', 'users', { page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      console.log('Fetching users with params:', params.toString())
      const response = await fetch(`/api/admin/users?${params}`)
      console.log('Users API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('Users API error:', errorData)
        throw new Error(`Failed to fetch users: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Users API success:', data)
      return data
    },
  })

  const handleUserAction = async (userId: string, action: 'block' | 'unblock' | 'delete' | 'promote' | 'demote') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`)
      }

      const actionLabels = {
        block: 'заблокирован',
        unblock: 'разблокирован',
        delete: 'удален',
        promote: 'повышен до админа',
        demote: 'понижен до пользователя'
      }

      toast.success(`Пользователь ${actionLabels[action]}`)
      refetch()
    } catch (error) {
      toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadge = (role: string, isBlocked: boolean) => {
    const isAdmin = role === 'ADMIN'
    const baseClasses = "text-xs"
    
    if (isBlocked) {
      // Заблокированные пользователи - красный цвет
      return (
        <Badge variant="destructive" className={baseClasses}>
          {isAdmin ? <Shield className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
          {isAdmin ? 'Admin' : 'User'}
        </Badge>
      )
    } else {
      // Активные пользователи - зеленый цвет
      return (
        <Badge variant="outline" className={`${baseClasses} text-green-600 border-green-600 bg-green-50`}>
          {isAdmin ? <Shield className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
          {isAdmin ? 'Admin' : 'User'}
        </Badge>
      )
    }
  }


  const getIntegrationsBadge = (user: User) => {
    const hasBinom = !!user.binomApiKey
    const hasSheets = !!user.googleSheetsId
    
    if (hasBinom && hasSheets) {
      return (
        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Both Set
        </Badge>
      )
    } else if (hasBinom || hasSheets) {
      return (
        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Partial
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
          <XCircle className="w-3 h-3 mr-1" />
          Not Set
        </Badge>
      )
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateUser(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>


      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({usersData?.users?.length || 0} of {usersData?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : !usersData?.users?.length ? (
            <div className="text-center py-8 text-gray-500">
              No users found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Integrations</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{user.displayName || 'No name'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role, user.isBlocked)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getIntegrationsBadge(user)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditBinomUser(user)}
                            className="h-6 px-2"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            
                            {user.role === 'USER' && (
                              <DropdownMenuItem onClick={() => handleUserAction(user.id, 'promote')}>
                                <Shield className="w-4 h-4 mr-2" />
                                Promote to Admin
                              </DropdownMenuItem>
                            )}
                            
                            {user.role === 'ADMIN' && user.id !== session?.user?.id && (
                              <DropdownMenuItem onClick={() => handleUserAction(user.id, 'demote')}>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Demote to User
                              </DropdownMenuItem>
                            )}
                            
                            {!user.isBlocked ? (
                              <DropdownMenuItem 
                                onClick={() => handleUserAction(user.id, 'block')}
                                className="text-orange-600"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Block User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleUserAction(user.id, 'unblock')}
                                className="text-green-600"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Unblock User
                              </DropdownMenuItem>
                            )}
                            
                            {user.id !== session?.user?.id && (
                              <DropdownMenuItem 
                                onClick={() => handleUserAction(user.id, 'delete')}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {usersData.total > pageSize && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, usersData.total)} of {usersData.total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {Math.ceil(usersData.total / pageSize)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(usersData.total / pageSize)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <CreateUserModal
        open={showCreateUser}
        onOpenChange={setShowCreateUser}
      />

      {/* Edit Binom Modal */}
      {editBinomUser && (
        <EditBinomModal
          user={editBinomUser}
          open={!!editBinomUser}
          onOpenChange={(open) => !open && setEditBinomUser(null)}
          onSuccess={() => {
            setEditBinomUser(null)
            refetch()
          }}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
          onSuccess={() => {
            setEditUser(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}
