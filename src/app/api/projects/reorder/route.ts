import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const { projectOrders } = await request.json()

    // Update all project orders in a transaction
    await prisma.$transaction(
      projectOrders.map((projectOrder: { id: string; sidebarOrder: number }) =>
        prisma.project.update({
          where: { id: projectOrder.id },
          data: { sidebarOrder: projectOrder.sidebarOrder }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating project order:', error)
    return NextResponse.json(
      { error: 'Failed to update project order' },
      { status: 500 }
    )
  }
}