'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  PlayIcon, 
  PencilIcon, 
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { TaskGroup, Execution } from '@/types'

export default function TaskGroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [taskGroup, setTaskGroup] = useState<TaskGroup | null>(null)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    fetchTaskGroup()
    fetchExecutions()
  }, [params.id])

  const fetchTaskGroup = async () => {
    try {
      const response = await fetch(`/api/task-groups/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTaskGroup(data)
      }
    } catch (error) {
      console.error('Failed to fetch task group:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutions = async () => {
    try {
      const response = await fetch(`/api/task-groups/${params.id}/executions`)
      if (response.ok) {
        const data = await response.json()
        setExecutions(data.executions)
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error)
    }
  }

  const handleExecute = async () => {
    setExecuting(true)
    try {
      const response = await fetch(`/api/task-groups/${params.id}/execute`, {
        method: 'POST'
      })
      if (response.ok) {
        const json = await response.json()
        alert(`已开始执行，执行ID：${json.executionId}`)
        // 刷新执行历史
        fetchExecutions()
      } else {
        alert('执行失败，请重试')
      }
    } catch (error) {
      console.error('Failed to execute task group:', error)
      alert('执行失败，请重试')
    } finally {
      setExecuting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个任务组吗？此操作不可恢复。')) {
      return
    }

    try {
      const response = await fetch(`/api/task-groups/${params.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        router.push('/task-groups')
      } else {
        alert('删除失败，请重试')
      }
    } catch (error) {
      console.error('Failed to delete task group:', error)
      alert('删除失败，请重试')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'failed':
        return '失败'
      case 'running':
        return '运行中'
      default:
        return '未知'
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

  if (!taskGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">任务组不存在</h2>
          <p className="mt-2 text-gray-600">请检查URL是否正确</p>
          <Link
            href="/task-groups"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            返回任务组列表
          </Link>
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
          {/* 返回按钮和标题 */}
          <div className="mb-6">
            <Link
              href="/task-groups"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              返回任务组列表
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{taskGroup.name}</h1>
                <p className="mt-2 text-gray-600">{taskGroup.description}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  {executing ? '执行中...' : '立即执行'}
                </button>
                <Link
                  href={`/task-groups/${params.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  编辑
                </Link>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  删除
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 任务组信息 */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">任务组信息</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">默认阈值</dt>
                    <dd className="text-sm text-gray-900">{(taskGroup.defaultThreshold * 100).toFixed(1)}%</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">URL数量</dt>
                    <dd className="text-sm text-gray-900">{taskGroup.urls?.length || 0} 个</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(taskGroup.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">更新时间</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(taskGroup.updatedAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* URL列表 */}
              <div className="bg-white shadow rounded-lg p-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">监控URL</h3>
                <div className="space-y-3">
                  {taskGroup.urls?.map((url, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{url.name}</h4>
                          <p className="text-xs text-gray-500 mt-1 break-all">{url.url}</p>
                          {url.threshold !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              阈值: {(url.threshold * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">暂无URL配置</p>
                  )}
                </div>
              </div>
            </div>

            {/* 执行历史 */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">执行历史</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {executions.length > 0 ? (
                    executions.map((execution) => (
                      <div key={execution.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getStatusIcon(execution.status)}
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {getStatusText(execution.status)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(execution.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {execution.status === 'completed' && (
                              <Link
                                href={`/executions/${execution.id}`}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <EyeIcon className="h-3 w-3 mr-1" />
                                查看结果
                              </Link>
                            )}
                          </div>
                        </div>
                        {execution.completedAt && (
                          <div className="mt-2 text-sm text-gray-500">
                            耗时: {Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}秒
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm text-gray-500">暂无执行记录</p>
                      <button
                        onClick={handleExecute}
                        disabled={executing}
                        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                      >
                        <PlayIcon className="h-4 w-4 mr-2" />
                        开始第一次执行
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}