"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw, Search, Info, ChevronRight, ChevronDown, Folder, File, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { clientMockJobs } from "./mock-data"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, AlertCircle, CheckCircle, Play, Pause } from "lucide-react"
import type { JenkinsJob } from "../types/jenkins"

export function JenkinsDashboard() {
  const [jobs, setJobs] = useState<JenkinsJob[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JenkinsJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isTestMode, setIsTestMode] = useState(true)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof JenkinsJob | "lastBuildTime" | "lastBuildResult" | "duration"
    direction: "ascending" | "descending"
  } | null>(null)

  // 데이터 로드 함수
  const loadData = async (testMode = true) => {
    setLoading(true)
    setError(null)
    console.log(`${testMode ? "테스트" : "실제"} 모드로 데이터 로드 중...`)

    try {
      if (testMode) {
        // 테스트 모드: 클라이언트 측 모의 데이터 사용
        console.log("테스트 모드로 실행 중: 클라이언트 측 모의 데이터 사용")

        // 로딩 시뮬레이션 (500ms)
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 테스트 모드에 따라 다른 모의 데이터 사용
        const sourceData = clientMockJobs

        // 타임스탬프 업데이트
        const updatedJobs = updateTimestamps(sourceData)

        setJobs(updatedJobs)
        setFilteredJobs(updatedJobs)
        setIsTestMode(true)
        setLastUpdated(new Date())
      } else {
        // 실제 모드: Jenkins API 호출
        console.log("실제 모드로 실행 중: Jenkins API 호출")

        // API 호출
        const response = await fetch("/api/jenkins?real=true", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Jenkins API 호출 실패 (${response.status})`)
        }

        // 응답이 JSON인지 확인
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("API가 JSON을 반환하지 않음:", text.substring(0, 100))
          throw new Error("API가 JSON을 반환하지 않았습니다")
        }

        const data = await response.json()
        console.log("API 응답 데이터 받음")

        // 테스트 모드 확인
        const receivedTestMode = data.testMode === true
        setIsTestMode(receivedTestMode)

        if (data.error) {
          console.warn("API 응답에 오류 포함:", data.error)
          setError(data.error)
        }

        if (!data.jobs || !Array.isArray(data.jobs)) {
          throw new Error("API 응답에 jobs 배열이 없습니다")
        }

        setJobs(data.jobs)
        setFilteredJobs(data.jobs)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error("데이터 로드 오류:", err)

      // 오류 발생 시 테스트 모드로 폴백
      console.log("오류 발생: 테스트 모드로 폴백")

      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      setError(`데이터 로드 실패: ${errorMessage}. 테스트 모드로 폴백합니다.`)

      // 테스트 모드 데이터 로드
      const updatedJobs = updateTimestamps(clientMockJobs)
      setJobs(updatedJobs)
      setFilteredJobs(updatedJobs)
      setIsTestMode(true)
    } finally {
      setLoading(false)
    }
  }

  // 타임스탬프 업데이트 함수 (재귀적으로 모든 작업 처리)
  const updateTimestamps = (jobList: JenkinsJob[]): JenkinsJob[] => {
    return jobList.map((job) => {
      // 현재 작업 업데이트
      let updatedJob = { ...job }

      if (updatedJob.lastBuild) {
        const now = Date.now()
        const hourInMs = 3600000

        // 각 작업마다 다른 시간 간격 설정 (이름 기반)
        const nameHash = updatedJob.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const randomOffset = ((nameHash % 24) + 1) * hourInMs // 1~24시간 사이의 랜덤한 오프셋

        updatedJob = {
          ...updatedJob,
          lastBuild: {
            ...updatedJob.lastBuild,
            timestamp: now - randomOffset,
          },
        }
      }

      // 하위 작업이 있는 경우 재귀적으로 처리
      if (updatedJob.isFolder && updatedJob.jobs && updatedJob.jobs.length > 0) {
        updatedJob = {
          ...updatedJob,
          jobs: updateTimestamps(updatedJob.jobs),
        }
      }

      return updatedJob
    })
  }

  // 폴더 확장/축소 처리
  const toggleFolder = (folderPath: string[]) => {
    const updateFolderState = (jobList: JenkinsJob[], path: string[], depth = 0): JenkinsJob[] => {
      return jobList.map((job) => {
        // 현재 작업이 타겟 폴더인 경우
        if (job.isFolder && depth < path.length && job.name === path[depth]) {
          // 마지막 경로 요소인 경우 확장/축소 상태 토글
          if (depth === path.length - 1) {
            return {
              ...job,
              expanded: !job.expanded,
              // 하위 폴더가 있는 경우 재귀적으로 처리
              jobs: job.jobs ? updateFolderState(job.jobs, path, depth + 1) : [],
            }
          }
          // 중간 경로 요소인 경우 하위 폴더 탐색
          return {
            ...job,
            jobs: job.jobs ? updateFolderState(job.jobs, path, depth + 1) : [],
          }
        }
        return job
      })
    }

    setJobs(updateFolderState([...jobs], folderPath))
    setFilteredJobs(updateFolderState([...filteredJobs], folderPath))
  }

  // 테스트 모드 전환 처리
  const handleTestModeToggle = (enabled: boolean) => {
    setIsTestMode(enabled)
    loadData(enabled)
  }

  // 검색 필터링
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredJobs(jobs)
    } else {
      // 재귀적으로 모든 작업 검색
      const searchInJobs = (jobList: JenkinsJob[]): JenkinsJob[] => {
        const result: JenkinsJob[] = []

        for (const job of jobList) {
          // 현재 작업 이름이 검색어를 포함하는 경우
          if (job.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            // 폴더인 경우 확장 상태로 설정
            if (job.isFolder && job.jobs) {
              result.push({
                ...job,
                expanded: true,
                jobs: searchInJobs(job.jobs),
              })
            } else {
              result.push(job)
            }
          }
          // 폴더이고 하위 작업 중 검색어를 포함하는 경우
          else if (job.isFolder && job.jobs) {
            const matchedChildren = searchInJobs(job.jobs)
            if (matchedChildren.length > 0) {
              result.push({
                ...job,
                expanded: true,
                jobs: matchedChildren,
              })
            }
          }
        }

        return result
      }

      setFilteredJobs(searchInJobs(jobs))
    }
  }, [searchQuery, jobs])

  // 초기 데이터 로드
  useEffect(() => {
    loadData(isTestMode)

    // 30초마다 자동 새로고침
    const interval = setInterval(() => {
      loadData(isTestMode)
    }, 30000)

    return () => clearInterval(interval)
  }, [isTestMode])

  // 마지막 업데이트 시간 포맷팅
  const formatLastUpdated = () => {
    if (!lastUpdated) return "업데이트 정보 없음"
    return `마지막 업데이트: ${lastUpdated.toLocaleTimeString()}`
  }

  // 마지막 빌드 시간 포맷팅
  const formatTime = (timestamp: number) => {
    if (!timestamp) return "정보 없음"
    return new Date(timestamp).toLocaleString()
  }

  // 빌드 소요 시간 포맷팅
  const formatDuration = (duration: number) => {
    if (!duration) return "정보 없음"
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}분 ${remainingSeconds}초`
  }

  // Jenkins 색상 코드에 따른 상태 매핑
  const getStatus = (color: string) => {
    if (color === "blue") return { label: "성공", variant: "success", icon: CheckCircle }
    if (color === "red") return { label: "실패", variant: "destructive", icon: AlertCircle }
    if (color.includes("anime")) return { label: "진행 중", variant: "default", icon: Play }
    if (color === "disabled") return { label: "비활성화", variant: "outline", icon: Pause }
    if (color === "yellow") return { label: "불안정", variant: "warning", icon: AlertCircle }
    return { label: "알 수 없음", variant: "secondary", icon: Clock }
  }

  // 테이블 정렬 처리
  const requestSort = (key: keyof JenkinsJob | "lastBuildTime" | "lastBuildResult" | "duration") => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })

    // 폴더 구조를 유지하면서 각 폴더 내에서 정렬
    const sortJobs = (jobList: JenkinsJob[]): JenkinsJob[] => {
      // 폴더와 일반 작업 분리
      const folders = jobList.filter((job) => job.isFolder)
      const regularJobs = jobList.filter((job) => !job.isFolder)

      // 일반 작업 정렬
      const sortedRegularJobs = [...regularJobs].sort((a, b) => {
        // 특수 키 처리
        if (key === "lastBuildTime") {
          const timeA = a.lastBuild?.timestamp || 0
          const timeB = b.lastBuild?.timestamp || 0
          return direction === "ascending" ? timeA - timeB : timeB - timeA
        }

        if (key === "lastBuildResult") {
          const resultA = a.lastBuild?.result || ""
          const resultB = b.lastBuild?.result || ""
          return direction === "ascending" ? resultA.localeCompare(resultB) : resultB.localeCompare(resultA)
        }

        if (key === "duration") {
          const durationA = a.lastBuild?.duration || 0
          const durationB = b.lastBuild?.duration || 0
          return direction === "ascending" ? durationA - durationB : durationB - durationA
        }

        // 일반 키 처리
        if (key in a && key in b) {
          const valueA = a[key] as string
          const valueB = b[key] as string
          return direction === "ascending" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
        }

        return 0
      })

      // 폴더 내부 작업 정렬
      const sortedFolders = folders.map((folder) => {
        if (folder.jobs) {
          return {
            ...folder,
            jobs: sortJobs(folder.jobs),
          }
        }
        return folder
      })

      // 폴더와 일반 작업 합치기 (폴더 먼저)
      return [...sortedFolders, ...sortedRegularJobs]
    }

    setFilteredJobs(sortJobs([...filteredJobs]))
  }

  // 정렬 방향 표시기
  const getSortDirectionIcon = (key: keyof JenkinsJob | "lastBuildTime" | "lastBuildResult" | "duration") => {
    if (!sortConfig || sortConfig.key !== key) {
      return null
    }

    return sortConfig.direction === "ascending" ? " ↑" : " ↓"
  }

  // 재귀적으로 테이블 행 렌더링
  const renderJobRows = (jobList: JenkinsJob[], level = 0) => {
    const rows: JSX.Element[] = []

    jobList.forEach((job) => {
      const status = getStatus(job.color)
      const StatusIcon = status.icon
      const indent = level * 20 // 들여쓰기 간격 (픽셀)

      // 현재 작업 행 추가
      rows.push(
        <TableRow key={job.url}>
          <TableCell className="font-medium">
            <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
              {job.isFolder ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 mr-1"
                    onClick={() => toggleFolder(job.path ? [...job.path, job.name] : [job.name])}
                  >
                    {job.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                </>
              ) : (
                <div className="ml-6 mr-2">
                  <File className="h-4 w-4 text-gray-500" />
                </div>
              )}
              {job.name}
            </div>
          </TableCell>
          <TableCell>
            {!job.isFolder && (
              <Badge variant={status.variant as any} className="flex items-center gap-1 w-fit">
                <StatusIcon className="h-3 w-3" />
                <span>{status.label}</span>
              </Badge>
            )}
          </TableCell>
          <TableCell>{!job.isFolder && job.lastBuild ? formatTime(job.lastBuild.timestamp) : ""}</TableCell>
          <TableCell>{!job.isFolder && job.lastBuild ? job.lastBuild.result || "진행 중" : ""}</TableCell>
          <TableCell>{!job.isFolder && job.lastBuild ? formatDuration(job.lastBuild.duration) : ""}</TableCell>
          <TableCell className="text-right">
            {!job.isFolder && job.lastBuild ? `#${job.lastBuild.number}` : ""}
          </TableCell>
        </TableRow>,
      )

      // 폴더가 확장된 경우 하위 작업 행 추가
      if (job.isFolder && job.expanded && job.jobs) {
        rows.push(...renderJobRows(job.jobs, level + 1))
      }
    })

    return rows
  }

  return (
    <div className="space-y-4">
      {isTestMode && (
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">테스트 모드 활성화됨</AlertTitle>
          <AlertDescription className="text-blue-700">
            현재 테스트 모드로 실행 중입니다. 실제 Jenkins 데이터가 아닌 샘플 데이터가 표시됩니다.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>오류 발생</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="작업 검색..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="test-mode" checked={isTestMode} onCheckedChange={handleTestModeToggle} />
            <Label htmlFor="test-mode">테스트 모드</Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(isTestMode)}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>새로고침</span>
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex justify-between items-center">
        <span>{formatLastUpdated()}</span>
        {isTestMode && <span className="text-blue-500 font-medium">테스트 모드</span>}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">표시할 Jenkins 작업이 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableCaption>Jenkins 작업 목록</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px] cursor-pointer" onClick={() => requestSort("name")}>
                  작업 이름 {getSortDirectionIcon("name")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("color")}>
                  상태 {getSortDirectionIcon("color")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("lastBuildTime")}>
                  마지막 빌드 {getSortDirectionIcon("lastBuildTime")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("lastBuildResult")}>
                  결과 {getSortDirectionIcon("lastBuildResult")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("duration")}>
                  소요 시간 {getSortDirectionIcon("duration")}
                </TableHead>
                <TableHead className="text-right">빌드 번호</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderJobRows(filteredJobs)}</TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
