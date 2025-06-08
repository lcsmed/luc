import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: { isToday: true },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        column: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching today tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today tasks' },
      { status: 500 }
    )
  }
}