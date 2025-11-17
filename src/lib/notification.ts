import nodemailer from 'nodemailer'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import type { NotificationSettings } from '@/types'
import path from 'path'
import { prisma } from './db'

// NotificationSettings 已在 @/types 中定义

export class NotificationService {
  private transporter: nodemailer.Transporter | null = null
  private settings: any = null

  constructor() {
    // 构造函数中不执行异步操作
  }

  async init() {
    await this.loadSettings()
  }

  private async loadSettings() {
    try {
      this.settings = await prisma.notificationSettings.findFirst()
      if (this.settings && this.settings.enabled && this.settings.emailHost) {
        await this.initializeEmailTransporter()
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }

  private async initializeEmailTransporter() {
    try {
      if (this.settings && this.settings.enabled && this.settings.emailHost) {
        this.transporter = nodemailer.createTransport({
          host: this.settings.emailHost,
          port: this.settings.emailPort,
          secure: this.settings.emailPort === 465, // true for 465, false for other ports
          auth: {
            user: this.settings.emailUser,
            pass: this.settings.emailPassword
          }
        })
      }
    } catch (error) {
      console.error('Failed to initialize email transporter:', error)
    }
  }

  async sendExecutionNotification(executionId: string, results: any[]) {
    try {
      // 获取执行详情
      const execution = await prisma.execution.findUnique({
        where: { id: executionId },
        include: {
          taskGroup: true,
          results: {
            include: {
              url: true
            }
          }
        }
      })

      if (!execution) {
        throw new Error('Execution not found')
      }

      // 获取通知设置
      const settings = await prisma.notificationSettings.findFirst()
      if (!settings || !settings.enabled) {
        return
      }

      const failedResults = results.filter(r => r.status === 'failed' || r.status === 'error')
      const passedResults = results.filter(r => r.status === 'passed')

      // 检查是否需要发送通知
      const shouldNotify = settings.notifyOnSuccess || 
                          (settings.notifyOnFailure && failedResults.length > 0)

      if (!shouldNotify) {
        return
      }

      // 准备通知内容
      const notificationData = {
        execution,
        taskGroup: execution.taskGroup,
        summary: {
          total: results.length,
          passed: passedResults.length,
          failed: failedResults.length,
          status: failedResults.length > 0 ? 'FAILED' : 'PASSED'
        },
        failedResults,
        timestamp: new Date().toISOString()
      }

      // 发送邮件通知
      if (settings.emailHost && settings.emailTo) {
        await this.sendEmailNotification(notificationData)
      }

      // 发送Webhook通知
      if (settings.webhookUrl) {
        await this.sendWebhookNotification(notificationData)
      }

    } catch (error) {
      console.error('Failed to send execution notification:', error)
    }
  }

  private async sendEmailNotification(data: any) {
    try {
      if (!this.transporter) {
        await this.initializeEmailTransporter()
      }

      if (!this.transporter) {
        throw new Error('Email transporter not configured')
      }

      const settings = await prisma.notificationSettings.findFirst()
      if (!settings || !settings.emailTo || !settings.emailFrom) {
        throw new Error('Email settings incomplete')
      }

      const subject = `[镜准] ${data.taskGroup.name} - ${data.summary.status}`
      const htmlContent = this.generateEmailHTML(data)
      const textContent = this.generateEmailText(data)

      const mailOptions = {
        from: settings.emailFrom,
        to: settings.emailTo,
        subject,
        text: textContent,
        html: htmlContent
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('Email notification sent:', info.messageId)
    } catch (error) {
      console.error('Failed to send email notification:', error)
      throw error
    }
  }

  private async sendWebhookNotification(data: any) {
    try {
      const settings = await prisma.notificationSettings.findFirst()
      if (!settings || !settings.webhookUrl) {
        throw new Error('Webhook URL not configured')
      }

      const payload = {
        type: 'execution_completed',
        data: {
          executionId: data.execution.id,
          taskGroupName: data.taskGroup.name,
          status: data.summary.status,
          summary: data.summary,
          failedUrls: data.failedResults.map((r: any) => ({
            url: r.url.url,
            name: r.url.name,
            status: r.status,
            similarity: r.similarity
          })),
          timestamp: data.timestamp
        }
      }

      const response = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SnapshotTestPlatform/1.0'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`)
      }

      console.log('Webhook notification sent successfully')
    } catch (error) {
      console.error('Failed to send webhook notification:', error)
      throw error
    }
  }

  private generateEmailHTML(data: any): string {
    const { execution, taskGroup, summary, failedResults } = data

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>镜准结果通知</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .status-passed { color: #28a745; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
        .summary { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .failed-item { background: #f8d7da; padding: 10px; margin: 10px 0; border-radius: 3px; border-left: 4px solid #dc3545; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>镜准结果通知</h2>
            <p><strong>任务组:</strong> ${taskGroup.name}</p>
            <p><strong>状态:</strong> <span class="status-${summary.status.toLowerCase()}">${summary.status}</span></p>
            <p><strong>执行时间:</strong> ${new Date(execution.startedAt).toLocaleString('zh-CN')}</p>
        </div>

        <div class="summary">
            <h3>执行摘要</h3>
            <ul>
                <li>总计: ${summary.total} 个URL</li>
                <li>通过: ${summary.passed} 个</li>
                <li>失败: ${summary.failed} 个</li>
            </ul>
        </div>

        ${failedResults.length > 0 ? `
        <div>
            <h3>失败详情</h3>
            ${failedResults.map((result: any) => `
            <div class="failed-item">
                <strong>${result.url.name}</strong><br>
                URL: ${result.url.url}<br>
                状态: ${result.status}<br>
                相似度: ${result.similarity ? (result.similarity * 100).toFixed(2) + '%' : 'N/A'}
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>此邮件由镜准自动发送，请勿回复。</p>
        </div>
    </div>
</body>
</html>
    `
  }

  private generateEmailText(data: any): string {
    const { execution, taskGroup, summary, failedResults } = data

    let text = `镜准结果通知\n\n`
    text += `任务组: ${taskGroup.name}\n`
    text += `状态: ${summary.status}\n`
    text += `执行时间: ${new Date(execution.startedAt).toLocaleString('zh-CN')}\n\n`
    
    text += `执行摘要:\n`
    text += `- 总计: ${summary.total} 个URL\n`
    text += `- 通过: ${summary.passed} 个\n`
    text += `- 失败: ${summary.failed} 个\n\n`

    if (failedResults.length > 0) {
      text += `失败详情:\n`
      failedResults.forEach((result: any) => {
        text += `- ${result.url.name} (${result.url.url})\n`
        text += `  状态: ${result.status}\n`
        text += `  相似度: ${result.similarity ? (result.similarity * 100).toFixed(2) + '%' : 'N/A'}\n\n`
      })
    }

    text += `此邮件由镜准自动发送，请勿回复。`
    return text
  }

  async sendTestEmail() {
    try {
      const settings = await prisma.notificationSettings.findFirst()
      if (!settings || !settings.emailTo || !settings.emailFrom) {
        throw new Error('Email settings incomplete')
      }

      if (!this.transporter) {
        await this.initializeEmailTransporter()
      }

      if (!this.transporter) {
        throw new Error('Email transporter not configured')
      }

      const mailOptions = {
        from: settings.emailFrom,
        to: settings.emailTo,
        subject: '[镜准] 测试邮件',
        text: '这是一封测试邮件，用于验证邮件配置是否正确。',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>测试邮件</h2>
            <p>这是一封测试邮件，用于验证邮件配置是否正确。</p>
            <p>如果您收到此邮件，说明邮件配置已成功！</p>
            <hr>
            <p style="font-size: 12px; color: #666;">发送时间: ${new Date().toLocaleString('zh-CN')}</p>
          </div>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('Test email sent:', info.messageId)
      return info
    } catch (error) {
      console.error('Failed to send test email:', error)
      throw error
    }
  }

  async sendTestWebhook() {
    try {
      const settings = await prisma.notificationSettings.findFirst()
      if (!settings || !settings.webhookUrl) {
        throw new Error('Webhook URL not configured')
      }

      const payload = {
        type: 'test',
        data: {
          message: '这是一个测试Webhook请求',
          timestamp: new Date().toISOString(),
          platform: '镜准'
        }
      }

      const response = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SnapshotTestPlatform/1.0'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`)
      }

      console.log('Test webhook sent successfully')
      return { status: response.status, statusText: response.statusText }
    } catch (error) {
      console.error('Failed to send test webhook:', error)
      throw error
    }
  }
}