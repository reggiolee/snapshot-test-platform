import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/settings/test-notification - 测试通知设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body // 'email' 或 'webhook'

    if (!type || !['email', 'webhook'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type. Must be "email" or "webhook"' },
        { status: 400 }
      )
    }

    // 获取通知设置
    const notificationSettings = await prisma.notificationSettings.findFirst()

    if (!notificationSettings) {
      return NextResponse.json(
        { error: 'No notification settings found' },
        { status: 404 }
      )
    }

    try {
      // 动态导入通知服务
      const { NotificationService } = await import('@/lib/notification')
      const notificationService = new NotificationService()

      if (type === 'email') {
        if (!notificationSettings.enabled) {
          return NextResponse.json(
            { error: 'Email notification is not enabled' },
            { status: 400 }
          )
        }

        await notificationService.sendTestEmail()
        return NextResponse.json({ message: 'Test email sent successfully' })
      } else if (type === 'webhook') {
        if (!notificationSettings.webhookUrl) {
          return NextResponse.json(
            { error: 'Webhook URL is not configured' },
            { status: 400 }
          )
        }

        await notificationService.sendTestWebhook()
        return NextResponse.json({ message: 'Test webhook sent successfully' })
      }
    } catch (error) {
      console.error('Failed to send test notification:', error)
      return NextResponse.json(
        { error: `Failed to send test ${type}: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Failed to test notification:', error)
    return NextResponse.json(
      { error: 'Failed to test notification' },
      { status: 500 }
    )
  }
}