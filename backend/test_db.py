# 데이터베이스 연결 테스트 스크립트
from database import engine, SessionLocal, Base
from models import User, CatalogMission, DayMission, GroupMission
from sqlalchemy import inspect

def test_database_connection():
    """데이터베이스 연결 및 테이블 생성 테스트"""
    print("=" * 50)
    print("데이터베이스 연결 테스트")
    print("=" * 50)
    
    try:
        # 엔진 연결 테스트
        with engine.connect() as conn:
            print("✓ 데이터베이스 연결 성공")
        
        # 테이블 생성
        Base.metadata.create_all(bind=engine)
        print("✓ 테이블 생성 완료")
        
        # 생성된 테이블 확인
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\n생성된 테이블 목록 ({len(tables)}개):")
        for table in tables:
            print(f"  - {table}")
        
        # 세션 테스트
        db = SessionLocal()
        try:
            user_count = db.query(User).count()
            mission_count = db.query(CatalogMission).count()
            print(f"\n현재 데이터:")
            print(f"  - 사용자: {user_count}명")
            print(f"  - 미션 카탈로그: {mission_count}개")
        finally:
            db.close()
        
        print("\n" + "=" * 50)
        print("✓ 모든 테스트 통과!")
        print("=" * 50)
        return True
        
    except Exception as e:
        print(f"\n✗ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_database_connection()

