import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/task-groups - 获取所有任务组
export async function GET() {
  try {
    const taskGroups = await prisma.taskGroup.findMany({
      include: {
        urls: true,
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(taskGroups)
  } catch (error) {
    console.error('Failed to fetch task groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task groups' },
      { status: 500 }
    )
  }
}

// POST /api/task-groups - 创建新任务组
export async function POST(request: NextRequest) {
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

    // 创建任务组和URL
    const taskGroup = await prisma.taskGroup.create({
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

    return NextResponse.json(taskGroup, { status: 201 })
  } catch (error) {
    console.error('Failed to create task group:', error)
    return NextResponse.json(
      { error: 'Failed to create task group' },
      { status: 500 }
    )
  }
}