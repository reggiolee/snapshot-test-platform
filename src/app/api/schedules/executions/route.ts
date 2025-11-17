import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    let limit = Number(limitParam || '20')
    if (!Number.isFinite(limit) || limit <= 0) limit = 20
    if (limit > 100) limit = 100

    const executions = await prisma.execution.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        taskGroup: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(executions)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    )
  }
}