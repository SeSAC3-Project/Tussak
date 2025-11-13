#!/bin/bash

###############################################
# Tussak 서버 자동 배포 스크립트
###############################################

PROJECT_DIR="/home/tussak/Tussak/server"
VENV_PATH="$PROJECT_DIR/venv"
LOG_FILE="$PROJECT_DIR/logs/deploy.log"
SERVICE_NAME="tussak-app"

# 로그 디렉토리 생성
mkdir -p "$PROJECT_DIR/logs"

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 시작
log "========================================"
log "🚀 Tussak 서버 배포 시작"

# 프로젝트 디렉토리로 이동
cd "$PROJECT_DIR" || {
    log "❌ 프로젝트 디렉토리로 이동 실패"
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

# 서비스 재시작
log "🔄 서비스 재시작 중..."
sudo systemctl restart "$SERVICE_NAME"

# 재시작 대기
log "⏳ 서비스 시작 대기 중..."
sleep 3

# 서비스 상태 확인
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    log "✅ 서비스가 정상적으로 실행 중입니다"
    
    # 서비스 상태 출력
    log ""
    log "=== 서비스 상태 ==="
    sudo systemctl status "$SERVICE_NAME" --no-pager -l | tee -a "$LOG_FILE"
    
    # gunicorn 프로세스 확인
    log ""
    log "=== Gunicorn 프로세스 ==="
    ps aux | grep gunicorn | grep -v grep | tee -a "$LOG_FILE"
    
    log ""
    log "✅ 배포 성공!"
    log "========================================"
    exit 0
else
    log "❌ 서비스 시작 실패"
    
    # 에러 로그 출력
    log ""
    log "=== 에러 로그 (최근 30줄) ==="
    sudo journalctl -u "$SERVICE_NAME" -n 30 --no-pager | tee -a "$LOG_FILE"
    
    log ""
    log "❌ 배포 실패!"
    log "========================================"
    exit 1
fi
