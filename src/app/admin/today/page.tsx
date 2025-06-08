"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface Task {
  id: string
  title: string
  description?: string
  isToday: boolean
  todayOrder?: number
  project: {
    id: string
    name: string
    color: string
  }
  column: {
    name: string
  }
  createdAt: string
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayTasks()
  }, [])

  const fetchTodayTasks = async () => {
    try {
      const response = await fetch('/api/tasks/today')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Failed to fetch today tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTodayStatus = async (taskId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/today`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isToday: !currentStatus })
      })

      if (response.ok) {
        setTasks(tasks.filter(task => task.id !== taskId))
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination } = result
    if (source.index === destination.index) return

    const newTasks = Array.from(tasks)
    const [reorderedTask] = newTasks.splice(source.index, 1)
    newTasks.splice(destination.index, 0, reorderedTask)

    // Update todayOrder for all tasks
    const updatedTasks = newTasks.map((task, index) => ({
      ...task,
      todayOrder: index
    }))

    setTasks(updatedTasks)

    // Update order on server
    try {
      await fetch('/api/tasks/today/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskOrders: updatedTasks.map((task, index) => ({
            id: task.id,
            todayOrder: index
          }))
        })
      })
    } catch (error) {
      console.error('Failed to update task order:', error)
      // Revert on error
      fetchTodayTasks()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading today&apos;s tasks...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📅 Today</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tasks you&apos;ve marked for today
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            No tasks for today
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Mark tasks as &quot;today&quot; from your projects to see them here
          </p>
          <Link
            href="/admin/projects"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Projects
          </Link>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="today-tasks">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid gap-4"
              >
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border transition-shadow ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
                              title="Drag to reorder"
                            >
                              ⋮⋮
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: task.project.color }}
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {task.project.name} • {task.column.name}
                                </span>
                              </div>
                              <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                              {task.description && (
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4">
                                <Link
                                  href={`/admin/projects/${task.project.id}`}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                                >
                                  View Project →
                                </Link>
                                <span className="text-xs text-gray-400">
                                  Created {new Date(task.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleTodayStatus(task.id, task.isToday)}
                            className="ml-4 p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="Remove from today"
                          >
                            📅
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}