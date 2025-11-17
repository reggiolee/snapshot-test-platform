import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/settings - 获取系统设置
export async function GET() {
  try {
    // 获取通知设置
    let notificationSettings = await prisma.notificationSettings.findFirst()
    
    // 如果没有设置记录，创建默认设置
    if (!notificationSettings) {
      notificationSettings = await prisma.notificationSettings.create({
        data: {
          enabled: false,
          notifyOnFailure: true,
          notifyOnSuccess: false
        }
      })
    }

    // 获取系统信息
    const systemInfo = {
      platform: process.platform,
      nodeVersion: process.version,
      database: 'SQLite',
      screenshotEngine: 'Puppeteer'
    }

    return NextResponse.json({
      notification: notificationSettings,
      viewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      },
      system: systemInfo
    })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - 更新系统设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification, viewport } = body

    let updatedSettings = null

    // 更新通知设置
    if (notification) {
      const {
        enabled,
        emailHost,
        emailPort,
        emailUser,
        emailPassword,
        emailFrom,
        emailTo,
        webhookUrl,
        notifyOnFailure,
        notifyOnSuccess
      } = notification

      // 验证邮件设置
      if (enabled && emailHost && (!emailPort || !emailUser || !emailPassword || !emailFrom || !emailTo)) {
        return NextResponse.json(
          { error: 'Email configuration is incomplete' },
          { status: 400 }
        )
      }

      // 验证Webhook URL格式
      if (webhookUrl) {
        try {
          new URL(webhookUrl)
        } catch {
          return NextResponse.json(
            { error: 'Invalid webhook URL format' },
            { status: 400 }
          )
        }
      }

      // 查找现有设置
      const existingSettings = await prisma.notificationSettings.findFirst()

      if (existingSettings) {
        updatedSettings = await prisma.notificationSettings.update({
          where: { id: existingSettings.id },
          data: {
            enabled: enabled ?? existingSettings.enabled,
            emailHost: emailHost ?? existingSettings.emailHost,
            emailPort: emailPort ?? existingSettings.emailPort,
            emailUser: emailUser ?? existingSettings.emailUser,
            emailPassword: emailPassword ?? existingSettings.emailPassword,
            emailFrom: emailFrom ?? existingSettings.emailFrom,
            emailTo: emailTo ?? existingSettings.emailTo,
            webhookUrl: webhookUrl ?? existingSettings.webhookUrl,
            notifyOnFailure: notifyOnFailure ?? existingSettings.notifyOnFailure,
            notifyOnSuccess: notifyOnSuccess ?? existingSettings.notifyOnSuccess
          }
        })
      } else {
        updatedSettings = await prisma.notificationSettings.create({
          data: {
            enabled: enabled ?? false,
            emailHost,
            emailPort: emailPort ?? 587,
            emailUser,
            emailPassword,
            emailFrom,
            emailTo,
            webhookUrl,
            notifyOnFailure: notifyOnFailure ?? true,
            notifyOnSuccess: notifyOnSuccess ?? false
          }
        })
      }
    }

    // 视窗设置暂时存储在内存中（可以考虑添加到数据库）
    if (viewport) {
      // 验证视窗设置
      const { width, height, deviceScaleFactor } = viewport
      
      if (width && (width < 320 || width > 3840)) {
        return NextResponse.json(
          { error: 'Width must be between 320 and 3840' },
          { status: 400 }
        )
      }

      if (height && (height < 240 || height > 2160)) {
        return NextResponse.json(
          { error: 'Height must be between 240 and 2160' },
          { status: 400 }
        )
      }

      if (deviceScaleFactor && (deviceScaleFactor < 0.5 || deviceScaleFactor > 3)) {
        return NextResponse.json(
          { error: 'Device scale factor must be between 0.5 and 3' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      notification: updatedSettings
    })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}