import puppeteer, { Browser, Page } from 'puppeteer'
import { prisma } from './db'
import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { ScreenshotOptions, ViewportConfig } from '@/types'

export class ScreenshotService {
  private browser: Browser | null = null
  private screenshotsDir = path.join(process.cwd(), 'screenshots')

  constructor() {
    this.ensureScreenshotsDir()
  }

  async init() {
    // 确保截图目录存在
    await this.ensureScreenshotsDir()
    // 预初始化浏览器
    await this.getBrowser()
  }

  private async ensureScreenshotsDir() {
    if (!existsSync(this.screenshotsDir)) {
      await mkdir(this.screenshotsDir, { recursive: true })
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      })
    }
    return this.browser
  }

  async takeScreenshot(options: {
    url: string
    preScript?: string
    viewport?: ViewportConfig
    urlId?: string
  }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      console.log('ScreenshotService.takeScreenshot url:', options.url)
      // 设置视窗大小
      const viewport = options.viewport || { width: 1920, height: 1080, deviceScaleFactor: 1 }
      await page.setViewport(viewport)

      // 设置用户代理
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // 导航到页面
      await page.goto(options.url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      // 等待页面加载完成
      await page.waitForTimeout(2000)

      // 执行前置脚本（如果有）
      if (options.preScript) {
        try {
          await page.evaluate(options.preScript)
          // 等待脚本执行后的渲染
          await page.waitForTimeout(1000)
        } catch (error) {
          console.warn('Pre-script execution failed:', error)
        }
      }

      // 隐藏滚动条
      await page.addStyleTag({
        content: `
          ::-webkit-scrollbar { display: none; }
          * { scrollbar-width: none; }
          body { overflow: hidden; }
        `
      })

      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const urlHash = Buffer.from(options.url).toString('base64').slice(0, 8)
      const filename = `screenshot-${urlHash}-${timestamp}.png`
      const filePath = path.join(this.screenshotsDir, filename)

      // 截取全页面截图
      const screenshotBuffer = await page.screenshot({
        fullPage: true,
        type: 'png'
      })

      // 保存截图文件
      await writeFile(filePath, screenshotBuffer)

      // 保存到数据库
      const screenshot = await prisma.screenshot.create({
        data: {
          urlId: options.urlId || '',
          fileUrl: `/api/screenshots/${filename}`,
          filePath,
          isBaseline: false,
          metadata: JSON.stringify({
            url: options.url,
            viewport,
            timestamp: new Date().toISOString(),
            fileSize: screenshotBuffer.length
          })
        }
      })

      return screenshot
    } catch (error) {
      console.error('Screenshot failed:', error)
      throw new Error(`Failed to take screenshot: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      await page.close()
    }
  }

  async takeBaselineScreenshot(urlId: string, url: string, options?: ScreenshotOptions) {
    // 获取URL配置
    const urlConfig = await prisma.url.findUnique({
      where: { id: urlId }
    })

    if (!urlConfig) {
      throw new Error('URL configuration not found')
    }

    // 解析视窗配置
    const viewportConfig = JSON.parse(urlConfig.viewportConfig) as ViewportConfig

    // 截取截图
    const screenshot = await this.takeScreenshot({
      url,
      preScript: urlConfig.preScript || undefined,
      viewport: viewportConfig,
      urlId
    })

    // 将现有基准截图标记为非基准
    await prisma.screenshot.updateMany({
      where: {
        urlId,
        isBaseline: true
      },
      data: {
        isBaseline: false
      }
    })

    // 将新截图设为基准
    const baselineScreenshot = await prisma.screenshot.update({
      where: { id: screenshot.id },
      data: { isBaseline: true }
    })

    return baselineScreenshot
  }

  async getLatestScreenshot(urlId: string, isBaseline: boolean = false) {
    return await prisma.screenshot.findFirst({
      where: {
        urlId,
        isBaseline
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  // 清理旧截图文件（保留最近30天的截图）
  async cleanupOldScreenshots(daysToKeep: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const oldScreenshots = await prisma.screenshot.findMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        isBaseline: false // 不删除基准截图
      }
    })

    for (const screenshot of oldScreenshots) {
      try {
        // 删除文件
        if (existsSync(screenshot.filePath)) {
          const fs = await import('fs/promises')
          await fs.unlink(screenshot.filePath)
        }

        // 删除数据库记录
        await prisma.screenshot.delete({
          where: { id: screenshot.id }
        })
      } catch (error) {
        console.error(`Failed to cleanup screenshot ${screenshot.id}:`, error)
      }
    }

    return oldScreenshots.length
  }
}