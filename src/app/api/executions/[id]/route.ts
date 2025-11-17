import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/executions/[id] - 获取单个执行记录
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const execution = await prisma.execution.findUnique({
      where: { id: params.id },
      include: {
        taskGroup: {
          include: {
            urls: true
          }
        },
        results: {
          include: {
            url: true
          }
        }
      }
    })

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(execution)
  } catch (error) {
    console.error('Failed to fetch execution:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution' },
      { status: 500 }
    )
  }
}