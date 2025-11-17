'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { TaskGroup } from '@/types'

interface UrlConfig {
  id?: string
  url: string
  name: string
  threshold?: number
  preScript?: string
}

export default function EditTaskGroupPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultThreshold: 0.1
  })
  const [urls, setUrls] = useState<UrlConfig[]>([])

  useEffect(() => {
    fetchTaskGroup()
  }, [params.id])

  const fetchTaskGroup = async () => {
    try {
      const response = await fetch(`/api/task-groups/${params.id}`)
      if (response.ok) {
        const taskGroup: TaskGroup = await response.json()
        setFormData({
          name: taskGroup.name,
          description: taskGroup.description || '',
          defaultThreshold: taskGroup.defaultThreshold
        })
        setUrls(taskGroup.urls?.map(url => ({
          id: url.id,
          url: url.url,
          name: url.name,
          threshold: url.threshold,
          preScript: url.preScript || ''
        })) || [{ url: '', name: '', threshold: undefined, preScript: '' }])
      } else {
        alert('任务组不存在')
        router.push('/task-groups')
      }
    } catch (error) {
      console.error('Failed to fetch task group:', error)
      alert('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/task-groups/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          urls: urls.filter(url => url.url && url.name)
        })
      })

      if (response.ok) {
        router.push(`/task-groups/${params.id}`)
      } else {
        alert('保存失败，请重试')
      }
    } catch (error) {
      console.error('Failed to update task group:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const addUrl = () => {
    setUrls([...urls, { url: '', name: '', threshold: undefined, preScript: '' }])
  }

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index))
  }

  const updateUrl = (index: number, field: keyof UrlConfig, value: string | number | undefined) => {
    const newUrls = [...urls]
    newUrls[index] = { ...newUrls[index], [field]: value }
    setUrls(newUrls)
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
              <Link href="/task-groups" className="text-primary-600 font-medium">
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
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 返回按钮和标题 */}
          <div className="mb-6">
            <Link
              href={`/task-groups/${params.id}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              返回任务组详情
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">编辑任务组</h1>
            <p className="mt-2 text-gray-600">修改任务组的配置和监控URL</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">基本信息</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    设置任务组的名称、描述和默认配置
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        任务组名称 *
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="例如：首页测试"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        描述
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="描述这个任务组的用途..."
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="defaultThreshold" className="block text-sm font-medium text-gray-700">
                        默认阈值 (%)
                      </label>
                      <input
                        type="number"
                        name="defaultThreshold"
                        id="defaultThreshold"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.defaultThreshold * 100}
                        onChange={(e) => setFormData({ ...formData, defaultThreshold: parseFloat(e.target.value) / 100 })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        当URL未设置单独阈值时使用此默认值
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* URL配置 */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">URL配置</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    添加需要监控的URL，可以为每个URL单独设置阈值
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-4">
                    {urls.map((url, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-sm font-medium text-gray-900">URL #{index + 1}</h4>
                          {urls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeUrl(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-6 gap-4">
                          <div className="col-span-6">
                            <label className="block text-sm font-medium text-gray-700">
                              URL地址 *
                            </label>
                            <input
                              type="url"
                              required
                              value={url.url}
                              onChange={(e) => updateUrl(index, 'url', e.target.value)}
                              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              placeholder="https://example.com"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-4">
                            <label className="block text-sm font-medium text-gray-700">
                              显示名称 *
                            </label>
                            <input
                              type="text"
                              required
                              value={url.name}
                              onChange={(e) => updateUrl(index, 'name', e.target.value)}
                              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              placeholder="首页"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              阈值 (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={url.threshold !== undefined ? url.threshold * 100 : ''}
                              onChange={(e) => updateUrl(index, 'threshold', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              placeholder="使用默认"
                            />
                          </div>

                          <div className="col-span-6">
                            <label className="block text-sm font-medium text-gray-700">
                              前置脚本
                            </label>
                            <textarea
                              rows={2}
                              value={url.preScript}
                              onChange={(e) => updateUrl(index, 'preScript', e.target.value)}
                              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              placeholder="await page.setViewport({width: 1920, height: 1080});"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                              在截图前执行的JavaScript代码
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addUrl}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      添加URL
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-3">
              <Link
                href={`/task-groups/${params.id}`}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存更改'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}