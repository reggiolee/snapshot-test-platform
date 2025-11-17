'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline'
import { Execution, Result } from '@/types'

export default function ExecutionDetailPage() {
  const params = useParams()
  const [execution, setExecution] = useState<Execution | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchExecution()
    fetchResults()
  }, [params.id])

  const fetchExecution = async () => {
    try {
      const response = await fetch(`/api/executions/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setExecution(data)
      }
    } catch (error) {
      console.error('Failed to fetch execution:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/executions/${params.id}/results`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Failed to fetch results:', error)
    }
  }

  const openModal = (result: Result) => {
    setSelectedResult(result)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedResult(null)
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

  if (!execution) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">执行记录不存在</h2>
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

  const passedCount = results.filter(r => r.status === 'passed').length
  const failedCount = results.filter(r => r.status === 'failed' || r.status === 'error').length

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
              href={`/task-groups/${execution.taskGroupId}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              返回任务组详情
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">执行结果详情</h1>
            <p className="mt-2 text-gray-600">
              执行时间: {new Date(execution.createdAt).toLocaleString()}
            </p>
          </div>

          {/* 执行概览 */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                <div className="text-sm text-gray-500">总URL数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{passedCount}</div>
                <div className="text-sm text-gray-500">通过</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                <div className="text-sm text-gray-500">失败</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {execution.completedAt && execution.startedAt
                    ? Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)
                    : '-'}s
                </div>
                <div className="text-sm text-gray-500">总耗时</div>
              </div>
            </div>
          </div>

          {/* 结果列表 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">比对结果</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {results.map((result) => (
                <div key={result.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {result.status === 'passed' ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1" />
                      ) : (
                        <XCircleIcon className="h-6 w-6 text-red-500 mt-1" />
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{result.url?.name}</h4>
                        <p className="text-sm text-gray-500 break-all">{result.url?.url}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>相似度: {(result.similarity * 100).toFixed(2)}%</span>
                          <span>阈值: {(result.thresholdUsed * 100).toFixed(1)}%</span>
                          <span>状态: {result.status === 'passed' ? '通过' : result.status === 'failed' ? '失败' : '错误'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openModal(result)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      查看截图
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 截图查看模态框 */}
      {showModal && selectedResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedResult.url?.name} - 截图对比
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">关闭</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 基准截图 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">基准截图</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {selectedResult.baselineScreenshotUrl ? (
                      <Image
                        src={selectedResult.baselineScreenshotUrl}
                        alt="基准截图"
                        width={400}
                        height={300}
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-500">无基准截图</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 当前截图 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">当前截图</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {selectedResult.currentScreenshotUrl ? (
                      <Image
                        src={selectedResult.currentScreenshotUrl}
                        alt="当前截图"
                        width={400}
                        height={300}
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-500">无当前截图</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 差异图 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">差异对比</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {selectedResult.diffImageUrl ? (
                      <Image
                        src={selectedResult.diffImageUrl}
                        alt="差异对比"
                        width={400}
                        height={300}
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-500">无差异图</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}