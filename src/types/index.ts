// 截图选项
export interface ScreenshotOptions {
  threshold?: number
  script?: string
}

// 视窗配置
export interface ViewportConfig {
  width: number
  height: number
  deviceScaleFactor: number
}

// 比较结果
export interface ComparisonResult {
  difference: number
  diffPixels: number
  totalPixels: number
  diffImagePath: string | null
  diffPercentage?: number
  passed: boolean
  metadata?: any
}

// 比较选项
export interface ComparisonOptions {
  threshold?: number
  includeAA?: boolean
  alpha?: number
  aaColor?: [number, number, number]
  diffColor?: [number, number, number]
}

// 执行状态
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'error'

// 结果状态
export type ResultStatus = 'passed' | 'failed' | 'error'

// 通知设置
export interface NotificationSettings {
  id: string
  enabled: boolean
  emailHost?: string | null
  emailPort: number
  emailUser?: string | null
  emailPassword?: string | null
  emailFrom?: string | null
  emailTo?: string | null
  webhookUrl?: string | null
  notifyOnFailure: boolean
  notifyOnSuccess: boolean
  createdAt: Date
  updatedAt: Date
}

// 任务组
export interface TaskGroup {
  id: string
  name: string
  description?: string
  isActive: boolean
  defaultThreshold: number
  createdAt: Date
  updatedAt: Date
  urls?: Url[]
}

// URL配置
export interface Url {
  id: string
  taskGroupId: string
  name: string
  url: string
  isActive: boolean
  threshold?: number
  preScript?: string
  viewportConfig: string
  createdAt: Date
  updatedAt: Date
}

// 执行记录
export interface Execution {
  id: string
  taskGroupId: string
  status: ExecutionStatus
  startedAt: Date
  completedAt?: Date
  summary?: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
  taskGroup?: TaskGroup
  results?: Result[]
  schedule?: Schedule
  executionId?: string // 用于兼容性，实际上就是id字段
}

// 结果记录
export interface Result {
  id: string
  executionId: string
  urlId: string
  status: ResultStatus
  similarity: number
  diffPixels: number
  thresholdUsed: number
  thresholdSource: string
  baselineScreenshotUrl?: string
  currentScreenshotUrl?: string
  diffImageUrl?: string
  createdAt: Date
  updatedAt: Date
  url?: Url
}

// 截图记录
export interface Screenshot {
  id: string
  urlId: string
  fileUrl: string
  filePath: string
  isBaseline: boolean
  metadata?: string
  createdAt: Date
  updatedAt: Date
}

// 定时任务
export interface Schedule {
  id: string
  taskGroupId: string
  cronExpression: string
  timezone?: string
  enabled: boolean
  lastExecution?: Date
  nextExecution?: Date
  createdAt: Date
  updatedAt: Date
  taskGroup?: TaskGroup
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分页参数
export interface PaginationParams {
  page?: number
  limit?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}