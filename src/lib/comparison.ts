import pixelmatch from 'pixelmatch'
import sharp from 'sharp'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { ComparisonResult, ComparisonOptions } from '@/types'

export class ComparisonService {
  private diffDir: string

  constructor() {
    this.diffDir = path.join(process.cwd(), 'storage', 'diffs')
    this.ensureDiffsDir()
  }

  private async ensureDiffsDir() {
    if (!existsSync(this.diffDir)) {
      await mkdir(this.diffDir, { recursive: true })
    }
  }

  async compareImages(
    baselineImagePath: string,
    currentImagePath: string,
    options?: ComparisonOptions
  ): Promise<ComparisonResult> {
    try {
      // 检查文件是否存在
      if (!existsSync(baselineImagePath)) {
        throw new Error('Baseline image not found')
      }
      if (!existsSync(currentImagePath)) {
        throw new Error('Current image not found')
      }

      // 读取图像
      const baselineBuffer = await readFile(baselineImagePath)
      const currentBuffer = await readFile(currentImagePath)

      // 使用Sharp处理图像，确保尺寸一致
      const baselineImage = sharp(baselineBuffer)
      const currentImage = sharp(currentBuffer)

      // 获取基准图像的元数据
      const baselineMetadata = await baselineImage.metadata()
      const { width, height } = baselineMetadata

      if (!width || !height) {
        throw new Error('Invalid baseline image dimensions')
      }

      // 调整当前图像尺寸以匹配基准图像
      const resizedCurrentBuffer = await currentImage
        .resize(width, height, { fit: 'fill' })
        .png()
        .toBuffer()

      const resizedBaselineBuffer = await baselineImage
        .png()
        .toBuffer()

      // 转换为RGBA格式用于pixelmatch
      const baselineRgba = await sharp(resizedBaselineBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer()

      const currentRgba = await sharp(resizedCurrentBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer()

      // 创建差异图像缓冲区
      const diffBuffer = Buffer.alloc(width * height * 4)

      // 执行像素比较
      const diffPixels = pixelmatch(
        baselineRgba,
        currentRgba,
        diffBuffer,
        width,
        height,
        {
          threshold: options?.threshold || 0.1,
          includeAA: options?.includeAA || false,
          alpha: options?.alpha || 0.1,
          aaColor: options?.aaColor || [255, 255, 0],
          diffColor: options?.diffColor || [255, 0, 0]
        }
      )

      // 计算差异百分比
      const totalPixels = width * height
      const difference = diffPixels / totalPixels

      let diffImagePath: string | null = null

      // 如果有差异，保存差异图像
      if (diffPixels > 0) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const diffFilename = `diff-${timestamp}.png`
        diffImagePath = path.join(this.diffDir, diffFilename)

        // 将差异缓冲区转换为PNG并保存
        await sharp(diffBuffer, {
          raw: {
            width,
            height,
            channels: 4
          }
        })
          .png()
          .toFile(diffImagePath)
      }

      return {
        difference,
        diffPixels,
        totalPixels,
        diffImagePath,
        passed: false, // 这个值会在调用方根据阈值设置
        metadata: {
          baselineSize: baselineBuffer.length,
          currentSize: currentBuffer.length,
          dimensions: { width, height },
          comparisonOptions: options || {}
        }
      }
    } catch (error) {
      console.error('Image comparison failed:', error)
      throw new Error(`Image comparison failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async compareScreenshots(
    baselineScreenshotId: string,
    currentScreenshotId: string,
    threshold: number = 0.1
  ): Promise<ComparisonResult> {
    const { prisma } = await import('./db')

    // 获取截图记录
    const baselineScreenshot = await prisma.screenshot.findUnique({
      where: { id: baselineScreenshotId }
    })

    const currentScreenshot = await prisma.screenshot.findUnique({
      where: { id: currentScreenshotId }
    })

    if (!baselineScreenshot || !currentScreenshot) {
      throw new Error('Screenshot records not found')
    }

    // 执行图像比较
    const result = await this.compareImages(
      baselineScreenshot.filePath,
      currentScreenshot.filePath,
      { threshold: threshold / 100 } // 将百分比转换为小数
    )

    // 设置通过状态
    result.passed = result.difference <= (threshold / 100)
    
    // 添加差异百分比字段
    result.diffPercentage = result.difference * 100

    return result
  }

  // 批量比较多个图像
  async batchCompare(
    comparisons: Array<{
      baselineImagePath: string
      currentImagePath: string
      threshold?: number
    }>
  ): Promise<ComparisonResult[]> {
    const results: ComparisonResult[] = []

    for (const comparison of comparisons) {
      try {
        const result = await this.compareImages(
          comparison.baselineImagePath,
          comparison.currentImagePath,
          { threshold: comparison.threshold }
        )
        results.push(result)
      } catch (error) {
        console.error('Batch comparison failed for:', comparison, error)
        results.push({
          difference: 1,
          diffPixels: 0,
          totalPixels: 0,
          diffImagePath: null,
          passed: false,
          metadata: {
            error: error instanceof Error ? error.message : String(error)
          }
        })
      }
    }

    return results
  }

  // 清理旧的差异图像
  async cleanupOldDiffs(daysToKeep: number = 7) {
    const { readdir, stat, unlink } = await import('fs/promises')
    
    try {
      const files = await readdir(this.diffDir)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      let deletedCount = 0

      for (const file of files) {
        const filePath = path.join(this.diffDir, file)
        const stats = await stat(filePath)

        if (stats.mtime < cutoffDate) {
          await unlink(filePath)
          deletedCount++
        }
      }

      return deletedCount
    } catch (error) {
      console.error('Failed to cleanup old diff images:', error)
      return 0
    }
  }

  // 生成比较报告
  generateComparisonReport(results: ComparisonResult[]): {
    totalComparisons: number
    passedComparisons: number
    failedComparisons: number
    averageDifference: number
    maxDifference: number
    minDifference: number
  } {
    const totalComparisons = results.length
    const passedComparisons = results.filter(r => r.passed).length
    const failedComparisons = totalComparisons - passedComparisons

    const differences = results.map(r => r.difference)
    const averageDifference = differences.reduce((sum, diff) => sum + diff, 0) / totalComparisons
    const maxDifference = Math.max(...differences)
    const minDifference = Math.min(...differences)

    return {
      totalComparisons,
      passedComparisons,
      failedComparisons,
      averageDifference,
      maxDifference,
      minDifference
    }
  }
}