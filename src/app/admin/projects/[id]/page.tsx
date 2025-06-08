"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  order: number
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  description?: string
  color: string
  tasks: Task[]
  createdAt: string
  updatedAt: string
}

const STATUS_COLUMNS = {
  TODO: { title: 'To Do', bgColor: 'bg-gray-50 dark:bg-gray-800' },
  IN_PROGRESS: { title: 'In Progress', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  DONE: { title: 'Done', bgColor: 'bg-green-50 dark:bg-green-900/20' }
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-400', 
  HIGH: 'bg-orange-400',
  URGENT: 'bg-red-400'
}

export default function ProjectKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewTaskForm, setShowNewTaskForm] = useState<TaskStatus | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("MEDIUM")
  const [projectId, setProjectId] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!projectId) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else if (response.status === 404) {
        router.push('/admin/projects')
      }
    } catch (error) {
      console.error("Error fetching project:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setProjectId(resolvedParams.id)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId, fetchProject])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !project) return

    const { source, destination, draggableId } = result
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const newTasks = Array.from(project.tasks)
    const taskToMove = newTasks.find(task => task.id === draggableId)
    
    if (!taskToMove) return

    // Update task status if moved to different column
    const newStatus = destination.droppableId as TaskStatus
    const updatedTask = { ...taskToMove, status: newStatus }

    // Remove task from original position
    const filteredTasks = newTasks.filter(task => task.id !== draggableId)
    
    // Get tasks in the destination column
    const destinationTasks = filteredTasks.filter(task => task.status === newStatus)
    
    // Insert at new position
    destinationTasks.splice(destination.index, 0, updatedTask)
    
    // Update order for all tasks in the destination column
    destinationTasks.forEach((task, index) => {
      task.order = index
    })

    // Combine all tasks
    const otherTasks = filteredTasks.filter(task => task.status !== newStatus)
    const finalTasks = [...otherTasks, ...destinationTasks]

    setProject({ ...project, tasks: finalTasks })

    // Update task on server
    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          order: destination.index
        })
      })
    } catch (error) {
      console.error("Error updating task:", error)
      // Revert on error
      fetchProject()
    }
  }

  const handleCreateTask = async (status: TaskStatus) => {
    if (!newTaskTitle.trim() || !project || !projectId) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority,
          status,
          projectId: projectId
        })
      })

      if (response.ok) {
        const newTask = await response.json()
        setProject({
          ...project,
          tasks: [...project.tasks, newTask]
        })
        setNewTaskTitle("")
        setNewTaskDescription("")
        setNewTaskPriority("MEDIUM")
        setShowNewTaskForm(null)
      }
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!project) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProject({
          ...project,
          tasks: project.tasks.filter(task => task.id !== taskId)
        })
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <Link href="/admin/projects" className="text-blue-600 hover:text-blue-800">
            Return to Projects
          </Link>
        </div>
      </div>
    )
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return project.tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.order - b.order)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/admin/projects"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            ← Back to Projects
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>
          {project.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">{project.description}</p>
          )}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(STATUS_COLUMNS).map(([status, config]) => (
              <div key={status} className={`${config.bgColor} rounded-lg p-4`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg">{config.title}</h2>
                  <span className="text-sm text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded">
                    {getTasksByStatus(status as TaskStatus).length}
                  </span>
                </div>

                <Droppable droppableId={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-3 min-h-[200px]"
                    >
                      {getTasksByStatus(status as TaskStatus).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium text-sm">{task.title}</h3>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-gray-400 hover:text-red-500 text-xs"
                                >
                                  ×
                                </button>
                              </div>
                              {task.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex justify-between items-center">
                                <div 
                                  className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[task.priority]}`}
                                  title={task.priority}
                                />
                                <span className="text-xs text-gray-400">
                                  {new Date(task.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {showNewTaskForm === status ? (
                  <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <input
                      type="text"
                      placeholder="Task title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full p-2 border rounded text-sm mb-2 dark:bg-gray-700 dark:border-gray-600"
                      autoFocus
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="w-full p-2 border rounded text-sm mb-2 h-20 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                      className="w-full p-2 border rounded text-sm mb-3 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="LOW">Low Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCreateTask(status as TaskStatus)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Add Task
                      </button>
                      <button
                        onClick={() => setShowNewTaskForm(null)}
                        className="text-gray-600 px-3 py-1 text-sm hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewTaskForm(status as TaskStatus)}
                    className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                  >
                    + Add task
                  </button>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}