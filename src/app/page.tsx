import Link from 'next/link'
import { PlayIcon, CameraIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <CameraIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">镜准</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/task-groups" className="text-gray-600 hover:text-gray-900">
                任务组管理
              </Link>
              <Link href="/monitoring" className="text-gray-600 hover:text-gray-900">
                巡检监控
              </Link>
              <Link href="/settings" className="text-gray-600 hover:text-gray-900">
                设置
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main>
        {/* Hero 区域 */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800">
          <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
                镜准
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-primary-200 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                免费开放的网页视觉回归测试工具，通过截图比对技术帮助开发团队快速发现页面视觉变化
              </p>
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                <div className="rounded-md shadow">
                  <Link
                    href="/task-groups"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    开始使用
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 功能介绍 */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">功能特性</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                强大的视觉回归测试能力
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                提供完整的网页截图比对解决方案，支持任务组管理、定时巡检、阈值配置等功能
              </p>
            </div>

            <div className="mt-10">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <CameraIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">智能截图比对</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    使用 Puppeteer 进行高质量网页截图，支持自定义视口和前置脚本，通过像素级比对检测页面变化
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <PlayIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">定时巡检</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    支持 cron 表达式配置定时任务，自动执行测试并生成报告，及时发现页面异常变化
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <ChartBarIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">灵活阈值配置</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    支持任务组级别和 URL 级别的阈值设置，提供精确的差异检测控制，满足不同场景需求
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* 快速开始 */}
        <div className="bg-gray-50">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              <span className="block">准备开始测试？</span>
              <span className="block text-primary-600">创建你的第一个任务组</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  href="/task-groups"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  创建任务组
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 镜准. 免费开源的视觉回归测试工具.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}