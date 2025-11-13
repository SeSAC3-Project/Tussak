#!/bin/bash

###############################################
# Tussak 서버 자동 배포 스크립트
###############################################

PROJECT_DIR="/home/tussak/Tussak/server"
VENV_PATH="$PROJECT_DIR/venv"
LOG_FILE="$PROJECT_DIR/logs/deploy.log"
APP_NAME="app:create_app()"

# 로그 디렉토리 생성
mkdir -p "$PROJECT_DIR/logs"

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 시작
log "========================================"
log "🚀 Tussak 서버 배포 시작"

# 프로젝트 루트로 이동
cd /home/tussak/Tussak || {
    log "❌ 프로젝트 디렉토리로 이동 실패"
    exit 1
}

# Git Pull + Git 강제 동기화 (서버 수정 내용 삭제)
log "📥 최신 코드 가져오기..."
if git fetch origin >> "$LOG_FILE" 2>&1 && git reset --hard origin/main >> "$LOG_FILE" 2>&1; then
    log "✅ 최신 코드 업데이트 완료"
else
    log "⚠️  Git 동기화 중 경고 발생 (계속 진행)"
fi

# 서버 디렉토리로 이동
cd "$PROJECT_DIR" || {
    log "❌ 서버 디렉토리로 이동 실패"
    exit 1
}
log "📂 작업 디렉토리: $(pwd)"

# 가상환경 활성화
log "🔧 가상환경 활성화..."
source "$VENV_PATH/bin/activate" || {
    log "❌ 가상환경 활성화 실패"
    exit 1
}

# Python 버전 확인
log "🐍 Python 버전: $(python --version)"

# 의존성 업데이트
log "📦 의존성 업데이트 중..."
pip install -r requirements.txt >> "$LOG_FILE" 2>&1
if [ $? -eq 0 ]; then
    log "✅ 의존성 업데이트 완료"
else
    log "⚠️  의존성 업데이트 중 경고 발생 (계속 진행)"
fi

# Python 문법 체크
log "🔍 Python 문법 체크..."
python -m py_compile app.py >> "$LOG_FILE" 2>&1
if [ $? -eq 0 ]; then
    log "✅ 문법 체크 통과"
else
    log "❌ 문법 오류 발견"
    exit 1
fi

# 기존 gunicorn 프로세스 찾기
log "🔄 기존 Gunicorn 프로세스 종료 중..."
OLD_PIDS=$(pgrep -f "gunicorn.*tussak")

if [ -n "$OLD_PIDS" ]; then
    log "기존 프로세스 발견 (PIDs: $OLD_PIDS)"
    echo "$OLD_PIDS" | xargs kill -TERM 2>/dev/null
    
    # 프로세스 종료 대기 (최대 10초)
    for i in {1..10}; do
        if ! pgrep -f "gunicorn.*tussak" > /dev/null; then
            log "✅ 프로세스 정상 종료"
            break
        fi
        sleep 1
    done
    
    # 강제 종료 (혹시 아직 살아있다면)
    if pgrep -f "gunicorn.*tussak" > /dev/null; then
        log "⚠️  강제 종료 실행"
        pgrep -f "gunicorn.*tussak" | xargs kill -KILL 2>/dev/null
        sleep 2
    fi
else
    log "실행 중인 프로세스 없음"
fi

# 새 Gunicorn 프로세스 시작
log "🚀 새 Gunicorn 프로세스 시작..."
nohup $VENV_PATH/bin/gunicorn \
    --bind 127.0.0.1:5000 \
    --workers 4 \
    --threads 2 \
    --timeout 60 \
    --access-logfile /var/log/tussak-app-access.log \
    --error-logfile /var/log/tussak-app-error.log \
    "$APP_NAME" \
    >> "$LOG_FILE" 2>&1 &

NEW_PID=$!
log "새 프로세스 시작 (PID: $NEW_PID)"

# 프로세스 시작 대기
log "⏳ 서비스 시작 대기 중..."
sleep 3

# 프로세스 확인
if ps -p $NEW_PID > /dev/null 2>&1; then
    log "✅ 서비스가 정상적으로 실행 중입니다"
    
    log ""
    log "=== Gunicorn 프로세스 ==="
    ps aux | grep gunicorn | grep -v grep | tee -a "$LOG_FILE"
    
    log ""
    log "✅ 배포 성공!"
    log "========================================"
    exit 0
else
    log "❌ 서비스 시작 실패"
    
    log ""
    log "=== 에러 로그 (최근 30줄) ==="
    tail -30 /var/log/tussak-app-error.log 2>/dev/null | tee -a "$LOG_FILE"
    
    log ""
    log "❌ 배포 실패!"
    log "========================================"
    exit 1
fi