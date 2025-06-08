'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Project {
  id: string
  name: string
  color: string
  _count: {
    tasks: number
  }
  tasks: Array<{
    columnId: string
  }>
  columns: Array<{
    id: string
    name: string
  }>
}

export default function Sidebar() {
  const pathname = usePathname()
  const [projects, setProjects] = useState<Project[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data)
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      }
    }

    fetchProjects()
  }, [])

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/posts', label: 'Posts', icon: '📝' },
    { href: '/admin/projects', label: 'Projects', icon: '📋' },
    { href: '/admin/today', label: 'Today', icon: '📅' },
  ]

  const getTaskProgress = (project: Project) => {
    const totalTasks = project._count?.tasks || project.tasks?.length || 0
    const doneColumn = project.columns?.find(col => col.name === 'Done')
    const completedTasks = doneColumn 
      ? project.tasks?.filter(task => task.columnId === doneColumn.id).length || 0
      : 0
    return { total: totalTasks, completed: completedTasks }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} lg:static lg:translate-x-0 ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isCollapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              )
            })}
          </div>

          {/* Projects Section */}
          {!isCollapsed && projects.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Projects
                </h3>
                <Link
                  href="/admin/projects/new"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                >
                  + New
                </Link>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {projects.map((project) => {
                  const { total, completed } = getTaskProgress(project)
                  const isProjectActive = pathname === `/admin/projects/${project.id}`
                  
                  return (
                    <Link
                      key={project.id}
                      href={`/admin/projects/${project.id}`}
                      className={`block p-3 rounded-lg border transition-colors ${
                        isProjectActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {project.name}
                          </span>
                        </div>
                      </div>
                      {total > 0 && (
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{completed}/{total} tasks</span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full transition-all duration-200"
                              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Admin</span>
              </div>
              <Link
                href="/api/auth/signout"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
              >
                Sign out
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}