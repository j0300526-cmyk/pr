# Render 배포 가이드

## 1. Render 계정 생성 및 프로젝트 연결

1. [Render 홈페이지](https://render.com) 접속
2. GitHub 계정으로 회원가입/로그인
3. Dashboard에서 **New +** 버튼 클릭
4. **Blueprint** 선택 (render.yaml 사용)
5. GitHub 저장소 연결 (j0300526-cmyk/pr)
6. 저장소 선택 후 **Connect** 클릭

## 2. 서비스가 자동 생성됨

`render.yaml` 파일이 있으면 Render가 자동으로:
- PostgreSQL 데이터베이스 생성
- FastAPI 웹 서비스 생성
- 환경 변수 설정

## 3. 추가 환경 변수 설정

Render Dashboard에서 `zero-waste-api` 서비스 선택 후 **Environment** 탭에서 추가:

```
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173
KAKAO_CLIENT_ID=(카카오 REST API 키)
KAKAO_REDIRECT_URI=https://your-vercel-app.vercel.app/auth/kakao/callback
```

## 4. 배포 URL 확인

배포가 완료되면:
- 서비스 URL: `https://zero-waste-api.onrender.com`
- API 엔드포인트: `https://zero-waste-api.onrender.com/api`

## 5. Vercel 환경 변수 업데이트

Vercel Dashboard에서 프론트엔드 프로젝트의 환경 변수에 추가:

```
VITE_API_BASE_URL=https://zero-waste-api.onrender.com/api
```

## 주의사항

⚠️ **무료 플랜 제한:**
- 15분 동안 요청이 없으면 서비스가 sleep 상태로 전환됩니다
- 첫 번째 요청 시 cold start로 인해 30초~1분 정도 지연될 수 있습니다
- 데이터베이스는 90일 후 자동 삭제됩니다 (무료 플랜)

## 데이터베이스 초기 데이터 설정

배포 후 초기 데이터를 설정하려면:
1. Render Dashboard에서 서비스 선택
2. **Shell** 탭 클릭
3. 다음 명령어 실행:

```bash
cd backend
python init_data.py
python seed_catalog_simple.py
```

