# 베이스 이미지로 Node.js 20 사용
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 패키지 파일 복사
COPY package.json pnpm-lock.yaml ./

# 의존성 설치 (pnpm-lock.yaml 사용)
RUN pnpm install --frozen-lockfile

# 소스 코드 복사
COPY . .

# Next.js 애플리케이션 빌드
RUN pnpm build

# 포트 설정
EXPOSE 3000

# 환경 변수 설정
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# 애플리케이션 실행
CMD ["pnpm", "start"] 