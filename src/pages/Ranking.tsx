// src/pages/Ranking.tsx
import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { rankingApi } from "../api/ranking";
import type { RankingUser, GroupRanking } from "../api/types";

interface Props {
  userName: string;
  currentStreak: number;
  totalMissionsCount: number;
  userId?: number; // 현재 사용자 ID (선택적)
}

export default function RankingPage({
  userName,
  currentStreak,
  totalMissionsCount,
  userId,
}: Props) {
  const [activeTab, setActiveTab] = useState<"personal" | "group">("personal");
  const [personalRankings, setPersonalRankings] = useState<RankingUser[]>([]);
  const [groupRankings, setGroupRankings] = useState<GroupRanking[]>([]);
  const [myRank, setMyRank] = useState<number>(0);
  const [myScore, setMyScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 랭킹 데이터 로드
  useEffect(() => {
    const loadRankings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 개인 랭킹 로드
        const personalData = await rankingApi.getPersonalRanking();
        setPersonalRankings(personalData);
        
        // 내 순위 및 점수 찾기
        if (userId) {
          const myIndex = personalData.findIndex(u => u.id === userId);
          if (myIndex !== -1) {
            setMyRank(myIndex + 1);
            setMyScore(personalData[myIndex].score);
          }
        } else {
          // userId가 없으면 이름으로 찾기
          const myIndex = personalData.findIndex(u => u.name === userName);
          if (myIndex !== -1) {
            setMyRank(myIndex + 1);
            setMyScore(personalData[myIndex].score);
          }
        }
        
        // 그룹 랭킹 로드
        const groupData = await rankingApi.getGroupRanking();
        setGroupRankings(groupData);
      } catch (err: any) {
        console.error("랭킹 데이터 로드 실패:", err);
        setError("랭킹을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    
    loadRankings();
  }, [userName, userId]);

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
                <span className="text-xs font-bold text-green-600">
                  {myRank > 0 ? `#${myRank}` : "-"}
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{userName || "사용자"}</h3>
              <p className="text-sm text-gray-600">내 순위</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {myScore > 0 ? myScore : totalMissionsCount}
            </div>
            <p className="text-xs text-gray-500">점수</p>
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

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              랭킹을 불러오는 중...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              {error}
            </div>
          ) : personalRankings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              랭킹 데이터가 없습니다.
            </div>
          ) : (
            personalRankings.map((user, index) => {
              const rank = index + 1;
              const isMe = userId ? user.id === userId : user.name === (userName || "나");
            
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
                        className={`w-12 h-12 ${user.profile_color || "bg-gray-300"} rounded-full flex items-center justify-center text-white font-bold text-lg`}
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
            })
          )}
        </div>
      )}

      {/* 그룹 랭킹 */}
      {activeTab === "group" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">그룹별 순위</h3>
            <span className="text-sm text-gray-500">총 {groupRankings.length}개</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              랭킹을 불러오는 중...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              {error}
            </div>
          ) : groupRankings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              그룹 랭킹 데이터가 없습니다.
            </div>
          ) : (
            groupRankings.map((group, index) => {
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
                          {group.member_count || 0}명 참여중
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 총점 */}
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-800">
                      {group.total_score || 0}
                    </div>
                    <p className="text-xs text-gray-500">총점</p>
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
      )}

      {/* 하단 여백 (탭바 안 가리게) */}
      <div className="h-20"></div>
    </div>
  );
}
