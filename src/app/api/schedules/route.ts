import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/schedules - 获取所有定时任务
export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        taskGroup: {
          select: {
            id: true,
            name: true
          }
        },
        scheduleExecutions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
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
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

// POST /api/schedules - 创建新的定时任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskGroupId, cronExpression, enabled = true } = body

    // 验证必填字段
    if (!taskGroupId || !cronExpression) {
      return NextResponse.json(
        { error: 'Task group ID and cron expression are required' },
        { status: 400 }
      )
    }

    // 验证任务组是否存在
    const taskGroup = await prisma.taskGroup.findUnique({
      where: { id: taskGroupId }
    })

    if (!taskGroup) {
      return NextResponse.json(
        { error: 'Task group not found' },
        { status: 404 }
      )
    }

    // 验证Cron表达式格式（简单验证）
    if (!isValidCronExpression(cronExpression)) {
      return NextResponse.json(
        { error: 'Invalid cron expression' },
        { status: 400 }
      )
    }

    // 检查是否已存在相同任务组的定时任务
    const existingSchedule = await prisma.schedule.findFirst({
      where: { taskGroupId }
    })

    if (existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule already exists for this task group' },
        { status: 409 }
      )
    }

    // 创建定时任务
    const schedule = await prisma.schedule.create({
      data: {
        taskGroupId,
        cronExpression,
        enabled
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

    // 如果启用了定时任务，注册到调度器
    if (enabled) {
      try {
        const { SchedulerService } = await import('@/lib/scheduler')
        const scheduler = SchedulerService.getInstance()
        await scheduler.addSchedule(schedule)
      } catch (error) {
        console.error('Failed to register schedule:', error)
        // 不抛出错误，因为定时任务已创建成功
      }
    }

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Failed to create schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
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