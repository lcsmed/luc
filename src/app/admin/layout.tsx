import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-black dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}