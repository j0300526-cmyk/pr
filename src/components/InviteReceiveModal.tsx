// 그룹 초대 수락/거절을 처리하는 수신 모달
import React from "react";
import { Profile } from "../types";

interface Props {
  profile: Profile | null;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
}

export default function InviteReceiveModal({ profile, onAccept, onDecline }: Props) {
  if (!profile) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className={`${profile.profileColor || 'bg-gray-300'} w-20 h-20 rounded-full mb-3 flex items-center justify-center text-white text-2xl font-bold`}>
            {profile.name.charAt(0)}
          </div>
          <h3 className="text-lg font-bold mb-1">그룹 초대를 받았습니다!</h3>
          <p className="text-sm text-gray-500 mb-4">{profile.name} · {profile.activeDays}일째 활동중</p>
          <div className="flex gap-3 w-full">
            <button onClick={() => onDecline(profile.id)} className="flex-1 py-3 bg-gray-200 rounded-2xl font-medium text-gray-700">거절</button>
            <button onClick={() => onAccept(profile.id)} className="flex-1 py-3 bg-purple-500 rounded-2xl font-medium text-white">수락</button>
          </div>
        </div>
      </div>
    </div>
  );
}


