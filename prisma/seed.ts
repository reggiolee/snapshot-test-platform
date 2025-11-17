import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始数据库种子...')

  // 创建通知设置
  const notificationSettings = await prisma.notificationSettings.create({
    data: {
      enabled: true,
      emailHost: 'smtp.example.com',
      emailPort: 587,
      emailUser: 'test@example.com',
      emailPassword: 'password',
      emailFrom: 'test@example.com',
      emailTo: 'admin@example.com',
      webhookUrl: 'https://hooks.slack.com/services/example',
      notifyOnFailure: true,
      notifyOnSuccess: false,
    },
  })

  // 创建任务组
  const taskGroup1 = await prisma.taskGroup.create({
    data: {
      name: '主要网站监控',
      description: '监控主要网站的视觉变化',
      defaultThreshold: 0.05,
      defaultConfig: JSON.stringify({
        viewport: { width: 1920, height: 1080 },
        fullPage: true,
        waitTime: 2000
      }),
    },
  })

  const taskGroup2 = await prisma.taskGroup.create({
    data: {
      name: '移动端监控',
      description: '监控移动端页面的视觉变化',
      defaultThreshold: 0.1,
      defaultConfig: JSON.stringify({
        viewport: { width: 375, height: 667 },
        fullPage: true,
        waitTime: 3000
      }),
    },
  })

  // 创建URL
  const urls = await Promise.all([
    prisma.url.create({
      data: {
        taskGroupId: taskGroup1.id,
        url: 'https://example.com',
        name: '示例网站首页',
        threshold: 0.05,
        viewportConfig: JSON.stringify({ width: 1920, height: 1080 }),
        isActive: true,
      },
    }),
    prisma.url.create({
      data: {
        taskGroupId: taskGroup1.id,
        url: 'https://example.com/about',
        name: '示例网站关于页',
        threshold: 0.03,
        viewportConfig: JSON.stringify({ width: 1920, height: 1080 }),
        isActive: true,
      },
    }),
    prisma.url.create({
      data: {
        taskGroupId: taskGroup2.id,
        url: 'https://m.example.com',
        name: '移动端首页',
        threshold: 0.1,
        viewportConfig: JSON.stringify({ width: 375, height: 667 }),
        isActive: true,
      },
    }),
  ])

  // 创建定时任务
  const schedules = await Promise.all([
    prisma.schedule.create({
      data: {
        taskGroupId: taskGroup1.id,
        enabled: true,
        cronExpression: '0 */6 * * *', // 每6小时执行一次
        timezone: 'Asia/Shanghai',
        retryCount: 3,
        nextExecution: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6小时后
      },
    }),
    prisma.schedule.create({
      data: {
        taskGroupId: taskGroup2.id,
        enabled: true,
        cronExpression: '0 0 * * *', // 每天执行一次
        timezone: 'Asia/Shanghai',
        retryCount: 2,
        nextExecution: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
      },
    }),
  ])

  console.log('数据库种子完成!')
  console.log(`创建了 ${urls.length} 个URL`)
  console.log(`创建了 ${schedules.length} 个定时任务`)
  console.log('创建了通知设置')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })