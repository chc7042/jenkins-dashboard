export interface JenkinsJob {
  name: string
  url: string
  color: string
  lastBuild?: {
    number: number
    timestamp: number
    result: string | null
    duration: number
  }
  // 폴더 여부
  isFolder?: boolean
  // 폴더 내 작업 목록
  jobs?: JenkinsJob[]
  // 폴더 경로 (상위 폴더들)
  path?: string[]
  // 폴더 확장 여부 (UI 상태)
  expanded?: boolean
}
