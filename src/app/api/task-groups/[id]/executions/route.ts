import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/task-groups/[id]/executions - 获取任务组的执行历史
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 检查任务组是否存在
    const taskGroup = await prisma.taskGroup.findUnique({
      where: { id: params.id }
    })

    if (!taskGroup) {
      return NextResponse.json(
        { error: 'Task group not found' },
        { status: 404 }
      )
    }

    // 获取执行历史
    const executions = await prisma.execution.findMany({
      where: { taskGroupId: params.id },
      include: {
        results: {
          include: {
            url: true
          }
        },
        taskGroup: {
          select: {
            name: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: Math.min(limit, 100), // 限制最大返回数量
      skip: offset
    })

    // 获取总数
    const total = await prisma.execution.count({
      where: { taskGroupId: params.id }
    })

    return NextResponse.json({
      executions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch executions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    )
  }
}