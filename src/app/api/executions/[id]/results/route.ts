import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/executions/[id]/results - 获取执行的所有结果
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查执行记录是否存在
    const execution = await prisma.execution.findUnique({
      where: { id: params.id }
    })

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      )
    }

    // 获取执行结果
    const results = await prisma.result.findMany({
      where: { executionId: params.id },
      include: {
        url: true,
        execution: {
          include: {
            taskGroup: {
              select: {
                defaultThreshold: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Failed to fetch execution results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution results' },
      { status: 500 }
    )
  }
}