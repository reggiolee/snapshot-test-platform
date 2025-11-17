import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import path from 'path'

// POST /api/task-groups/[id]/execute - 执行任务组
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查任务组是否存在
    const taskGroup = await prisma.taskGroup.findUnique({
      where: { id: params.id },
      include: {
        urls: true
      }
    })

    if (!taskGroup) {
      return NextResponse.json(
        { error: 'Task group not found' },
        { status: 404 }
      )
    }

    if (!taskGroup.urls || taskGroup.urls.length === 0) {
      return NextResponse.json(
        { error: 'No URLs configured for this task group' },
        { status: 400 }
      )
    }

    // 创建执行记录
    const execution = await prisma.execution.create({
      data: {
        taskGroupId: params.id,
        status: 'running',
        startedAt: new Date()
      }
    })

    // 异步执行任务（不阻塞响应）
    executeTaskGroup(execution.id, taskGroup).catch(error => {
      console.error('Task group execution failed:', error)
      // 更新执行状态为失败
      prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          completedAt: new Date()
        }
      }).catch(console.error)
    })

    return NextResponse.json({
      executionId: execution.id,
      message: 'Task group execution started'
    })
  } catch (error) {
    console.error('Failed to start task group execution:', error)
    return NextResponse.json(
      { error: 'Failed to start task group execution' },
      { status: 500 }
    )
  }
}

// 异步执行任务组的函数
async function executeTaskGroup(executionId: string, taskGroup: any) {
  try {
    // 动态导入截图服务（避免在API路由中直接导入Puppeteer）
    const { ScreenshotService } = await import('@/lib/screenshot')
    const { ComparisonService } = await import('@/lib/comparison')
    
    const screenshotService = new ScreenshotService()
    const comparisonService = new ComparisonService()

    const results = []

    for (const url of taskGroup.urls) {
      try {
        const startTime = Date.now()

        // 截取当前截图
        const currentScreenshot = await screenshotService.takeScreenshot({
          url: url.url,
          preScript: url.preScript,
          urlId: url.id
        })

        // 查找基准截图
        const baselineScreenshot = await prisma.screenshot.findFirst({
          where: {
            urlId: url.id,
            isBaseline: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        let result
        if (!baselineScreenshot) {
          // 如果没有基准截图，将当前截图设为基准
          await prisma.screenshot.update({
            where: { id: currentScreenshot.id },
            data: { isBaseline: true }
          })

          result = await prisma.result.create({
            data: {
              executionId,
              urlId: url.id,
              status: 'passed',
              similarity: 1.0,
              diffPixels: 0,
              thresholdUsed: url.threshold || taskGroup.defaultThreshold,
              thresholdSource: url.threshold ? 'url' : 'task_group',
              currentScreenshotUrl: currentScreenshot.fileUrl
            }
          })
        } else {
          // 进行图像比对
          const comparison = await comparisonService.compareImages(
            baselineScreenshot.filePath,
            currentScreenshot.filePath
          )

          // 判断是否通过（threshold 采用 0-1 浮点阈值）
          const threshold = url.threshold || taskGroup.defaultThreshold
          const passed = comparison.difference <= threshold

          result = await prisma.result.create({
            data: {
              executionId,
              urlId: url.id,
              status: passed ? 'passed' : 'failed',
              similarity: 1 - comparison.difference,
              diffPixels: comparison.diffPixels,
              thresholdUsed: threshold,
              thresholdSource: url.threshold ? 'url' : 'task_group',
              baselineScreenshotUrl: baselineScreenshot.fileUrl,
              currentScreenshotUrl: currentScreenshot.fileUrl,
              diffImageUrl: comparison.diffImagePath ? `/api/screenshots/${path.basename(comparison.diffImagePath)}` : null
            }
          })
        }

        results.push(result)
      } catch (error) {
        console.error(`Failed to process URL ${url.url}:`, error)
        
        // 创建失败结果
        const result = await prisma.result.create({
          data: {
            executionId,
            urlId: url.id,
            status: 'error',
            similarity: 0,
            diffPixels: 0,
            thresholdUsed: url.threshold || taskGroup.defaultThreshold,
            thresholdSource: url.threshold ? 'url' : 'task_group'
          }
        })
        
        results.push(result)
      }
    }

    // 更新执行状态
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })

    // 发送通知（如果配置了）
    await sendNotificationIfNeeded(executionId, results)

  } catch (error) {
    console.error('Task group execution failed:', error)
    
    // 更新执行状态为失败
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'failed',
        completedAt: new Date()
      }
    })
    
    throw error
  }
}

// 发送通知的函数
async function sendNotificationIfNeeded(executionId: string, results: any[]) {
  try {
    // 获取通知设置
    const notificationSettings = await prisma.notificationSettings.findFirst()
    
    if (!notificationSettings) {
      return
    }

    const failedResults = results.filter(r => r.status === 'failed' || r.status === 'error')
    const shouldNotify = notificationSettings.enabled && (notificationSettings.notifyOnSuccess || failedResults.length > 0)

    if (!shouldNotify) {
      return
    }

    // 动态导入通知服务
    const { NotificationService } = await import('@/lib/notification')
    const notificationService = new NotificationService()

    await notificationService.sendExecutionNotification(executionId, results)
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}