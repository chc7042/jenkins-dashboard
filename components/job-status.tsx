import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, AlertCircle, CheckCircle, Play, Pause, Folder } from "lucide-react"
import type { JenkinsJob } from "@/app/api/jenkins/route"
import { useEffect, useState } from "react";

const normalizeJobData = (job: any): JenkinsJob => {
  console.log("Normalizing job:", job);
  return {
    name: job.name,
    isFolder: job.isFolder || false,
    color: job.color || "unknown",
    lastBuild: job.lastBuild || null,
    jobs: job.jobs ? job.jobs.map(normalizeJobData) : [],
  };
};

const jobs: any[] = []; // Define jobs as an empty array or fetch it from a data source
const normalizedJobs = jobs.map(normalizeJobData);

interface JobStatusProps {
  job: JenkinsJob
}

export function JobStatus({ job }: JobStatusProps) {
  console.log("JobStatus component rendered");
  console.log("Job Data:", job);

  useEffect(() => {
    console.log("Job Data (useEffect):", job);
  }, [job]);

  // Jenkins 색상 코드에 따른 상태 매핑
  const getStatus = (color: string | undefined, isFolder: boolean) => {
    if (isFolder) return { label: "폴더", variant: "outline", icon: Folder }
    if (!color) return { label: "알 수 없음", variant: "secondary", icon: Clock }
    if (color === "blue") return { label: "성공", variant: "success", icon: CheckCircle }
    if (color === "red") return { label: "실패", variant: "destructive", icon: AlertCircle }
    if (color.includes("anime")) return { label: "진행 중", variant: "default", icon: Play }
    if (color === "disabled") return { label: "비활성화", variant: "outline", icon: Pause }
    if (color === "yellow") return { label: "불안정", variant: "warning", icon: AlertCircle }
    return { label: "알 수 없음", variant: "secondary", icon: Clock }
  }

  const status = getStatus(job.color, job.isFolder)
  const Icon = status.icon

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

  if (job.isFolder) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{job.name}</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Folder className="h-3 w-3" />
            <span>폴더</span>
          </Badge>
        </CardHeader>
        <CardContent>
          {job.jobs && job.jobs.length > 0 ? (
            <div className="grid gap-2">
              {job.jobs.map((subJob) => (
                <JobStatus key={subJob.name} job={subJob} />
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">하위 작업 없음</div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 작업인 경우 상태 렌더링
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{job.name}</CardTitle>
        {status && (
          <Badge variant={status.variant} className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            <span>{status.label}</span>
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {job.lastBuild ? (
          <div className="grid gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">빌드 번호:</span>
              <span className="font-medium">#{job.lastBuild.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">마지막 빌드:</span>
              <span className="font-medium">{formatTime(job.lastBuild.timestamp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">소요 시간:</span>
              <span className="font-medium">{formatDuration(job.lastBuild.duration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">결과:</span>
              <span className="font-medium">{job.lastBuild.result || "진행 중"}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">빌드 정보 없음</div>
        )}
      </CardContent>
    </Card>
  );
}

export function JobList() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setJobs(data);
      });
  }, []);

  return (
    <div className="grid gap-4">
      {jobs.length > 0 && jobs.map((job) => <JobStatus key={job.name} job={job} />)}
    </div>
  );
}
