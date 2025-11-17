'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Cog6ToothIcon,
  BellIcon,
  ComputerDesktopIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { NotificationSettings } from '@/types'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    id: '',
    enabled: false,
    emailTo: '',
    emailFrom: '',
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPassword: '',
    webhookUrl: '',
    notifyOnFailure: true,
    notifyOnSuccess: false,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  const [viewportSettings, setViewportSettings] = useState({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // 获取通知设置
      const notificationResponse = await fetch('/api/settings/notifications')
      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json()
        setNotificationSettings(notificationData)
      }

      // 获取视窗设置
      const viewportResponse = await fetch('/api/settings/viewport')
      if (viewportResponse.ok) {
        const viewportData = await viewportResponse.json()
        setViewportSettings(viewportData)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveNotificationSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationSettings)
      })
      if (response.ok) {
        alert('通知设置已保存')
      } else {
        alert('保存失败，请重试')
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const saveViewportSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/viewport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(viewportSettings)
      })
      if (response.ok) {
        alert('视窗设置已保存')
      } else {
        alert('保存失败，请重试')
      }
    } catch (error) {
      console.error('Failed to save viewport settings:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const testNotification = async () => {
    try {
      const response = await fetch('/api/settings/notifications/test', {
        method: 'POST'
      })
      if (response.ok) {
        alert('测试通知已发送')
      } else {
        alert('发送失败，请检查设置')
      }
    } catch (error) {
      console.error('Failed to send test notification:', error)
      alert('发送失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-900">镜准</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/task-groups" className="text-gray-600 hover:text-gray-900">
                任务组管理
              </Link>
              <Link href="/monitoring" className="text-gray-600 hover:text-gray-900">
                巡检监控
              </Link>
              <Link href="/settings" className="text-primary-600 font-medium">
                设置
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 页面标题 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
            <p className="mt-2 text-gray-600">配置系统参数和通知设置</p>
          </div>

          <div className="space-y-6">
            {/* 通知设置 */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <div className="flex items-center">
                    <BellIcon className="h-6 w-6 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium leading-6 text-gray-900">通知设置</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    配置邮件和Webhook通知，在检测到差异时及时收到提醒
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* 邮件通知 */}
                    <div>
                      <div className="flex items-center">
                        <input
                          id="emailEnabled"
                          name="emailEnabled"
                          type="checkbox"
                          checked={notificationSettings.enabled}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            enabled: e.target.checked
                          })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="emailEnabled" className="ml-2 block text-sm text-gray-900">
                          启用邮件通知
                        </label>
                      </div>
                      {notificationSettings.enabled && (
                        <div className="mt-3">
                          <label htmlFor="emailRecipients" className="block text-sm font-medium text-gray-700">
                            收件人邮箱 (多个邮箱用逗号分隔)
                          </label>
                          <input
                            type="text"
                            name="emailRecipients"
                            id="emailRecipients"
                            value={notificationSettings.emailTo || ''}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              emailTo: e.target.value
                            })}
                            className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="admin@example.com, dev@example.com"
                          />
                        </div>
                      )}
                    </div>

                    {/* Webhook通知 */}
                    <div>
                      <div className="flex items-center">
                        <input
                          id="webhookEnabled"
                          name="webhookEnabled"
                          type="checkbox"
                          checked={notificationSettings.notifyOnSuccess}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            notifyOnSuccess: e.target.checked
                          })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="webhookEnabled" className="ml-2 block text-sm text-gray-900">
                          启用Webhook通知
                        </label>
                      </div>
                      {notificationSettings.notifyOnSuccess && (
                        <div className="mt-3">
                          <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
                            Webhook URL
                          </label>
                          <input
                            type="url"
                            name="webhookUrl"
                            id="webhookUrl"
                            value={notificationSettings.webhookUrl || ''}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              webhookUrl: e.target.value
                            })}
                            className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="https://hooks.slack.com/services/..."
                          />
                        </div>
                      )}
                    </div>

                    {/* 通知条件 */}
                    <div>
                      <div className="flex items-center">
                        <input
                          id="onlyOnFailure"
                          name="onlyOnFailure"
                          type="checkbox"
                          checked={notificationSettings.notifyOnFailure}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            notifyOnFailure: e.target.checked
                          })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="onlyOnFailure" className="ml-2 block text-sm text-gray-900">
                          仅在检测到差异时发送通知
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        如果取消勾选，每次执行完成都会发送通知
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={saveNotificationSettings}
                        disabled={saving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {saving ? '保存中...' : '保存通知设置'}
                      </button>
                      <button
                        onClick={testNotification}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        发送测试通知
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 视窗设置 */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <div className="flex items-center">
                    <ComputerDesktopIcon className="h-6 w-6 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium leading-6 text-gray-900">视窗设置</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    配置截图时的浏览器视窗大小和缩放比例
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-2">
                      <label htmlFor="width" className="block text-sm font-medium text-gray-700">
                        宽度 (px)
                      </label>
                      <input
                        type="number"
                        name="width"
                        id="width"
                        min="800"
                        max="3840"
                        value={viewportSettings.width}
                        onChange={(e) => setViewportSettings({
                          ...viewportSettings,
                          width: parseInt(e.target.value)
                        })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                        高度 (px)
                      </label>
                      <input
                        type="number"
                        name="height"
                        id="height"
                        min="600"
                        max="2160"
                        value={viewportSettings.height}
                        onChange={(e) => setViewportSettings({
                          ...viewportSettings,
                          height: parseInt(e.target.value)
                        })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      <label htmlFor="deviceScaleFactor" className="block text-sm font-medium text-gray-700">
                        缩放比例
                      </label>
                      <select
                        id="deviceScaleFactor"
                        name="deviceScaleFactor"
                        value={viewportSettings.deviceScaleFactor}
                        onChange={(e) => setViewportSettings({
                          ...viewportSettings,
                          deviceScaleFactor: parseFloat(e.target.value)
                        })}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value={1}>1x (标准)</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x (高清)</option>
                        <option value={3}>3x</option>
                      </select>
                    </div>

                    <div className="col-span-6">
                      <p className="text-sm text-gray-500">
                        常用分辨率: 1920x1080 (桌面), 1366x768 (笔记本), 1280x720 (小屏幕)
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={saveViewportSettings}
                      disabled={saving}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存视窗设置'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 系统信息 */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-6 w-6 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium leading-6 text-gray-900">系统信息</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    查看系统版本和相关信息
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">平台版本</dt>
                      <dd className="mt-1 text-sm text-gray-900">v1.0.0</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Node.js版本</dt>
                      <dd className="mt-1 text-sm text-gray-900">{process.version}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">数据库</dt>
                      <dd className="mt-1 text-sm text-gray-900">SQLite</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">截图引擎</dt>
                      <dd className="mt-1 text-sm text-gray-900">Puppeteer</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}