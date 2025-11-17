// src/pages/Ranking.tsx
import React, { useState } from "react";
import { Trophy, Medal, Award, Crown } from "lucide-react";

interface Props {
  userName: string;
  currentStreak: number;
  totalMissionsCount: number;
}

interface RankingUser {
  id: number;
  name: string;
  score: number;
  streak: number;
  profileColor: string;
}

interface GroupRanking {
  id: number;
  name: string;
  totalScore: number;
  memberCount: number;
  color: string;
}

export default function RankingPage({
  userName,
  currentStreak,
  totalMissionsCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<"personal" | "group">("personal");

  // 목업 개인 랭킹 데이터
  const personalRankings: RankingUser[] = [
    { id: 1, name: "김민수", score: 245, streak: 28, profileColor: "bg-yellow-300" },
    { id: 2, name: "이영희", score: 238, streak: 25, profileColor: "bg-blue-300" },
    { id: 3, name: "박철수", score: 220, streak: 22, profileColor: "bg-green-300" },
    { id: 4, name: userName || "나", score: totalMissionsCount, streak: currentStreak, profileColor: "bg-purple-300" },
    { id: 5, name: "최지은", score: 195, streak: 20, profileColor: "bg-pink-300" },
    { id: 6, name: "정다은", score: 188, streak: 19, profileColor: "bg-red-300" },
    { id: 7, name: "홍길동", score: 175, streak: 17, profileColor: "bg-indigo-300" },
    { id: 8, name: "김영수", score: 162, streak: 15, profileColor: "bg-cyan-300" },
    { id: 9, name: "이미란", score: 150, streak: 14, profileColor: "bg-yellow-400" },
    { id: 10, name: "한지우", score: 142, streak: 12, profileColor: "bg-blue-400" },
  ].sort((a, b) => b.score - a.score);

  // 목업 그룹 랭킹 데이터
  const groupRankings: GroupRanking[] = [
    { id: 1, name: "일회용 컵 사용 안하기", totalScore: 1250, memberCount: 5, color: "bg-blue-300" },
    { id: 2, name: "장바구니 들고 쇼핑하기", totalScore: 980, memberCount: 3, color: "bg-purple-300" },
    { id: 3, name: "대중교통 이용하기", totalScore: 875, memberCount: 4, color: "bg-green-400" },
    { id: 4, name: "플라스틱 프리 챌린지", totalScore: 820, memberCount: 5, color: "bg-purple-400" },
    { id: 5, name: "비닐봉투 거절하기", totalScore: 750, memberCount: 6, color: "bg-pink-400" },
    { id: 6, name: "분리수거 챌린지", totalScore: 680, memberCount: 4, color: "bg-yellow-400" },
    { id: 7, name: "텀블러 사용하기", totalScore: 620, memberCount: 5, color: "bg-cyan-400" },
    { id: 8, name: "에코백 챌린지", totalScore: 580, memberCount: 3, color: "bg-red-400" },
  ].sort((a, b) => b.totalScore - a.totalScore);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={24} />;
    if (rank === 2) return <Trophy className="text-gray-400" size={22} />;
    if (rank === 3) return <Medal className="text-orange-400" size={22} />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300";
    if (rank === 2) return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300";
    if (rank === 3) return "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300";
    return "bg-white border-gray-200";
  };

  const myRank = personalRankings.findIndex(u => u.name === (userName || "나")) + 1;

  return (
    <div className="bg-white px-6 py-6 min-h-screen rounded-3xl">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">리더보드</h2>
        <p className="text-sm text-gray-500">친환경 실천 랭킹을 확인해보세요!</p>
      </div>

      {/* 내 순위 카드 */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-3xl p-5 mb-6 border-2 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-green-300 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {userName ? userName.charAt(0) : "?"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center border-2 border-green-200 shadow-sm">
                <span className="text-xs font-bold text-green-600">#{myRank}</span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{userName || "사용자"}</h3>
              <p className="text-sm text-gray-600">내 순위</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{totalMissionsCount}</div>
            <p className="text-xs text-gray-500">미션 완료</p>
          </div>
        </div>
      </div>

      {/* 탭 버튼 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex-1 py-3 rounded-full text-sm font-medium transition-all ${
            activeTab === "personal"
              ? "bg-green-500 text-white shadow-md"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          개인 랭킹
        </button>
        <button
          onClick={() => setActiveTab("group")}
          className={`flex-1 py-3 rounded-full text-sm font-medium transition-all ${
            activeTab === "group"
              ? "bg-green-500 text-white shadow-md"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          그룹 랭킹
        </button>
      </div>

      {/* 개인 랭킹 */}
      {activeTab === "personal" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">개인별 순위</h3>
            <span className="text-sm text-gray-500">총 {personalRankings.length}명</span>
          </div>

          {personalRankings.map((user, index) => {
            const rank = index + 1;
            const isMe = user.name === (userName || "나");
            
            return (
              <div
                key={user.id}
                className={`rounded-3xl p-4 border-2 transition-all ${
                  isMe
                    ? "bg-gradient-to-r from-green-50 to-white border-green-300 shadow-md"
                    : getRankColor(rank)
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* 순위 표시 */}
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(rank) || (
                        <span className="text-xl font-bold text-gray-400">#{rank}</span>
                      )}
                    </div>

                    {/* 프로필 */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 ${user.profileColor} rounded-full flex items-center justify-center text-white font-bold text-lg`}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                          {user.name}
                          {isMe && (
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                              나
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          연속 {user.streak}일째 달성
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 점수 */}
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-800">{user.score}</div>
                    <p className="text-xs text-gray-500">점수</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 그룹 랭킹 */}
      {activeTab === "group" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">그룹별 순위</h3>
            <span className="text-sm text-gray-500">총 {groupRankings.length}개</span>
          </div>

          {groupRankings.map((group, index) => {
            const rank = index + 1;
            
            return (
              <div
                key={group.id}
                className={`rounded-3xl p-4 border-2 transition-all ${getRankColor(rank)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* 순위 표시 */}
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(rank) || (
                        <span className="text-xl font-bold text-gray-400">#{rank}</span>
                      )}
                    </div>

                    {/* 그룹 정보 */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 ${group.color} rounded-full flex items-center justify-center`}
                      >
                        <Award className="text-white" size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{group.name}</div>
                        <p className="text-xs text-gray-500">
                          {group.memberCount}명 참여중
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 총점 */}
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-800">
                      {group.totalScore}
                    </div>
                    <p className="text-xs text-gray-500">총점</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 하단 여백 (탭바 안 가리게) */}
      <div className="h-20"></div>
    </div>
  );
}
