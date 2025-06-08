import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function ProjectsPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    redirect("/login")
  }

  const projects = await prisma.project.findMany({
    where: {
      authorId: user.id
    },
    include: {
      tasks: {
        select: {
          id: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Project
        </Link>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Create your first project to get started with task management
                </p>
                <Link
                  href="/admin/projects/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Project
                </Link>
              </div>
            </div>
          ) : (
            projects.map((project) => {
              const taskCounts = project.tasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1
                return acc
              }, {} as Record<string, number>)

              const totalTasks = project.tasks.length
              const completedTasks = taskCounts.DONE || 0

              return (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="block"
                >
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4"
                       style={{ borderLeftColor: project.color || '#3b82f6' }}>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: project.color || '#3b82f6' }}
                        />
                      </div>
                      
                      {project.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Progress</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {completedTasks}/{totalTasks} tasks
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              backgroundColor: project.color || '#3b82f6',
                              width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%'
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          To Do: {taskCounts.TODO || 0}
                        </span>
                        <span>
                          In Progress: {taskCounts.IN_PROGRESS || 0}
                        </span>
                        <span>
                          Done: {taskCounts.DONE || 0}
                        </span>
                      </div>

                      <div className="mt-4 text-xs text-gray-400">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
    </div>
  )
}