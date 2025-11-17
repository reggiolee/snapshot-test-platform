import { ScreenshotService } from '../src/lib/screenshot'
import { ComparisonService } from '../src/lib/comparison'
import { NotificationService } from '../src/lib/notification'
import { SchedulerService } from '../src/lib/scheduler'
import type { ScreenshotOptions } from '../src/types'
import { prisma } from '../src/lib/db'

async function testServices() {
  console.log('开始测试所有服务...')

  try {
    // 1. 测试截图服务
    console.log('\n1. 测试截图服务...')
    const screenshotService = new ScreenshotService()
    await screenshotService.init()
    
    // 获取第一个任务组进行测试
    const taskGroup = await prisma.taskGroup.findFirst({
      include: { urls: true }
    })
    
    if (!taskGroup || taskGroup.urls.length === 0) {
      console.log('没有找到任务组或URL，跳过截图测试')
    } else {
      const url = taskGroup.urls[0]
      console.log(`正在为 ${url.url} 截图...`)
      
      const screenshot = await screenshotService.takeScreenshot({
        url: url.url,
        preScript: url.preScript || undefined,
        urlId: url.id,
        viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 }
      })
      
      console.log(`截图成功，ID: ${screenshot.id}`)
    }
    
    await screenshotService.cleanup()

    // 2. 测试比对服务
    console.log('\n2. 测试比对服务...')
    const comparisonService = new ComparisonService()
    
    // 获取两张截图进行比对测试
    const screenshots = await prisma.screenshot.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' }
    })
    
    if (screenshots.length >= 2) {
      console.log(`正在比对截图 ${screenshots[0].id} 和 ${screenshots[1].id}...`)
      
      const result = await comparisonService.compareScreenshots(
        screenshots[0].id,
        screenshots[1].id
      )
      
      console.log(`比对完成，差异百分比: ${result.diffPercentage}%`)
    } else {
      console.log('截图数量不足，跳过比对测试')
    }

    // 3. 测试通知服务
    console.log('\n3. 测试通知服务...')
    const notificationService = new NotificationService()
    await notificationService.init()
    
    // 获取通知设置
    const settings = await prisma.notificationSettings.findFirst()
    if (settings) {
      console.log('通知设置已加载')
      
      // 测试邮件通知（如果启用）
      if (settings.enabled && settings.emailHost) {
        try {
          await notificationService.sendTestEmail()
          console.log('测试邮件发送成功')
        } catch (error) {
          console.log('测试邮件发送失败:', error)
        }
      }
      
      // 测试Webhook通知（如果启用）
      if (settings.webhookUrl) {
        try {
          await notificationService.sendTestWebhook()
          console.log('测试Webhook发送成功')
        } catch (error) {
          console.log('测试Webhook发送失败:', error)
        }
      }
    }

    // 4. 测试调度服务
    console.log('\n4. 测试调度服务...')
    const schedulerService = new SchedulerService()
    await schedulerService.init()
    
    const schedules = await prisma.schedule.findMany({
      where: { enabled: true }
    })
    
    console.log(`找到 ${schedules.length} 个启用的定时任务`)
    
    if (schedules.length > 0) {
      console.log('定时任务已加载到调度器')
    }
    
    await schedulerService.shutdown()

    console.log('\n✅ 所有服务测试完成！')

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
testServices().catch(console.error)