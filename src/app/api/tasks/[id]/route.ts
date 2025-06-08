import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, status, priority, order } = body

    const { id } = await params

    // Verify task ownership through project
    const task = await prisma.task.findFirst({
      where: {
        id: id,
        project: {
          authorId: user.id
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const updateData: {
      title?: string
      description?: string | null
      status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
      order?: number
    } = {}
    
    if (title !== undefined) {
      if (!title?.trim()) {
        return NextResponse.json({ error: "Task title is required" }, { status: 400 })
      }
      updateData.title = title.trim()
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    
    if (status !== undefined) {
      updateData.status = status
    }
    
    if (priority !== undefined) {
      updateData.priority = priority
    }
    
    if (order !== undefined) {
      updateData.order = order
    }

    const updatedTask = await prisma.task.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params

    // Verify task ownership through project
    const task = await prisma.task.findFirst({
      where: {
        id: id,
        project: {
          authorId: user.id
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}