import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/schedules/[id] - 获取单个定时任务
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: params.id },
      include: {
        taskGroup: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        scheduleExecutions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          include: {
            execution: {
              include: {
                results: {
                  select: {
                    status: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Failed to fetch schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// PUT /api/schedules/[id] - 更新定时任务
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { cronExpression, enabled } = body

    // 检查定时任务是否存在
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: params.id }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // 验证Cron表达式（如果提供）
    if (cronExpression && !isValidCronExpression(cronExpression)) {
      return NextResponse.json(
        { error: 'Invalid cron expression' },
        { status: 400 }
      )
    }

    // 更新定时任务
    const updatedSchedule = await prisma.schedule.update({
      where: { id: params.id },
      data: {
        ...(cronExpression && { cronExpression }),
        ...(enabled !== undefined && { enabled })
      },
      include: {
        taskGroup: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // 更新调度器中的任务
    try {
      const { SchedulerService } = await import('@/lib/scheduler')
      const scheduler = SchedulerService.getInstance()
      
      if (updatedSchedule.enabled) {
        await scheduler.updateSchedule(updatedSchedule)
      } else {
        await scheduler.removeSchedule(updatedSchedule.id)
      }
    } catch (error) {
      console.error('Failed to update scheduler:', error)
      // 不抛出错误，因为数据库更新已成功
    }

    return NextResponse.json(updatedSchedule)
  } catch (error) {
    console.error('Failed to update schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { cronExpression, enabled } = body

    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: params.id }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    if (cronExpression && !isValidCronExpression(cronExpression)) {
      return NextResponse.json(
        { error: 'Invalid cron expression' },
        { status: 400 }
      )
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id: params.id },
      data: {
        ...(cronExpression && { cronExpression }),
        ...(enabled !== undefined && { enabled })
      },
      include: {
        taskGroup: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    try {
      const { SchedulerService } = await import('@/lib/scheduler')
      const scheduler = SchedulerService.getInstance()
      if (updatedSchedule.enabled) {
        await scheduler.updateSchedule(updatedSchedule)
      } else {
        await scheduler.removeSchedule(updatedSchedule.id)
      }
    } catch (error) {
      console.error('Failed to update scheduler:', error)
    }

    return NextResponse.json(updatedSchedule)
  } catch (error) {
    console.error('Failed to update schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedules/[id] - 删除定时任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查定时任务是否存在
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: params.id }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // 从调度器中移除任务
    try {
      const { SchedulerService } = await import('@/lib/scheduler')
      const scheduler = SchedulerService.getInstance()
      await scheduler.removeSchedule(params.id)
    } catch (error) {
      console.error('Failed to remove from scheduler:', error)
      // 继续删除数据库记录
    }

    // 删除定时任务
    await prisma.schedule.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Schedule deleted successfully' })
  } catch (error) {
    console.error('Failed to delete schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}

// 简单的Cron表达式验证
function isValidCronExpression(expression: string): boolean {
  const parts = expression.trim().split(/\s+/)
  
  // 标准Cron表达式应该有5或6个部分
  if (parts.length !== 5 && parts.length !== 6) {
    return false
  }

  // 简单验证每个部分是否包含有效字符
  const validChars = /^[0-9\*\-\,\/\?LW#]+$/
  return parts.every(part => validChars.test(part))
}