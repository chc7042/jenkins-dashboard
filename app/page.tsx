import { JenkinsDashboard } from "@/components/jenkins-dashboard"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Jenkins 대시보드</h1>
          <p className="text-muted-foreground">Jenkins 작업 상태를 실시간으로 모니터링합니다.</p>
        </div>
        <JenkinsDashboard />
      </div>
    </main>
  )
}
