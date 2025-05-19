import type { JenkinsJob } from "@/types/jenkins"

// 서버 측 모의 데이터
export const mockJobs: JenkinsJob[] = [
  // 폴더: backend
  {
    name: "backend",
    url: "https://jenkins.roboetech.com/view/projects/job/projects/job/backend/",
    color: "blue",
    isFolder: true,
    expanded: true,
    jobs: [
      {
        name: "api-service",
        url: "https://jenkins.roboetech.com/view/projects/job/projects/job/backend/job/api-service/",
        color: "blue",
        path: ["backend"],
        lastBuild: {
          number: 42,
          timestamp: Date.now() - 7200000, // 2시간 전
          result: "SUCCESS",
          duration: 180000, // 3분
        },
      },
      {
        name: "database-service",
        url: "https://jenkins.roboetech.com/view/projects/job/projects/job/backend/job/database-service/",
        color: "red",
        path: ["backend"],
        lastBuild: {
          number: 28,
          timestamp: Date.now() - 3600000, // 1시간 전
          result: "FAILURE",
          duration: 120000, // 2분
        },
      },
      // 중첩 폴더: backend/microservices
      {
        name: "microservices",
        url: "https://jenkins.roboetech.com/view/projects/job/projects/job/backend/job/microservices/",
        color: "blue",
        isFolder: true,
        expanded: true,
        path: ["backend"],
        jobs: [
          {
            name: "auth-service",
            url: "https://jenkins.roboetech.com/view/projects/job/projects/job/backend/job/microservices/job/auth-service/",
            color: "blue",
            path: ["backend", "microservices"],
            lastBuild: {
              number: 15,
              timestamp: Date.now() - 10800000, // 3시간 전
              result: "SUCCESS",
              duration: 90000, // 1.5분
            },
          },
          {
            name: "notification-service",
            url: "https://jenkins.roboetech.com/view/projects/job/projects/job/backend/job/microservices/job/notification-service/",
            color: "blue_anime", // 빌드 중
            path: ["backend", "microservices"],
            lastBuild: {
              number: 8,
              timestamp: Date.now() - 1800000, // 30분 전
              result: null, // 진행 중
              duration: 0,
            },
          },
        ],
      },
    ],
  },
  // 폴더: frontend
  {
    name: "frontend",
    url: "https://jenkins.roboetech.com/view/projects/job/projects/job/frontend/",
    color: "blue",
    isFolder: true,
    expanded: true,
    jobs: [
      {
        name: "web-app",
        url: "https://jenkins.roboetech.com/view/projects/job/projects/job/frontend/job/web-app/",
        color: "blue",
        path: ["frontend"],
        lastBuild: {
          number: 128,
          timestamp: Date.now() - 360000, // 6분 전
          result: "SUCCESS",
          duration: 120000, // 2분
        },
      },
      {
        name: "mobile-app",
        url: "https://jenkins.roboetech.com/view/projects/job/projects/job/frontend/job/mobile-app/",
        color: "yellow",
        path: ["frontend"],
        lastBuild: {
          number: 56,
          timestamp: Date.now() - 18000000, // 5시간 전
          result: "UNSTABLE",
          duration: 150000, // 2.5분
        },
      },
    ],
  },
  // 폴더: devops
  {
    name: "devops",
    url: "https://jenkins.roboetech.com/view/projects/job/projects/job/devops/",
    color: "blue",
    isFolder: true,
    expanded: true,
    jobs: [
      {
        name: "infrastructure",
        url: "https://jenkins.roboetech.com/view/projects/job/projects/job/devops/job/infrastructure/",
        color: "blue",
        path: ["devops"],
        lastBuild: {
          number: 23,
          timestamp: Date.now() - 86400000, // 1일 전
          result: "SUCCESS",
          duration: 45000, // 45초
        },
      },
      {
        name: "monitoring",
        url: "https://jenkins.roboetech.com/view/projects/job/projects/job/devops/job/monitoring/",
        color: "disabled",
        path: ["devops"],
        lastBuild: {
          number: 30,
          timestamp: Date.now() - 172800000, // 2일 전
          result: "SUCCESS",
          duration: 180000, // 3분
        },
      },
    ],
  },
  // 최상위 작업 (폴더가 아님)
  {
    name: "nightly-build",
    url: "https://jenkins.roboetech.com/view/projects/job/projects/job/nightly-build/",
    color: "blue",
    lastBuild: {
      number: 67,
      timestamp: Date.now() - 43200000, // 12시간 전
      result: "SUCCESS",
      duration: 300000, // 5분
    },
  },
  {
    name: "security-scan",
    url: "https://jenkins.roboetech.com/view/projects/job/projects/job/security-scan/",
    color: "red",
    lastBuild: {
      number: 18,
      timestamp: Date.now() - 43200000, // 12시간 전
      result: "FAILURE",
      duration: 300000, // 5분
    },
  },
]

export const mockBuildParameters = {
  exampleJob: [{ name: "param1", value: "value1" }],
}

export const mockJobDetails = {
  exampleJob: { name: "exampleJob", description: "An example job" },
}

export const mockBuildHistory = {
  exampleJob: [{ id: 1, status: "SUCCESS" }],
}
