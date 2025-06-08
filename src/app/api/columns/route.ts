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
    const { name, projectId } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Column name is required" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        authorId: user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get the next order for the column
    const lastColumn = await prisma.column.findFirst({
      where: {
        projectId: projectId
      },
      orderBy: {
        order: 'desc'
      }
    })

    const column = await prisma.column.create({
      data: {
        name: name.trim(),
        order: lastColumn ? lastColumn.order + 1 : 0,
        projectId: projectId
      }
    })

    return NextResponse.json(column)
  } catch (error) {
    console.error("Error creating column:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}