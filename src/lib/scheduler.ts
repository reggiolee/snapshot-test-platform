import cron from 'node-cron'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { prisma } from './db'
import { ScreenshotService } from './screenshot'
import { ComparisonService } from './comparison'
import { NotificationService } from './notification'
import type { ExecutionStatus, ResultStatus, TaskGroup, Url, Schedule } from '@/types'

export class SchedulerService {
  private static instance: SchedulerService
  private tasks: Map<string, cron.ScheduledTask> = new Map()
  private running: Set<string> = new Set()
  private screenshotService: ScreenshotService
  private comparisonService: ComparisonService
  private notificationService: NotificationService

  constructor() {
    this.screenshotService = new ScreenshotService()
    this.comparisonService = new ComparisonService()
    this.notificationService = new NotificationService()
  }

  static getInstance(): SchedulerService {
    const g: any = globalThis as any
    if (!g.__schedulerService) {
      g.__schedulerService = new SchedulerService()
    }
    return g.__schedulerService
  }

  async init() {
    await this.screenshotService.init()
    await this.notificationService.init()
    await this.loadScheduledTasks()
  }

  async loadScheduledTasks() {
    console.log('Loading scheduled tasks...')
    
    try {
      // 加载所有启用的定时任务
      const schedules = await prisma.schedule.findMany({
        where: { enabled: true },
        include: {
          taskGroup: {
            include: {
              urls: true
            }
          }
        }
      })

      for (const schedule of schedules) {
        await this.addSchedule(schedule)
      }

      console.log(`Loaded ${schedules.length} scheduled tasks`)
    } catch (error) {
      console.error('Failed to load scheduled tasks:', error)
    }
  }

  async addSchedule(schedule: any) {
    try {
      // 验证Cron表达式
      if (!cron.validate(schedule.cronExpression)) {
        throw new Error(`Invalid cron expression: ${schedule.cronExpression}`)
      }

      // 如果任务已存在，先移除
      if (this.tasks.has(schedule.id)) {
        await this.removeSchedule(schedule.id)
      }

      // 创建定时任务
      const task = cron.schedule(
        schedule.cronExpression,
        async () => {
          await this.executeScheduledTask(schedule.id)
        },
        {
          scheduled: true,
          timezone: schedule.timezone || 'Asia/Shanghai'
        }
      )

      // 保存任务引用
      this.tasks.set(schedule.id, task)

      // 更新下次执行时间
      await this.updateNextExecution(schedule.id, schedule.cronExpression, schedule.timezone)

      console.log(`Added schedule: ${schedule.taskGroup?.name} (${schedule.cronExpression})`)
    } catch (error) {
      console.error(`Failed to add schedule ${schedule.id}:`, error)
      throw error
    }
  }

  async removeSchedule(scheduleId: string) {
    const task = this.tasks.get(scheduleId)
    if (task) {
      task.stop()
      this.tasks.delete(scheduleId)
      console.log(`Removed schedule: ${scheduleId}`)
    }
  }

  async updateSchedule(schedule: any) {
    await this.removeSchedule(schedule.id)
    if (schedule.enabled) {
      await this.addSchedule(schedule)
    }
  }

  private async executeScheduledTask(scheduleId: string) {
    if (this.running.has(scheduleId)) {
      return
    }
    const existingRunning = await prisma.scheduleExecution.findFirst({
      where: { scheduleId, completedAt: null }
    })
    if (existingRunning) {
      return
    }
    this.running.add(scheduleId)
    try {
      // 记录调度执行开始
      const scheduleExecution = await prisma.scheduleExecution.create({
        data: {
          scheduleId,
          triggerType: 'scheduled',
          startedAt: new Date()
        }
      })

      // 获取任务组信息
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          taskGroup: {
            include: {
              urls: true
            }
          }
        }
      })

      if (!schedule || !schedule.taskGroup) {
        throw new Error('Schedule or task group not found')
      }

      // 创建执行记录
      const execution = await prisma.execution.create({
        data: {
          taskGroupId: schedule.taskGroupId,
          status: 'running',
          startedAt: new Date()
        }
      })

      // 更新调度执行记录
      await prisma.scheduleExecution.update({
        where: { id: scheduleExecution.id },
        data: { executionId: execution.id }
      })

      // 执行任务组
      await this.executeTaskGroup(execution.id, schedule.taskGroup)

      // 更新调度执行状态
      await prisma.scheduleExecution.update({
        where: { id: scheduleExecution.id },
        data: {
          success: true,
          completedAt: new Date()
        }
      })

      // 更新最后执行时间
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { lastExecution: new Date() }
      })

    } catch (error) {
      console.error(`Scheduled task failed: ${scheduleId}`, error)
      
      // 更新调度执行状态为失败
      try {
        await prisma.scheduleExecution.updateMany({
          where: {
            scheduleId,
            completedAt: null
          },
          data: {
            success: false,
            errorMessage: error instanceof Error ? error.message : String(error),
            completedAt: new Date()
          }
        })
      } catch (updateError) {
        console.error('Failed to update schedule execution status:', updateError)
      }
    } finally {
      this.running.delete(scheduleId)
    }
  }

  private async executeTaskGroup(executionId: string, taskGroup: any) {
    try {
      // 动态导入服务
      const { ScreenshotService } = await import('./screenshot')
      const { ComparisonService } = await import('./comparison')
      
      const screenshotService = new ScreenshotService()
      const comparisonService = new ComparisonService()

      const results = []

      for (const url of taskGroup.urls) {
        if (!url.isActive) {
          continue // 跳过未激活的URL
        }

        try {
          const startTime = Date.now()

          // 截取当前截图
          const currentScreenshot = await screenshotService.takeScreenshot({
            url: url.url,
            preScript: url.preScript,
            viewport: JSON.parse(url.viewportConfig),
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
                thresholdSource: url.threshold ? 'url' : 'taskGroup',
                currentScreenshotUrl: currentScreenshot.fileUrl
              }
            })
          } else {
            // 进行图像比对
            const comparison = await comparisonService.compareImages(
              baselineScreenshot.filePath,
              currentScreenshot.filePath
            )

            // 判断是否通过
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
                thresholdSource: url.threshold ? 'url' : 'taskGroup',
                baselineScreenshotUrl: baselineScreenshot.fileUrl,
                currentScreenshotUrl: currentScreenshot.fileUrl,
                diffImageUrl: comparison.diffImagePath ? `/api/screenshots/diff/${path.basename(comparison.diffImagePath)}` : null
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
              status: 'error' as ResultStatus,
              similarity: 0,
              diffPixels: 0,
              thresholdUsed: url.threshold || taskGroup.defaultThreshold,
              thresholdSource: url.threshold ? 'url' : 'taskGroup'
            }
          })
          
          results.push(result)
        }
      }

      // 更新执行状态
      const passedCount = results.filter(r => r.status === 'passed').length
      const failedCount = results.filter(r => r.status === 'failed').length
      const errorCount = results.filter(r => r.status === 'error').length

      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: errorCount > 0 ? 'error' : (failedCount > 0 ? 'failed' : 'completed'),
          completedAt: new Date(),
          summary: JSON.stringify({
            total: results.length,
            passed: passedCount,
            failed: failedCount,
            errors: errorCount
          })
        }
      })

      // 发送通知（如果配置了）
      await this.sendNotificationIfNeeded(executionId, results)

    } catch (error) {
      console.error('Task group execution failed:', error)
      
      // 更新执行状态为失败
      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: 'error',
          completedAt: new Date(),
          summary: JSON.stringify({
            error: error instanceof Error ? error.message : String(error)
          })
        }
      })
      
      throw error
    }
  }

  private async sendNotificationIfNeeded(executionId: string, results: any[]) {
    try {
      // 获取通知设置
      const notificationSettings = await prisma.notificationSettings.findFirst()
      
      if (!notificationSettings || !notificationSettings.enabled) {
        return
      }

      const failedResults = results.filter(r => r.status === 'failed' || r.status === 'error')
      const shouldNotify = !notificationSettings.notifyOnFailure || failedResults.length > 0

      if (!shouldNotify) {
        return
      }

      // 动态导入通知服务
      const { NotificationService } = await import('./notification')
      const notificationService = new NotificationService()

      await notificationService.sendExecutionNotification(executionId, results)
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  private async updateNextExecution(scheduleId: string, cronExpression: string, timezone?: string) {
    try {
      // 计算下次执行时间
      const task = cron.schedule(cronExpression, () => {}, {
        scheduled: false,
        timezone: timezone || 'Asia/Shanghai'
      })

      // 获取下次执行时间（这里需要手动计算，因为node-cron没有直接提供API）
      // 简化实现：设置为当前时间加1小时
      const nextExecution = new Date()
      nextExecution.setHours(nextExecution.getHours() + 1)

      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { nextExecution }
      })

      // task对象不需要destroy
    } catch (error) {
      console.error('Failed to update next execution time:', error)
    }
  }

  getScheduledTasks() {
    return Array.from(this.tasks.keys())
  }

  async shutdown() {
    console.log('Shutting down scheduler service...')
    
    this.tasks.forEach((task, scheduleId) => {
      task.stop()
    })
    
    this.tasks.clear()
    await this.screenshotService.cleanup()
    console.log('Scheduler service shut down')
  }
}
