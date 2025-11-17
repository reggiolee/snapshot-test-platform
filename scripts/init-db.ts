import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Initializing database with sample data...')

  try {
    // 创建示例任务组
    const taskGroup1 = await prisma.taskGroup.create({
      data: {
        name: '主页面监控',
        description: '监控网站主要页面的视觉变化',
        defaultThreshold: 0.1,
        urls: {
          create: [
            {
              url: 'https://example.com',
              name: '首页',
              threshold: 0.05
            },
            {
              url: 'https://example.com/about',
              name: '关于我们',
              threshold: 0.1
            },
            {
              url: 'https://example.com/contact',
              name: '联系我们'
            }
          ]
        }
      }
    })

    const taskGroup2 = await prisma.taskGroup.create({
      data: {
        name: '用户界面测试',
        description: '测试用户界面的一致性',
        defaultThreshold: 0.15,
        urls: {
          create: [
            {
              url: 'https://example.com/login',
              name: '登录页面',
              threshold: 0.08
            },
            {
              url: 'https://example.com/dashboard',
              name: '用户仪表板',
              preScript: 'document.querySelector("#demo-mode").click();'
            }
          ]
        }
      }
    })

    // 创建定时任务
    await prisma.schedule.create({
      data: {
        taskGroupId: taskGroup1.id,
        cronExpression: '0 */6 * * *', // 每6小时执行一次
        enabled: true
      }
    })

    await prisma.schedule.create({
      data: {
        taskGroupId: taskGroup2.id,
        cronExpression: '0 9 * * 1-5', // 工作日上午9点执行
        enabled: false
      }
    })

    // 创建默认通知设置
    await prisma.notificationSettings.create({
      data: {
        enabled: false,
        notifyOnFailure: true,
        notifyOnSuccess: false
      }
    })

    console.log('Database initialized successfully!')
    console.log(`Created task groups:`)
    console.log(`- ${taskGroup1.name} (${taskGroup1.id})`)
    console.log(`- ${taskGroup2.name} (${taskGroup2.id})`)
    console.log('Created schedules and notification settings')

  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })