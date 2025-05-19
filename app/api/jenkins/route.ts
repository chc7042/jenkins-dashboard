import { NextResponse } from "next/server"
import { mockJobs } from "./mock-data"
import type { JenkinsJob } from "@/types/jenkins"

export async function GET(request: Request) {
  console.log("Jenkins API 라우트 호출됨")

  try {
    // URL에서 테스트 모드 파라미터 확인
    const url = new URL(request.url)
    const isTestMode = process.env.JENKINS_TEST_MODE === "true" || url.searchParams.get("test") === "true"
    const forceReal = url.searchParams.get("real") === "true"

    // 테스트 모드인 경우 모의 데이터 반환
    if (isTestMode && !forceReal) {
      console.log("테스트 모드로 실행 중: 모의 데이터 반환")
      return NextResponse.json({
        jobs: mockJobs,
        testMode: true,
      })
    }

    // 환경 변수 확인
    const jenkinsUrl = process.env.JENKINS_URL?.trim()
    const username = process.env.JENKINS_USERNAME?.trim()
    const apiToken = process.env.JENKINS_API_TOKEN?.trim()

    if (!jenkinsUrl || !username || !apiToken) {
      console.log("Jenkins 자격 증명이 구성되지 않음: 모의 데이터로 폴백")
      return NextResponse.json({
        jobs: mockJobs,
        testMode: true,
        error: "Jenkins 자격 증명이 구성되지 않았습니다",
      })
    }

    // Jenkins API URL 구성 (projects 폴더의 내용만 가져오기)
    let apiUrl = jenkinsUrl
    if (!apiUrl.endsWith("/")) {
      apiUrl += "/"
    }
    apiUrl += "job/projects/api/json?tree=jobs[name,url,color,lastBuild[number,timestamp,result,duration],jobs[name,url,color,lastBuild[number,timestamp,result,duration],jobs[name,url,color,lastBuild[number,timestamp,result,duration]]]]"

    console.log(`Jenkins API 호출: ${apiUrl}`)

    // Basic 인증을 위한 헤더 생성
    const authHeader = "Basic " + Buffer.from(`${username}:${apiToken}`).toString("base64")

    // Jenkins API 호출
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 0 }, // 캐시 방지
    })

    if (!response.ok) {
      console.error(`Jenkins API 응답 오류: ${response.status} ${response.statusText}`)
      return NextResponse.json({
        jobs: mockJobs,
        testMode: true,
        error: `Jenkins API 응답 오류: ${response.status} ${response.statusText}`,
      })
    }

    // 응답이 JSON인지 확인
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Jenkins API가 JSON을 반환하지 않음")
      return NextResponse.json({
        jobs: mockJobs,
        testMode: true,
        error: "Jenkins API가 JSON을 반환하지 않았습니다",
      })
    }

    const data = await response.json()
    console.log("Jenkins API 응답 데이터 받음")

    // Jenkins API 응답을 우리의 데이터 모델로 변환
    const jobs = processJenkinsJobs(data.jobs || [], [])

    return NextResponse.json({
      jobs,
      testMode: false,
    })
  } catch (error) {
    console.error("Jenkins API 호출 오류:", error)
    return NextResponse.json({
      jobs: mockJobs,
      testMode: true,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    })
  }
}

// Jenkins API 응답을 우리의 데이터 모델로 변환하는 함수
function processJenkinsJobs(apiJobs: any[], parentPath: string[] = []): JenkinsJob[] {
  return apiJobs.map((job) => {
    // 폴더 여부 확인 (jobs 속성이 있고 비어있지 않은 경우)
    const isFolder = job.jobs && Array.isArray(job.jobs) && job.jobs.length > 0

    // URL에서 job 이름 추출
    const jobName = job.name

    // 기본 작업 정보
    const processedJob: JenkinsJob = {
      name: jobName,
      url: job.url,
      color: job.color || "grey",
      path: parentPath,
    }

    // 마지막 빌드 정보가 있는 경우 추가
    if (job.lastBuild) {
      processedJob.lastBuild = {
        number: job.lastBuild.number,
        timestamp: job.lastBuild.timestamp,
        result: job.lastBuild.result,
        duration: job.lastBuild.duration,
      }
    }

    // 폴더인 경우 하위 작업 처리
    if (isFolder) {
      processedJob.isFolder = true
      processedJob.expanded = true
      processedJob.jobs = processJenkinsJobs(job.jobs, [...parentPath, jobName])
    }

    return processedJob
  })
}
