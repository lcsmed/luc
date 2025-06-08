import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const { taskOrders } = await request.json()

    // Update all task orders in a transaction
    await prisma.$transaction(
      taskOrders.map((taskOrder: { id: string; todayOrder: number }) =>
        prisma.task.update({
          where: { id: taskOrder.id },
          data: { todayOrder: taskOrder.todayOrder }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating task order:', error)
    return NextResponse.json(
      { error: 'Failed to update task order' },
      { status: 500 }
    )
  }
}