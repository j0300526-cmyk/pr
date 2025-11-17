import React from "react";
import { Settings, LogOut, Bell, Lock, User, X, ArrowLeft, Camera } from "lucide-react";

interface Props {
  userName: string;
  totalMissionsCount: number;
  currentStreak: number;
  profileColor: string;
  onSaveProfile: (name: string, color: string, bio: string) => void;
  onLogout?: () => void;
}


export default function MyPage({
  userName: initialUserName,
  totalMissionsCount,
  currentStreak,
  profileColor: initialColor,
  onSaveProfile,
  onLogout,
}: Props) {
  const [currentPage, setCurrentPage] = React.useState("mypage");
  const [showSettings, setShowSettings] = React.useState(false);

  // ProfileEdit 상태
  const [userName, setUserName] = React.useState(initialUserName || "사용자");
  const [profileColor, setProfileColor] = React.useState(initialColor || "bg-green-300");
  const [bio, setBio] = React.useState("친환경 실천 중!");
  const [isSaving, setIsSaving] = React.useState(false);

  const colors = [
    "bg-green-300",
    "bg-blue-300",
    "bg-purple-300",
    "bg-pink-300",
    "bg-yellow-300",
    "bg-red-300",
    "bg-indigo-300",
    "bg-cyan-300",
  ];

  const handleLogout = async () => {
    if (window.confirm("정말로 로그아웃하시겠습니까?")) {
      setShowSettings(false);
      try {
        const { authApi } = await import("../api");
        // authApi에 logout이 정의되어 있지 않을 수 있으므로 안전하게 처리
        if ((authApi as any).logout) {
          await (authApi as any).logout();
        } else {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        }
        if (onLogout) {
          onLogout();
        } else {
          window.location.reload();
        }
      } catch (error) {
        // API 오류가 나더라도 로컬 토큰 제거 및 로그아웃 처리
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        if (onLogout) {
          onLogout();
        } else {
          window.location.reload();
        }
      }
    }
  };

  const handleEditProfile = () => {
    setShowSettings(false);
    setCurrentPage("edit");
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSaveProfile(userName, profileColor, bio);
      alert("프로필이 저장되었습니다!");
      setCurrentPage("mypage");
    }, 1000);
  };

  // MyPage 렌더
  if (currentPage === "mypage") {
    return (
      <div className="bg-white px-6 py-4 min-h-screen rounded-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">마이페이지</h2>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <Settings size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div
            className={`w-24 h-24 ${profileColor} rounded-full mb-4 flex items-center justify-center text-white text-3xl font-bold transition-colors duration-300`}
          >
            {userName ? userName.charAt(0) : "?"}
          </div>
          <h3 className="text-xl font-bold mb-2">{userName || "사용자"}</h3>
          <p className="text-gray-500 text-sm">{bio}</p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-3xl p-4">
            <h4 className="font-bold mb-3">내 통계</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">총 미션 수행</span>
                <span className="font-bold text-green-500">{totalMissionsCount}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">연속 달성</span>
                <span className="font-bold text-orange-400">{currentStreak}일</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-3xl p-4">
            <h4 className="font-bold mb-3">내 리워드</h4>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl border border-gray-200 flex items-center justify-center text-sm text-gray-500"
                >
                  배지 {i + 1}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              * 목업 미리보기 — 실제 뱃지는 API 연동 시 교체됩니다
            </p>
          </div>
        </div>

        {/* 설정 모달 */}
        {showSettings && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-end z-50 animate-in fade-in duration-300"
            onClick={() => setShowSettings(false)}
          >
            <div
              className="bg-white w-full rounded-t-3xl p-6 shadow-2xl max-w-md animate-in slide-in-from-bottom duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">설정</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-800">프로필 편집</div>
                    <div className="text-xs text-gray-500">닉네임, 프로필 사진 변경</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Bell size={20} className="text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-800">알림 설정</div>
                    <div className="text-xs text-gray-500">미션 알림, 그룹 초대 알림</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Lock size={20} className="text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-800">개인정보 및 보안</div>
                    <div className="text-xs text-gray-500">비밀번호 변경, 개인정보 관리</div>
                  </div>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-3xl bg-red-50 hover:bg-red-100 transition text-red-600 font-medium"
              >
                <LogOut size={20} />
                로그아웃
              </button>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-3 rounded-3xl bg-gray-100 text-gray-800 font-medium mt-3 hover:bg-gray-200 transition"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ProfileEdit 렌더
  if (currentPage === "edit") {
    return (
      <div className="bg-white min-h-screen rounded-3xl">
        <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-200">
          <button
            onClick={() => setCurrentPage("mypage")}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold">프로필 편집</h2>
        </div>

        <div className="px-6 py-6">
          {/* 프로필 사진 섹션 */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div
                className={`w-32 h-32 ${profileColor} rounded-full flex items-center justify-center text-white text-5xl font-bold transition-colors duration-300`}
              >
                {userName ? userName.charAt(0) : "?"}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition shadow-lg">
                <Camera size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              프로필 사진을 변경하려면 카메라 아이콘을 클릭하세요
            </p>
          </div>

          {/* 색상 선택 */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-3">프로필 색상 선택</h3>
            <div className="grid grid-cols-4 gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setProfileColor(color)}
                  className={`w-12 h-12 ${color} rounded-full transition-all ${
                    profileColor === color
                      ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                      : "hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div className="mb-6">
            <label className="block font-bold text-gray-800 mb-2">닉네임</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value.slice(0, 15))}
              maxLength={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-green-300 transition"
              placeholder="닉네임을 입력하세요"
            />
            <p className="text-xs text-gray-500 mt-1">{userName.length}/15</p>
          </div>

          {/* 소개 입력 */}
          <div className="mb-8">
            <label className="block font-bold text-gray-800 mb-2">소개</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 50))}
              maxLength={50}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-green-300 transition resize-none"
              placeholder="자신을 소개해주세요"
            />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/50</p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentPage("mypage")}
              className="flex-1 py-3 rounded-3xl bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 py-3 rounded-3xl font-medium text-white transition ${
                isSaving
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isSaving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}