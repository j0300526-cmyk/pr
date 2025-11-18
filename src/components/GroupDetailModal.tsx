// 그룹 미션 상세 정보와 참여/나가기 동작을 제공하는 모달
import React from "react";
import { Mission } from "../types";

interface Props {
  mission: Mission | null;
  isInMyGroups: (id: number) => boolean;
  onJoin: (m: Mission) => void;
  onLeave: (id: number) => void;
  onClose: () => void;
}

export default function GroupDetailModal({
  mission,
  isInMyGroups,
  onJoin,
  onLeave,
  onClose,
}: Props) {
  if (!mission) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 className="text-xl font-bold mb-2">{mission.name}</h3>
        <p className="text-sm text-gray-500 mb-4">
          참여 인원 ({mission.participants.length}/3명)
        </p>
        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
          {mission.participants.map((participant, index) => {
            const avatarColor = participant.profile_color || mission.color || "bg-gray-300";
            const initials = participant.name ? participant.name.charAt(0) : "?";
            return (
              <div
                key={participant.id ?? `${participant.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-3xl"
              >
                <div
                  className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold`}
                >
                  {initials}
                </div>
                <span className="text-gray-700">{participant.name}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-200 rounded-3xl font-medium text-gray-700">닫기</button>
          {isInMyGroups(mission.id) ? (
            <button
              onClick={() => { onLeave(mission.id); onClose(); }}
              className="flex-1 py-3 bg-red-50 rounded-3xl font-medium text-red-500 border border-red-200"
            >
              나가기
            </button>
          ) : (
            <button
              onClick={() => { onJoin(mission); onClose(); }}
              disabled={mission.participants.length >= 3}
              className={`flex-1 py-3 rounded-3xl font-medium ${
                mission.participants.length >= 3
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-300 text-white"
              }`}
            >
              {mission.participants.length >= 3 ? "인원 마감" : "참여하기"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


