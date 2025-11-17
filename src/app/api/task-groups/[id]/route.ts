import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/task-groups/[id] - 获取单个任务组
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskGroup = await prisma.taskGroup.findUnique({
      where: { id: params.id },
      include: {
        urls: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10
        }
      }
    })

    if (!taskGroup) {
      return NextResponse.json(
        { error: 'Task group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(taskGroup)
  } catch (error) {
    console.error('Failed to fetch task group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task group' },
      { status: 500 }
    )
  }
}

// PUT /api/task-groups/[id] - 更新任务组
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, defaultThreshold, urls } = body

    // 验证必填字段
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Task group name is required' },
        { status: 400 }
      )
    }

    if (!urls || urls.length === 0) {
      return NextResponse.json(
        { error: 'At least one URL is required' },
        { status: 400 }
      )
    }

    // 验证URL格式
    for (const url of urls) {
      if (!url.url || !url.name) {
        return NextResponse.json(
          { error: 'URL and name are required for each URL' },
          { status: 400 }
        )
      }
      
      try {
        new URL(url.url)
      } catch {
        return NextResponse.json(
          { error: `Invalid URL format: ${url.url}` },
          { status: 400 }
        )
      }
    }

    // 检查任务组是否存在
    const existingTaskGroup = await prisma.taskGroup.findUnique({
      where: { id: params.id }
    })

    if (!existingTaskGroup) {
      return NextResponse.json(
        { error: 'Task group not found' },
        { status: 404 }
      )
    }

    // 更新任务组
    const taskGroup = await prisma.$transaction(async (tx) => {
      // 删除现有的URLs
      await tx.url.deleteMany({
        where: { taskGroupId: params.id }
      })

      // 更新任务组并创建新的URLs
      return await tx.taskGroup.update({
        where: { id: params.id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          defaultThreshold: defaultThreshold || 0.1,
          urls: {
            create: urls.map((url: any) => ({
              url: url.url,
              name: url.name.trim(),
              threshold: url.threshold || null,
              preScript: url.preScript?.trim() || null
            }))
          }
        },
        include: {
          urls: true
        }
      })
    })

    return NextResponse.json(taskGroup)
  } catch (error) {
    console.error('Failed to update task group:', error)
    return NextResponse.json(
      { error: 'Failed to update task group' },
      { status: 500 }
    )
  }
}

// DELETE /api/task-groups/[id] - 删除任务组
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查任务组是否存在
    const existingTaskGroup = await prisma.taskGroup.findUnique({
      where: { id: params.id }
    })

    if (!existingTaskGroup) {
      return NextResponse.json(
        { error: 'Task group not found' },
        { status: 404 }
      )
    }

    // 删除任务组（级联删除相关数据）
    await prisma.taskGroup.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Task group deleted successfully' })
  } catch (error) {
    console.error('Failed to delete task group:', error)
    return NextResponse.json(
      { error: 'Failed to delete task group' },
      { status: 500 }
    )
  }
}