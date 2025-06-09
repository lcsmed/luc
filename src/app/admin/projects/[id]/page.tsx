"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface Task {
  id: string
  title: string
  description?: string
  order: number
  columnId: string
  isToday: boolean
  createdAt: string
  updatedAt: string
}

interface Column {
  id: string
  name: string
  order: number
  tasks?: Task[]
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  description?: string
  color: string
  columns: Column[]
  tasks: Task[]
  createdAt: string
  updatedAt: string
}

const getColumnBgColor = (index: number) => {
  const colors = [
    'bg-gray-900 dark:bg-gray-900',
    'bg-blue-900/30 dark:bg-blue-900/30',
    'bg-green-900/30 dark:bg-green-900/30',
    'bg-purple-900/30 dark:bg-purple-900/30',
    'bg-yellow-900/30 dark:bg-yellow-900/30'
  ]
  return colors[index % colors.length]
}


export default function ProjectKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewTaskForm, setShowNewTaskForm] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [showNewColumnForm, setShowNewColumnForm] = useState(false)
  const [newColumnName, setNewColumnName] = useState("")
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editedColumnName, setEditedColumnName] = useState("")

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

  const handleRenameProject = async () => {
    if (!project || !editedName.trim() || editedName === project.name) {
      setIsEditingName(false)
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName })
      })

      if (response.ok) {
        setProject({ ...project, name: editedName })
        setIsEditingName(false)
      }
    } catch (error) {
      console.error("Error renaming project:", error)
      setEditedName(project.name)
      setIsEditingName(false)
    }
  }

  const startEditingName = () => {
    if (project) {
      setEditedName(project.name)
      setIsEditingName(true)
    }
  }

  const handleCreateColumn = async () => {
    if (!newColumnName.trim() || !projectId) return

    try {
      const response = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newColumnName,
          projectId: projectId
        })
      })

      if (response.ok) {
        setNewColumnName("")
        setShowNewColumnForm(false)
        fetchProject()
      }
    } catch (error) {
      console.error("Error creating column:", error)
    }
  }

  const handleRenameColumn = async (columnId: string) => {
    if (!editedColumnName.trim()) {
      setEditingColumnId(null)
      return
    }

    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedColumnName })
      })

      if (response.ok) {
        setEditingColumnId(null)
        fetchProject()
      }
    } catch (error) {
      console.error("Error renaming column:", error)
      setEditingColumnId(null)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Are you sure you want to delete this column? All tasks must be moved first.")) return

    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchProject()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete column")
      }
    } catch (error) {
      console.error("Error deleting column:", error)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !project) return

    const { source, destination, draggableId } = result
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const newTasks = Array.from(project.tasks)
    const taskToMove = newTasks.find(task => task.id === draggableId)
    
    if (!taskToMove) return

    // Update task column if moved to different column
    const newColumnId = destination.droppableId
    const updatedTask = { ...taskToMove, columnId: newColumnId }

    // Remove task from original position
    const filteredTasks = newTasks.filter(task => task.id !== draggableId)
    
    // Get tasks in the destination column
    const destinationTasks = filteredTasks.filter(task => task.columnId === newColumnId)
    
    // Insert at new position
    destinationTasks.splice(destination.index, 0, updatedTask)
    
    // Update order for all tasks in the destination column
    destinationTasks.forEach((task, index) => {
      task.order = index
    })

    // Combine all tasks
    const otherTasks = filteredTasks.filter(task => task.columnId !== newColumnId)
    const finalTasks = [...otherTasks, ...destinationTasks]

    setProject({ ...project, tasks: finalTasks })

    // Update task on server
    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          columnId: newColumnId,
          order: destination.index
        })
      })
    } catch (error) {
      console.error("Error updating task:", error)
      // Revert on error
      fetchProject()
    }
  }

  const handleCreateTask = async (columnId: string) => {
    if (!newTaskTitle.trim() || !project || !projectId) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          columnId,
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

  const toggleTodayStatus = async (taskId: string, currentStatus: boolean) => {
    if (!project) return

    try {
      const response = await fetch(`/api/tasks/${taskId}/today`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isToday: !currentStatus })
      })

      if (response.ok) {
        setProject({
          ...project,
          tasks: project.tasks.map(task => 
            task.id === taskId 
              ? { ...task, isToday: !currentStatus }
              : task
          )
        })
      }
    } catch (error) {
      console.error("Error updating task today status:", error)
    }
  }

  const handleDeleteProject = async () => {
    if (!project || !projectId) return
    
    const confirmDelete = confirm(
      `Are you sure you want to delete "${project.name}"? This will permanently delete the project and all its tasks. This action cannot be undone.`
    )
    
    if (!confirmDelete) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/admin/projects')
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete project")
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Failed to delete project. Please try again.")
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

  const getTasksByColumn = (columnId: string) => {
    return project.tasks
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.order - b.order)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            {isEditingName ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleRenameProject}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameProject()
                  if (e.key === 'Escape') {
                    setEditedName(project.name)
                    setIsEditingName(false)
                  }
                }}
                className="text-3xl font-bold bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 outline-none px-1"
                autoFocus
              />
            ) : (
              <h1 
                className="text-3xl font-bold cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                onClick={startEditingName}
                title="Click to rename"
              >
                {project.name}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/projects"
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
            >
              ← Back to Projects
            </Link>
            <button
              onClick={handleDeleteProject}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              title="Delete project"
            >
              Delete Project
            </button>
          </div>
        </div>
        {project.description && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">{project.description}</p>
        )}
      </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className={`grid grid-cols-1 gap-6 ${
            project.columns.length <= 3 ? 'md:grid-cols-' + project.columns.length : 'md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {project.columns.map((column, columnIndex) => (
              <div key={column.id} className={`${getColumnBgColor(columnIndex)} rounded-lg p-4`}>
                <div className="flex justify-between items-center mb-4 group">
                  {editingColumnId === column.id ? (
                    <input
                      type="text"
                      value={editedColumnName}
                      onChange={(e) => setEditedColumnName(e.target.value)}
                      onBlur={() => handleRenameColumn(column.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameColumn(column.id)
                        if (e.key === 'Escape') setEditingColumnId(null)
                      }}
                      className="font-semibold text-lg bg-transparent border-b border-gray-400 outline-none"
                      autoFocus
                    />
                  ) : (
                    <h2 
                      className="font-semibold text-lg cursor-pointer"
                      onDoubleClick={() => {
                        setEditingColumnId(column.id)
                        setEditedColumnName(column.name)
                      }}
                    >
                      {column.name}
                    </h2>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 bg-gray-800 dark:bg-gray-800 px-2 py-1 rounded">
                      {getTasksByColumn(column.id).length}
                    </span>
                    {project.columns.length > 1 && (
                      <button
                        onClick={() => handleDeleteColumn(column.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm transition-opacity"
                        title="Delete column"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-3 min-h-[200px]"
                    >
                      {getTasksByColumn(column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-gray-800 dark:bg-gray-800 p-4 rounded-lg shadow-sm border ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              } ${
                                column.name.toLowerCase() === 'done' || 
                                column.name.toLowerCase() === 'completed' ||
                                column.name.toLowerCase() === 'finished'
                                  ? 'opacity-75' 
                                  : ''
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-medium text-sm ${
                                  column.name.toLowerCase() === 'done' || 
                                  column.name.toLowerCase() === 'completed' ||
                                  column.name.toLowerCase() === 'finished'
                                    ? 'line-through text-gray-500 dark:text-gray-400' 
                                    : ''
                                }`}>{task.title}</h3>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => toggleTodayStatus(task.id, task.isToday)}
                                    className={`p-1 rounded transition-all hover:scale-110 ${
                                      task.isToday 
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' 
                                        : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                    }`}
                                    title={task.isToday ? 'Remove from today' : 'Mark for today'}
                                  >
                                    {task.isToday ? '📅' : '🗓️'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-gray-400 hover:text-red-500 text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              {task.description && (
                                <p className={`text-xs mb-2 ${
                                  column.name.toLowerCase() === 'done' || 
                                  column.name.toLowerCase() === 'completed' ||
                                  column.name.toLowerCase() === 'finished'
                                    ? 'line-through text-gray-400 dark:text-gray-500' 
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {task.description}
                                </p>
                              )}
                              <div className="flex justify-end">
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

                {showNewTaskForm === column.id ? (
                  <div className="mt-4 bg-gray-800 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <input
                      type="text"
                      placeholder="Task title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCreateTask(column.id)
                        }
                      }}
                      className="w-full p-2 border rounded text-sm mb-2 dark:bg-gray-900 dark:border-gray-600"
                      autoFocus
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="w-full p-2 border rounded text-sm mb-3 h-20 dark:bg-gray-900 dark:border-gray-600"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCreateTask(column.id)}
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
                    onClick={() => setShowNewTaskForm(column.id)}
                    className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                  >
                    + Add task
                  </button>
                )}
              </div>
            ))}
            
            {/* New Column Form */}
            {showNewColumnForm ? (
              <div className="bg-gray-900 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold mb-3">New Column</h3>
                <input
                  type="text"
                  placeholder="Column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateColumn()
                    if (e.key === 'Escape') {
                      setNewColumnName("")
                      setShowNewColumnForm(false)
                    }
                  }}
                  className="w-full p-2 border rounded text-sm mb-3 dark:bg-gray-900 dark:border-gray-600"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateColumn}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setNewColumnName("")
                      setShowNewColumnForm(false)
                    }}
                    className="text-gray-600 px-3 py-1 text-sm hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewColumnForm(true)}
                className="bg-gray-900 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <span className="text-gray-500 dark:text-gray-400">+ Add Column</span>
              </button>
            )}
          </div>
        </DragDropContext>
    </div>
  )
}