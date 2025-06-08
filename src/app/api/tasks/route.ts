import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
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
    const { title, description, columnId, projectId } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    if (!columnId) {
      return NextResponse.json({ error: "Column ID is required" }, { status: 400 })
    }

    // Verify project ownership and column belongs to project
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        projectId: projectId,
        project: {
          authorId: user.id
        }
      }
    })

    if (!column) {
      return NextResponse.json({ error: "Column not found or unauthorized" }, { status: 404 })
    }

    // Get the next order for the column
    const lastTask = await prisma.task.findFirst({
      where: {
        columnId: columnId
      },
      orderBy: {
        order: 'desc'
      }
    })

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        order: lastTask ? lastTask.order + 1 : 0,
        projectId: projectId,
        columnId: columnId
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}