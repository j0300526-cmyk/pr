import React from "react";
import type { Profile, Mission } from "../types";

interface Props {
  friends: Profile[];
  selectedInvitees: number[];
  toggleInvitee: (id: number) => void;
  sendingInvites: boolean;
  sendInvites: () => void;
  groups: Mission[];
  selectedGroupId: number | null;
  onSelectGroup: (groupId: number) => void;
  loadingFriends?: boolean;
  onRefreshFriends?: () => void;
}

export default function InvitePage({
  friends,
  selectedInvitees,
  toggleInvitee,
  sendingInvites,
  sendInvites,
  groups,
  selectedGroupId,
  onSelectGroup,
  loadingFriends = false,
  onRefreshFriends,
}: Props) {
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;
  const currentMemberCount = selectedGroup?.participants.length ?? 0;
  const remainingSlots = Math.max(0, 3 - currentMemberCount);
  const maxSelectable = remainingSlots;
  const canInvite = !!selectedGroup && selectedInvitees.length > 0 && selectedInvitees.length <= remainingSlots;

  const handleToggle = (friendId: number) => {
    if (!selectedGroup) return;

    const alreadySelected = selectedInvitees.includes(friendId);
    if (alreadySelected) {
      toggleInvitee(friendId);
      return;
    }

    if (selectedInvitees.length >= maxSelectable) {
      return;
    }
    toggleInvitee(friendId);
  };

  const selectedGroupName = selectedGroup ? selectedGroup.name : "선택된 그룹 없음";

  return (
    <div className="bg-white px-6 py-6 rounded-3xl">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">팀원 초대</h2>
        {onRefreshFriends && (
          <button
            onClick={onRefreshFriends}
            className="px-3 py-1.5 text-xs rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            새로고침
          </button>
        )}
      </div>

      <section className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">어떤 그룹에 초대할까요?</h3>
        {groups.length === 0 ? (
          <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-4">
            아직 참여 중인 그룹이 없습니다. 먼저 그룹을 만들거나 참여하고 초대를 진행해주세요.
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const memberCount = group.participants.length;
              const isSelected = group.id === selectedGroupId;
              const disabled = memberCount >= 3;
              return (
                <button
                  key={group.id}
                  onClick={() => !disabled && onSelectGroup(group.id)}
                  className={`w-full p-4 rounded-3xl border flex items-center justify-between transition ${
                    disabled
                      ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                      : isSelected
                      ? "border-purple-400 bg-purple-50 text-purple-700 shadow-sm"
                      : "border-gray-200 bg-white hover:border-purple-200"
                  }`}
                  disabled={disabled}
                >
                  <div className="text-left">
                    <p className="font-semibold text-sm">{group.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {memberCount}/3명 참여중
                    </p>
                  </div>
                  <span className="text-xs font-semibold">
                    {disabled ? "정원 완료" : isSelected ? "선택됨" : "선택"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-600">초대할 친구 선택</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedGroup
                ? remainingSlots > 0
                  ? `잔여 슬롯 ${remainingSlots}명 (선택: ${selectedInvitees.length}명)`
                  : "이 그룹은 인원이 가득 찼어요."
                : "초대할 그룹을 먼저 선택해주세요."}
            </p>
            <p className="text-[11px] text-gray-400">
              랜덤으로 추천된 3명의 사용자입니다. 마음에 들지 않으면 새로고침하세요.
            </p>
          </div>
        </div>

        {loadingFriends ? (
          <div className="text-center text-gray-400 py-8 text-sm">친구 목록을 불러오는 중...</div>
        ) : friends.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            초대 가능한 친구가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => {
              const isSelected = selectedInvitees.includes(friend.id);
              const canSelectMore = selectedGroup && selectedInvitees.length < maxSelectable;
              const disabled =
                sendingInvites ||
                !selectedGroup ||
                (!isSelected && (!canSelectMore || maxSelectable === 0));
              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-4 rounded-3xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`${friend.profileColor || "bg-gray-300"} w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold`}
                    >
                      {friend.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{friend.name}</div>
                      <div className="text-xs text-gray-500">{friend.activeDays ?? 0}일째 활동 중</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(friend.id)}
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      isSelected
                        ? "bg-green-100 text-green-700 border-green-200"
                        : disabled
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {isSelected ? "선택됨" : disabled ? "선택 불가" : "선택"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <button
        onClick={sendInvites}
        disabled={!canInvite || sendingInvites}
        className={`w-full py-3 rounded-3xl font-semibold transition ${
          canInvite && !sendingInvites
            ? "bg-purple-500 text-white hover:bg-purple-600"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {sendingInvites
          ? "초대 전송 중..."
          : selectedGroup
          ? `${selectedGroupName}에 초대 보내기`
          : "초대할 그룹을 선택해주세요"}
      </button>
    </div>
  );
}
