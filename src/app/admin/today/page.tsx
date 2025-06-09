"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface Task {
  id: string
  title: string
  description?: string
  isToday: boolean
  todayOrder?: number
  columnId: string
  project: {
    id: string
    name: string
    color: string
  }
  column: {
    id: string
    name: string
  }
  createdAt: string
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [finishingTasks, setFinishingTasks] = useState<Set<string>>(new Set())

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

    // Apply the same sorting logic to get the current visual order
    const sortedTasks = [...tasks].sort((a, b) => {
      const aIsDone = a.column.name.toLowerCase() === 'done' || 
                      a.column.name.toLowerCase() === 'completed' ||
                      a.column.name.toLowerCase() === 'finished'
      const bIsDone = b.column.name.toLowerCase() === 'done' || 
                      b.column.name.toLowerCase() === 'completed' ||
                      b.column.name.toLowerCase() === 'finished'
      
      if (aIsDone && !bIsDone) return 1
      if (!aIsDone && bIsDone) return -1
      return (a.todayOrder || 0) - (b.todayOrder || 0)
    })

    const [reorderedTask] = sortedTasks.splice(source.index, 1)
    sortedTasks.splice(destination.index, 0, reorderedTask)

    // Update todayOrder for all tasks based on new positions
    const updatedTasks = sortedTasks.map((task, index) => ({
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

  const finishTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || finishingTasks.has(taskId)) return

    setFinishingTasks(prev => new Set(prev).add(taskId))

    try {
      // Find the "Done" column for this task's project
      const response = await fetch(`/api/projects/${task.project.id}`)
      if (!response.ok) throw new Error('Failed to fetch project')
      
      const project = await response.json()
      let doneColumn = project.columns.find((col: { id: string; name: string }) => 
        col.name.toLowerCase() === 'done' || 
        col.name.toLowerCase() === 'completed' ||
        col.name.toLowerCase() === 'finished'
      )
      
      // If no done column exists, create one
      if (!doneColumn) {
        const createColumnResponse = await fetch('/api/columns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Done',
            projectId: task.project.id,
            order: project.columns.length
          })
        })
        
        if (!createColumnResponse.ok) {
          throw new Error('Failed to create Done column')
        }
        
        doneColumn = await createColumnResponse.json()
      }

      // Move task to Done column
      const updateResponse = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          columnId: doneColumn.id,
          order: 0 // Place at top of Done column
        })
      })

      if (updateResponse.ok) {
        // Remove task from today list with animation
        setTasks(tasks.filter(t => t.id !== taskId))
      } else {
        throw new Error('Failed to update task')
      }
    } catch (error) {
      console.error('Failed to finish task:', error)
      alert('Failed to mark task as finished')
    } finally {
      setFinishingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
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
                {tasks
                  .sort((a, b) => {
                    const aIsDone = a.column.name.toLowerCase() === 'done' || 
                                    a.column.name.toLowerCase() === 'completed' ||
                                    a.column.name.toLowerCase() === 'finished'
                    const bIsDone = b.column.name.toLowerCase() === 'done' || 
                                    b.column.name.toLowerCase() === 'completed' ||
                                    b.column.name.toLowerCase() === 'finished'
                    
                    // If one is done and other isn't, done goes to bottom
                    if (aIsDone && !bIsDone) return 1
                    if (!aIsDone && bIsDone) return -1
                    
                    // If both are same status, maintain their todayOrder
                    return (a.todayOrder || 0) - (b.todayOrder || 0)
                  })
                  .map((task, index, sortedArray) => {
                    const isDone = task.column.name.toLowerCase() === 'done' || 
                                   task.column.name.toLowerCase() === 'completed' ||
                                   task.column.name.toLowerCase() === 'finished'
                    
                    const prevTask = index > 0 ? sortedArray[index - 1] : null
                    const prevIsDone = prevTask ? (
                      prevTask.column.name.toLowerCase() === 'done' || 
                      prevTask.column.name.toLowerCase() === 'completed' ||
                      prevTask.column.name.toLowerCase() === 'finished'
                    ) : false
                    
                    const showDivider = isDone && !prevIsDone && index > 0
                    
                    return (
                      <React.Fragment key={task.id}>
                        {showDivider && (
                          <div className="flex items-center gap-4 my-6">
                            <hr className="flex-1 border-gray-300 dark:border-gray-600" />
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              Completed Tasks
                            </span>
                            <hr className="flex-1 border-gray-300 dark:border-gray-600" />
                          </div>
                        )}
                        <Draggable draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              } ${
                                isDone ? 'opacity-75' : ''
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
                                    <h3 className={`font-semibold text-lg mb-2 ${
                                      isDone ? 'line-through text-gray-500 dark:text-gray-400' : ''
                                    }`}>{task.title}</h3>
                                    {task.description && (
                                      <p className={`mb-3 ${
                                        isDone
                                          ? 'line-through text-gray-400 dark:text-gray-500' 
                                          : 'text-gray-600 dark:text-gray-400'
                                      }`}>
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
                                <div className="flex items-center gap-2">
                                  {!isDone && (
                                    <button
                                      onClick={() => finishTask(task.id)}
                                      disabled={finishingTasks.has(task.id)}
                                      className={`p-2 rounded-lg transition-colors ${
                                        finishingTasks.has(task.id)
                                          ? 'text-gray-400 cursor-not-allowed'
                                          : 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                      }`}
                                      title={finishingTasks.has(task.id) ? 'Finishing...' : 'Mark as finished'}
                                    >
                                      {finishingTasks.has(task.id) ? '⏳' : '✅'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => toggleTodayStatus(task.id, task.isToday)}
                                    className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                    title="Remove from today"
                                  >
                                    📅
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      </React.Fragment>
                    )
                  })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}