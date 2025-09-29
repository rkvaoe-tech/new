'use client'

import { useSession } from 'next-auth/react'
import { AdminDomainsView } from './admin-domains-view'
import { UserDomainsView } from './user-domains'

interface DomainsPageContentProps {
  editMode: boolean
}

export function DomainsPageContent({ editMode }: DomainsPageContentProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  if (isAdmin) {
    // Для админов в доменах всегда включен режим редактирования
    return <AdminDomainsView editMode={true} />
  } else {
    return <UserDomainsView />
  }
}
