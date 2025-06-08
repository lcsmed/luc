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
    const { name, order } = body
    const { id } = await params

    // Verify column ownership through project
    const column = await prisma.column.findFirst({
      where: {
        id: id,
        project: {
          authorId: user.id
        }
      }
    })

    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 })
    }

    const updateData: {
      name?: string
      order?: number
    } = {}
    
    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json({ error: "Column name is required" }, { status: 400 })
      }
      updateData.name = name.trim()
    }
    
    if (order !== undefined) {
      updateData.order = order
    }

    const updatedColumn = await prisma.column.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json(updatedColumn)
  } catch (error) {
    console.error("Error updating column:", error)
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

    // Verify column ownership through project
    const column = await prisma.column.findFirst({
      where: {
        id: id,
        project: {
          authorId: user.id
        }
      },
      include: {
        project: {
          include: {
            columns: true
          }
        }
      }
    })

    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 })
    }

    // Prevent deleting the last column
    if (column.project.columns.length <= 1) {
      return NextResponse.json({ error: "Cannot delete the last column" }, { status: 400 })
    }

    // Check if column has tasks
    const taskCount = await prisma.task.count({
      where: { columnId: id }
    })

    if (taskCount > 0) {
      return NextResponse.json({ error: "Cannot delete column with tasks. Move or delete tasks first." }, { status: 400 })
    }

    await prisma.column.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting column:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}