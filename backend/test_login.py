# 로그인 테스트 스크립트
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_login():
    """로그인 테스트"""
    print("=" * 50)
    print("로그인 테스트")
    print("=" * 50)
    
    # 테스트 계정
    email = "test@example.com"
    password = "test1234"
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ 로그인 성공!")
            print(f"Access Token: {data.get('access', '')[:50]}...")
            print(f"Refresh Token: {data.get('refresh', '')[:50]}...")
        else:
            print(f"\n❌ 로그인 실패: {response.status_code}")
            try:
                error = response.json()
                print(f"Error Detail: {error.get('detail', 'Unknown error')}")
            except:
                print(f"Error: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    test_login()

