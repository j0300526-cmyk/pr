import React from "react";
import { Mission } from "../types";

interface Props {
  myGroupMissions: Mission[];
  recommendedMissions: Mission[];
  isInMyGroups: (id: number) => boolean;
  joinGroup: (m: Mission) => void;
  setSelectedGroupMission: (m: Mission) => void;
  setLeaveTarget: (m: Mission) => void;
}

export default function GroupManagePage({
  myGroupMissions,
  recommendedMissions,
  isInMyGroups,
  joinGroup,
  setSelectedGroupMission,
  setLeaveTarget
}: Props) {
  return (
    <div className="bg-white px-6 py-4 rounded-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">그룹 미션 관리</h2>
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
    </div>
  );
}