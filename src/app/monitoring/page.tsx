'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlayIcon, 
  PauseIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { Schedule, Execution, TaskGroup } from '@/types'

export default function MonitoringPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
    fetchRecentExecutions()
    
    // 每30秒刷新一次数据
    const interval = setInterval(() => {
      fetchSchedules()
      fetchRecentExecutions()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentExecutions = async () => {
    try {
      const response = await fetch('/api/schedules/executions?limit=20')
      if (response.ok) {
        const data = await response.json()
        setExecutions(data)
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error)
    }
  }

  const toggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      })
      if (response.ok) {
        fetchSchedules()
      } else {
        alert('操作失败，请重试')
      }
    } catch (error) {
      console.error('Failed to toggle schedule:', error)
      alert('操作失败，请重试')
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

  const formatCron = (cron: string) => {
    // 简单的cron表达式解析，实际项目中可以使用专门的库
    const parts = cron.split(' ')
    if (parts.length >= 5) {
      const [minute, hour, day, month, weekday] = parts
      if (minute === '0' && hour !== '*') {
        return `每天 ${hour}:00`
      }
      if (minute !== '*' && hour !== '*') {
        return `每天 ${hour}:${minute.padStart(2, '0')}`
      }
      if (minute !== '*' && hour === '*') {
        return `每小时第 ${minute} 分钟`
      }
    }
    return cron
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
              <Link href="/monitoring" className="text-primary-600 font-medium">
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
          {/* 页面标题 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">巡检监控</h1>
            <p className="mt-2 text-gray-600">管理定时任务和查看执行状态</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 定时任务列表 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">定时任务</h3>
                <Link
                  href="/schedules/new"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  新建定时任务
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {schedules.length > 0 ? (
                  schedules.map((schedule) => (
                    <div key={schedule.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {schedule.taskGroup?.name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatCron(schedule.cronExpression)}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                            <span>状态: {schedule.enabled ? '启用' : '禁用'}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            schedule.enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {schedule.enabled ? '启用' : '禁用'}
                          </span>
                          <button
                            onClick={() => toggleSchedule(schedule.id, !schedule.enabled)}
                            className={`inline-flex items-center p-1 border border-transparent rounded text-sm ${
                              schedule.enabled
                                ? 'text-red-600 hover:text-red-800'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {schedule.enabled ? (
                              <PauseIcon className="h-4 w-4" />
                            ) : (
                              <PlayIcon className="h-4 w-4" />
                            )}
                          </button>
                          <Link
                            href={`/schedules/${schedule.id}/edit`}
                            className="inline-flex items-center p-1 border border-transparent rounded text-sm text-gray-600 hover:text-gray-800"
                          >
                            <Cog6ToothIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">暂无定时任务</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      创建定时任务来自动执行快照比对
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/schedules/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                      >
                        <ClockIcon className="h-4 w-4 mr-2" />
                        新建定时任务
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 最近执行记录 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">最近执行记录</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {executions.length > 0 ? (
                  executions.map((execution) => (
                    <div key={execution.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(execution.status)}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {execution.taskGroup?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(execution.startedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            execution.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : execution.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {getStatusText(execution.status)}
                          </span>
                          {execution.id && execution.status === 'completed' && (
                            <Link
                              href={`/executions/${execution.id}`}
                              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              查看
                            </Link>
                          )}
                        </div>
                      </div>
                      {execution.completedAt && (
                        <div className="mt-1 text-xs text-gray-500">
                          耗时: {Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}秒
                        </div>
                      )}
                      {execution.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs text-red-700">{execution.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500">暂无执行记录</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}