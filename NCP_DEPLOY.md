# NCP 배포 가이드

## 서버 정보
- **공인 IP**: 49.50.136.124
- **서버 이름**: zero-waste-api
- **OS**: Ubuntu 24.04

## 프론트엔드 배포 (http://49.50.136.124/)

### 1. 환경 변수 설정

백엔드는 포트 8000에서 실행 중입니다 (`/var/www/pr/backend`).

**빌드 시 환경 변수로 설정:**
```bash
VITE_API_BASE_URL=http://49.50.136.124:8000/api npm run build
```

또는 프로젝트 루트에 `.env.production` 파일을 생성:
```env
VITE_API_BASE_URL=http://49.50.136.124:8000/api
```

### 2. 빌드

로컬에서 빌드:
```bash
VITE_API_BASE_URL=http://49.50.136.124:8000/api npm run build
```

빌드 결과물은 `dist` 폴더에 생성됩니다.

### 3. 배포

**방법 1: SCP로 업로드**
```bash
# 로컬에서 실행
scp -r dist/* root@49.50.136.124:/var/www/pr/frontend/
```

**방법 2: 서버에서 직접 빌드**
서버에 접속해서:
```bash
cd /var/www/pr
git pull  # 최신 코드 가져오기
VITE_API_BASE_URL=http://49.50.136.124:8000/api npm run build
# 빌드된 dist 폴더를 웹 서버 디렉토리로 복사
sudo cp -r dist/* /var/www/html/  # 또는 nginx 설정에 맞는 경로
```

### 4. 백엔드 CORS 설정 확인

NCP 백엔드의 `.env` 파일에 CORS 설정 추가:

```env
CORS_ORIGINS=http://49.50.136.124,http://localhost:5173
```

또는 서버 환경 변수로 설정

## 백엔드 배포 (NCP - 49.50.136.124)

### 1. 서버 접속
```bash
ssh root@49.50.136.124
# 또는 인증키 사용
ssh -i good2315 root@49.50.136.124
```

### 2. 환경 변수 설정

`backend/.env` 파일 생성:

```env
# 데이터베이스 설정 (PostgreSQL 권장)
DATABASE_URL=postgresql://user:password@localhost:5432/zero_waste_db

# JWT 설정
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS 설정
CORS_ORIGINS=http://49.50.136.124,http://localhost:5173

# 카카오 로그인 설정
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_REDIRECT_URI=http://49.50.136.124/auth/kakao/callback
```

### 3. 백엔드 서버 실행

**방법 1: 직접 실행**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

**방법 2: systemd 서비스로 실행 (현재 설정)**
백엔드는 이미 `/etc/systemd/system/fastapi.service`로 설정되어 있습니다.

서비스 관리:
```bash
sudo systemctl status fastapi      # 상태 확인
sudo systemctl restart fastapi     # 재시작
sudo systemctl stop fastapi        # 중지
sudo systemctl start fastapi       # 시작
```

### 4. nginx 설정 (선택사항 - 리버스 프록시)

`/etc/nginx/sites-available/zero-waste` 파일 생성 (또는 기존 설정 수정):
```nginx
server {
    listen 80;
    server_name 49.50.136.124;

    # 프론트엔드
    location / {
        root /var/www/html;  # 또는 /var/www/pr/frontend/dist
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # 백엔드 API 프록시
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**참고**: nginx를 사용하지 않고 프론트엔드를 직접 포트 80에서 서빙하는 경우, 백엔드 API URL을 `http://49.50.136.124:8000/api`로 빌드해야 합니다.

nginx 활성화:
```bash
sudo ln -s /etc/nginx/sites-available/zero-waste /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 확인 사항

1. 프론트엔드가 `http://49.50.136.124/`에서 접속 가능한지 확인
2. 백엔드 API가 정상 작동하는지 확인
3. CORS 설정이 올바른지 확인
4. 환경 변수 `VITE_API_BASE_URL`이 올바르게 설정되었는지 확인

