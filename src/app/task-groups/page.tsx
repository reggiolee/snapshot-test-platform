'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlusIcon, 
  PlayIcon, 
  PencilIcon, 
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { TaskGroup } from '@/types'

export default function TaskGroupsPage() {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTaskGroups()
  }, [])

  const fetchTaskGroups = async () => {
    try {
      const response = await fetch('/api/task-groups')
      if (response.ok) {
        const data = await response.json()
        setTaskGroups(data)
      }
    } catch (error) {
      console.error('Failed to fetch task groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTaskGroup = async (id: string) => {
    if (!confirm('确定要删除这个任务组吗？')) return
    
    try {
      const response = await fetch(`/api/task-groups/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setTaskGroups(taskGroups.filter(group => group.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete task group:', error)
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 页面标题和操作 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">任务组管理</h1>
              <p className="mt-2 text-gray-600">管理你的测试任务组，配置URL和执行参数</p>
            </div>
            <Link
              href="/task-groups/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              创建任务组
            </Link>
          </div>

          {/* 任务组列表 */}
          {taskGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <ClockIcon className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无任务组</h3>
              <p className="mt-1 text-sm text-gray-500">开始创建你的第一个任务组</p>
              <div className="mt-6">
                <Link
                  href="/task-groups/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  创建任务组
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {taskGroups.map((group) => (
                  <li key={group.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <ClockIcon className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{group.name}</p>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              活跃
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{group.description || '暂无描述'}</p>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span>默认阈值: {(group.defaultThreshold * 100).toFixed(1)}%</span>
                            <span className="mx-2">•</span>
                            <span>URL数量: {group.urls?.length || 0}</span>
                            <span className="mx-2">•</span>
                            <span>创建时间: {new Date(group.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/task-groups/${group.id}`}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            执行
                          </Link>
                          <Link
                            href={`/task-groups/${group.id}`}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            详情
                          </Link>
                          <Link
                            href={`/task-groups/${group.id}/edit`}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                          编辑
                        </Link>
                        <button
                          onClick={() => deleteTaskGroup(group.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          删除
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}