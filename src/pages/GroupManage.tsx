import React from "react";
import { Mission } from "../types";
import { Plus, X } from "lucide-react";

interface Props {
  myGroupMissions: Mission[];
  recommendedMissions: Mission[];
  isInMyGroups: (id: number) => boolean;
  joinGroup: (m: Mission) => void;
  setSelectedGroupMission: (m: Mission) => void;
  setLeaveTarget: (m: Mission) => void;
  onCreateGroup?: (name: string, color: string) => Promise<void>;
}

export default function GroupManagePage({
  myGroupMissions,
  recommendedMissions,
  isInMyGroups,
  joinGroup,
  setSelectedGroupMission,
  setLeaveTarget,
  onCreateGroup
}: Props) {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [groupName, setGroupName] = React.useState("");
  const [selectedColor, setSelectedColor] = React.useState("bg-blue-300");
  const [isCreating, setIsCreating] = React.useState(false);

  const colors = [
    "bg-blue-300",
    "bg-green-300",
    "bg-purple-300",
    "bg-pink-300",
    "bg-yellow-300",
    "bg-orange-300",
  ];

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !onCreateGroup) return;
    
    setIsCreating(true);
    try {
      await onCreateGroup(groupName.trim(), selectedColor);
      setShowCreateModal(false);
      setGroupName("");
      setSelectedColor("bg-blue-300");
    } catch (error) {
      console.error("그룹 생성 실패:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white px-6 py-4 rounded-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">그룹 미션 관리</h2>
        {onCreateGroup && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
          >
            <Plus size={18} />
            그룹 만들기
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">내가 참여중인 그룹 미션</h3>
          <span className="text-sm text-gray-500">{myGroupMissions.length}개</span>
        </div>

        <div className="space-y-3">
          {myGroupMissions.map((mission) => (
            <div key={mission.id} className="bg-gray-50 rounded-3xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${mission.color} rounded-full`} />
                  <div>
                    <h4 className="font-bold text-gray-800">{mission.name}</h4>
                    <p className="text-sm text-gray-500">
                      {mission.participants.length}/3명 참여중
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedGroupMission(mission)}
                  className="flex-1 py-2 bg-white rounded-3xl text-sm text-gray-600 border border-gray-200"
                >
                  참여자 보기
                </button>
                <button
                  onClick={() => setLeaveTarget(mission)}
                  className="flex-1 py-2 bg-red-50 rounded-3xl text-sm text-red-500"
                >
                  나가기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4">추천 그룹 미션</h3>
        <div className="space-y-3">
          {recommendedMissions.map((m) => (
            <div key={m.id} className="bg-gradient-to-r from-gray-50 to-white rounded-3xl p-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 ${m.color} rounded-full`} />
                <div>
                  <h4 className="font-bold text-gray-800">{m.name}</h4>
                  <p className="text-sm text-gray-500">{m.participants.length}/3명 참여중</p>
                </div>
              </div>
              <button
                disabled={isInMyGroups(m.id) || m.participants.length >= 3}
                onClick={() => joinGroup(m)}
                className={`w-full py-2 rounded-3xl text-sm font-medium border ${
                  isInMyGroups(m.id)
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : m.participants.length >= 3
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-green-600 border-gray-200 hover:bg-green-50"
                }`}
              >
                {isInMyGroups(m.id) ? "참여중" : m.participants.length >= 3 ? "인원 마감" : "참여하기"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 그룹 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">새 그룹 만들기</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                그룹 이름
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="예: 텀블러 챌린지"
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500"
                maxLength={30}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                그룹 색상
              </label>
              <div className="flex gap-3 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 ${color} rounded-full border-4 transition-all ${
                      selectedColor === color
                        ? "border-gray-800 scale-110"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-gray-200 rounded-2xl font-medium text-gray-700"
                disabled={isCreating}
              >
                취소
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || isCreating}
                className={`flex-1 py-3 rounded-2xl font-medium text-white ${
                  !groupName.trim() || isCreating
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {isCreating ? "생성 중..." : "만들기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}