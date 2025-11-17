'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline'
import type { TaskGroup } from '@/types'

export default function NewSchedulePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([])
  const [formData, setFormData] = useState({
    taskGroupId: '',
    cronExpression: '*/5 * * * *',
    enabled: true
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTaskGroups = async () => {
      try {
        const res = await fetch('/api/task-groups')
        if (res.ok) {
          const data = await res.json()
          setTaskGroups(data)
          if (data.length > 0 && !formData.taskGroupId) {
            setFormData(prev => ({ ...prev, taskGroupId: data[0].id }))
          }
        }
      } catch (e) {
        setError('加载任务组失败')
      }
    }
    fetchTaskGroups()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        router.push('/monitoring')
      } else {
        const msg = await res.text()
        setError(msg || '创建失败')
      }
    } catch (e) {
      setError('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-900">镜准</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/task-groups" className="text-gray-600 hover:text-gray-900">任务组管理</Link>
              <Link href="/monitoring" className="text-primary-600 font-medium">巡检监控</Link>
              <Link href="/settings" className="text-gray-600 hover:text-gray-900">设置</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link href="/monitoring" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              返回监控
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">新建定时任务</h1>
            <p className="mt-2 text-gray-600">选择任务组并设置 Cron 表达式</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700">任务组 *</label>
                  <select
                    required
                    value={formData.taskGroupId}
                    onChange={(e) => setFormData({ ...formData, taskGroupId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    {taskGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label className="block text-sm font-medium text-gray-700">Cron 表达式 *</label>
                  <input
                    type="text"
                    required
                    value={formData.cronExpression}
                    onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="*/5 * * * *"
                  />
                  <p className="mt-1 text-sm text-gray-500">示例：每5分钟执行一次</p>
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">启用</label>
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                      className={`inline-flex items-center px-3 py-2 border rounded-md text-sm ${formData.enabled ? 'text-green-700 border-green-300 bg-green-50' : 'text-gray-700 border-gray-300 bg-gray-50'}`}
                    >
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {formData.enabled ? '启用' : '禁用'}
                    </button>
                  </div>
                </div>
              </div>
              {error && (
                <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Link href="/monitoring" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">取消</Link>
              <button
                type="submit"
                disabled={loading || !formData.taskGroupId}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? '创建中...' : '创建定时任务'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}