import { NextResponse } from "next/server"
import { mockJobDetails, mockBuildHistory } from "../mock-data"

export async function GET(request: Request) {
  try {
    // URL에서 작업 이름 가져오기
    const url = new URL(request.url)
    const jobName = url.searchParams.get("name")

    // 테스트 모드 확인
    const isTestMode = process.env.JENKINS_TEST_MODE === "true" || url.searchParams.get("test") === "true"

    // 작업 이름이 없는 경우
    if (!jobName) {
      return NextResponse.json({ error: "작업 이름이 필요합니다" }, { status: 400 })
    }

    // 테스트 모드인 경우 모의 데이터 반환
    if (isTestMode) {
      const details = mockJobDetails[jobName as keyof typeof mockJobDetails]
      const history = mockBuildHistory[jobName as keyof typeof mockBuildHistory]

      if (!details) {
        return NextResponse.json({ error: "작업을 찾을 수 없습니다", testMode: true }, { status: 404 })
      }

      return NextResponse.json({
        name: jobName,
        details,
        history: history || [],
        testMode: true,
      })
    }

    // 실제 모드인 경우 Jenkins API에서 작업 상세 정보 가져오기
    // 환경 변수 확인
    const jenkinsUrl = process.env.JENKINS_URL?.trim()
    const username = process.env.JENKINS_USERNAME?.trim()
    const apiToken = process.env.JENKINS_API_TOKEN?.trim()

    if (!jenkinsUrl || !username || !apiToken) {
      return NextResponse.json({ error: "Jenkins 자격 증명이 구성되지 않았습니다", testMode: true }, { status: 200 })
    }

    // 여기에 실제 Jenkins API 호출 코드 추가
    // 사내 시스템이므로 실제로는 실행되지 않음

    return NextResponse.json({ error: "사내 Jenkins 시스템에 접근할 수 없습니다", testMode: true })
  } catch (error) {
    console.error("작업 상세 정보 가져오기 오류:", error)
    return NextResponse.json(
      {
        error: "작업 상세 정보를 가져오는 중 오류가 발생했습니다",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
