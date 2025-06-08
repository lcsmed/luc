import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { isToday } = await request.json()

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { isToday },
      include: {
        project: true,
        column: true
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task today status:', error)
    return NextResponse.json(
      { error: 'Failed to update task today status' },
      { status: 500 }
    )
  }
}