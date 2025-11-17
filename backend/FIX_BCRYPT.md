# bcrypt 문제 해결 방법

터미널에서 다음 명령을 실행하세요:

```bash
cd "C:\Users\j0300\OneDrive\바탕 화면\pr_11_15_VER1\backend"
venv\Scripts\activate

# bcrypt 재설치
pip uninstall bcrypt -y
pip install bcrypt==4.0.1

# 또는 전체 패키지 재설치
pip install -r requirements.txt --upgrade
```

그 다음 다시 시도:

```bash
python init_data.py
```

