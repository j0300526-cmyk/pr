import React from "react";
import { Profile } from "../types";

interface Props {
  friends: Profile[];
  selectedInvitees: number[];
  toggleInvitee: (id: number) => void;
  sendingInvites: boolean;
  sendInvites: () => void;
}

export default function InvitePage({
  friends,
  selectedInvitees,
  toggleInvitee,
  sendingInvites,
  sendInvites
}: Props) {
  return (
    <div className="bg-white px-6 py-4 rounded-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">친구 초대</h2>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">팀원 초대하기</h3>
        <div className="space-y-3">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 rounded-3xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`${f.profileColor || 'bg-gray-300'} w-10 h-10 rounded-full`} />
                <div>
                  <div className="font-bold">{f.name}</div>
                  <div className="text-xs text-gray-500">{f.activeDays}일째 활동중</div>
                </div>
              </div>
              <button
                onClick={() => toggleInvitee(f.id)}
                className={`px-3 py-2 rounded-3xl text-sm border ${selectedInvitees.includes(f.id) ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                {selectedInvitees.includes(f.id) ? '선택됨' : '선택'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={sendInvites}
        disabled={sendingInvites || selectedInvitees.length === 0}
        className={`w-full py-3 rounded-3xl font-medium ${selectedInvitees.length ? 'bg-purple-500 text-white' : 'bg-gray-300 text-white cursor-not-allowed'}`}
      >
        {sendingInvites ? '전송 중...' : '초대 보내기'}
      </button>
    </div>
  );
}
