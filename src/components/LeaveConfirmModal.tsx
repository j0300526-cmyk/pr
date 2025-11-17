// 그룹 미션에서 나가기를 확인하는 모달
import React from "react";
import { Mission } from "../types";

interface Props {
  mission: Mission | null;
  onCancel: () => void;
  onConfirm: (id: number) => void;
}

export default function LeaveConfirmModal({ mission, onCancel, onConfirm }: Props) {
  if (!mission) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 className="text-xl font-bold mb-2">그룹 나가기</h3>
        <p className="text-sm text-gray-600 mb-6">"{mission.name}" 그룹에서 나가시겠어요?</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-200 rounded-2xl font-medium text-gray-700">취소</button>
          <button onClick={() => onConfirm(mission.id)} className="flex-1 py-3 bg-red-500 rounded-2xl font-medium text-white">
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}


