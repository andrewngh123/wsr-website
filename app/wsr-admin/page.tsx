import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { adminPath, isAdminEnabled } from '@/lib/admin/config'
import { getAdminUser } from '@/lib/admin/session'
import LoginForm from '@/components/admin/LoginForm'
import AdminDashboard from '@/components/admin/AdminDashboard'

// Reached only via the secret ADMIN_PATH rewrite in middleware.ts.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Staff',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default async function AdminPage() {
  const path = adminPath()
  if (!isAdminEnabled() || !path) notFound()

  const user = await getAdminUser()
  return user
    ? <AdminDashboard user={user} />
    : <LoginForm adminPath={path} />
}
