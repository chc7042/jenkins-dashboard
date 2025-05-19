import { NextResponse } from "next/server"
import { mockBuildParameters } from "../mock-data"

export async function GET(request: Request) {
  try {
    // URL에서 작업 이름 가져오기
    const url = new URL(request.url)
    const jobName = url.searchParams.get("job")

    // 테스트 모드 확인
    const isTestMode = process.env.JENKINS_TEST_MODE === "true" || url.searchParams.get("test") === "true"

    // 작업 이름이 없는 경우
    if (!jobName) {
      return NextResponse.json({ error: "작업 이름이 필요합니다" }, { status: 400 })
    }

    // 테스트 모드인 경우 모의 파라미터 반환
    if (isTestMode) {
      const parameters = mockBuildParameters[jobName as keyof typeof mockBuildParameters] || []
      return NextResponse.json({ parameters })
    }

    // 실제 모드인 경우 Jenkins API에서 파라미터 가져오기
    // 환경 변수 확인
    const jenkinsUrl = process.env.JENKINS_URL?.trim()
    const username = process.env.JENKINS_USERNAME?.trim()
    const apiToken = process.env.JENKINS_API_TOKEN?.trim()

    if (!jenkinsUrl || !username || !apiToken) {
      return NextResponse.json(
        { error: "Jenkins 자격 증명이 구성되지 않았습니다", testMode: true, parameters: [] },
        { status: 200 },
      )
    }

    // 여기에 실제 Jenkins API 호출 코드 추가
    // 사내 시스템이므로 실제로는 실행되지 않음

    return NextResponse.json({ error: "사내 Jenkins 시스템에 접근할 수 없습니다", testMode: true, parameters: [] })
  } catch (error) {
    console.error("빌드 파라미터 가져오기 오류:", error)
    return NextResponse.json(
      {
        error: "빌드 파라미터를 가져오는 중 오류가 발생했습니다",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    // 테스트 모드 확인
    const url = new URL(request.url)
    const isTestMode = process.env.JENKINS_TEST_MODE === "true" || url.searchParams.get("test") === "true"

    // 요청 본문에서 작업 URL 및 파라미터 가져오기
    const { jobUrl, jobName, parameters } = await request.json()

    // 테스트 모드인 경우 모의 응답 반환
    if (isTestMode) {
      console.log("테스트 모드로 실행 중: 빌드 트리거 시뮬레이션")
      console.log("작업 이름:", jobName)
      console.log("작업 URL:", jobUrl)
      console.log("파라미터:", parameters)

      // 2초 지연 후 응답 (비동기 작업 시뮬레이션)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      return NextResponse.json({
        success: true,
        message: "빌드가 성공적으로 트리거되었습니다 (테스트 모드)",
        jobName,
        jobUrl,
        parameters,
        queuedAt: new Date().toISOString(),
      })
    }

    // 환경 변수 확인
    const username = process.env.JENKINS_USERNAME?.trim()
    const apiToken = process.env.JENKINS_API_TOKEN?.trim()

    if (!username || !apiToken) {
      return NextResponse.json({ error: "Jenkins 자격 증명이 구성되지 않았습니다" }, { status: 500 })
    }

    // Basic 인증을 위한 헤더 생성
    const authHeader = "Basic " + Buffer.from(`${username}:${apiToken}`).toString("base64")

    // 빌드 URL 구성
    let buildUrl = jobUrl
    if (!buildUrl.endsWith("/")) {
      buildUrl += "/"
    }

    // 파라미터가 있는 경우 buildWithParameters 엔드포인트 사용, 없는 경우 build 엔드포인트 사용
    const endpoint = Object.keys(parameters || {}).length > 0 ? "buildWithParameters" : "build"
    buildUrl += endpoint

    // URL 검증
    if (!buildUrl.startsWith("http://") && !buildUrl.startsWith("https://")) {
      return NextResponse.json({ error: "유효하지 않은 작업 URL입니다" }, { status: 400 })
    }

    console.log(`빌드 트리거: ${buildUrl}`)

    // 파라미터가 있는 경우 FormData 생성
    const formData = new FormData()
    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    // Jenkins API 호출
    const response = await fetch(buildUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: Object.keys(parameters || {}).length > 0 ? formData : null,
    })

    if (!response.ok) {
      let errorMessage = `Jenkins API 응답 오류: ${response.status} ${response.statusText}`

      try {
        const text = await response.text()
        console.error("Error response:", text)
        errorMessage += ` - ${text.substring(0, 100)}`
      } catch (e) {
        console.error("Error parsing error response:", e)
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: "빌드가 성공적으로 트리거되었습니다",
      jobUrl,
      queuedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("빌드 트리거 오류:", error)
    return NextResponse.json(
      { error: "빌드 트리거 중 오류가 발생했습니다", message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
