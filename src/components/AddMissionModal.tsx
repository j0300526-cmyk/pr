// 개인 미션을 선택하여 추가할 수 있는 모달 컴포넌트
import React, { useEffect, useState } from "react";
import { CatalogMission, CatalogSubMission } from "../types";

interface Props {
  visible: boolean;
  loading: boolean;
  availableMissions: CatalogMission[];
  onAdd: (selection: { missionIds: number[] }) => void | Promise<void>;
  onClose: () => void;
}

interface SelectionState {
  categoryId: number | null;
  selectedSubMissions: CatalogSubMission[];
}

export default function AddMissionModal({
  visible,
  loading,
  availableMissions,
  onAdd,
  onClose,
}: Props) {
  const [selection, setSelection] = useState<SelectionState>({
    categoryId: null,
    selectedSubMissions: [],
  });

  useEffect(() => {
    if (!visible) {
      setSelection({ categoryId: null, selectedSubMissions: [] });
    } else {
      // 디버그: 모달이 열렸을 때 미션 데이터 확인
      console.log("[AddMissionModal] 모달 열림");
      console.log("[AddMissionModal] availableMissions 개수:", availableMissions.length);
      console.log("[AddMissionModal] availableMissions:", availableMissions);
    }
  }, [visible, availableMissions]);

  if (!visible) return null;

  const selectedCategory = availableMissions.find((m) => m.id === selection.categoryId);
  const subMissionList = selectedCategory?.submissions || [];

  const filteredCategories = availableMissions;

  const handleCategorySelect = (categoryId: number) => {
    console.log("[AddMissionModal] 대주제 선택:", categoryId);
    setSelection({ categoryId, selectedSubMissions: [] });
  };

  const handleExampleToggle = (subMission: CatalogSubMission) => {
    setSelection((prev) => {
      const alreadySelected = prev.selectedSubMissions.some((s) => s.id === subMission.id);
      const nextSubMissions = alreadySelected
        ? prev.selectedSubMissions.filter((s) => s.id !== subMission.id)
        : [...prev.selectedSubMissions, subMission];
      return { ...prev, selectedSubMissions: nextSubMissions };
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-2">개인 미션 추가하기</h3>

        {/* 대주제 선택 (1단계) */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            📌 대주제 선택
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition ${
                    selection.categoryId === category.id
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-200"
                  }`}
                >
                  <div className="font-bold text-gray-800">{category.category}</div>
                </button>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 소주제 선택 (2단계) */}
        {selectedCategory && subMissionList.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ✨ 소주제 선택 (예시)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {subMissionList.map((subMission) => {
                const isSelected = selection.selectedSubMissions.some((s) => s.id === subMission.id);
                return (
                  <button
                    key={subMission.id}
                    onClick={() => handleExampleToggle(subMission)}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition ${
                      isSelected
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-gray-800">
                      <span>{subMission.label}</span>
                      {isSelected && (
                        <span className="text-xs text-blue-500 font-semibold">선택됨</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 rounded-2xl font-medium text-gray-700"
          >
            취소
          </button>
          <button
            onClick={() => {
              if (selection.categoryId && selection.selectedSubMissions.length > 0) {
                onAdd({
                  missionIds: selection.selectedSubMissions.map((s) => s.id),
                });
              }
            }}
            disabled={
              !selection.categoryId || selection.selectedSubMissions.length === 0 || loading
            }
            className={`flex-1 py-3 rounded-2xl font-medium text-white ${
              selection.categoryId &&
              selection.selectedSubMissions.length > 0 &&
              !loading
                ? "bg-green-300 hover:bg-green-400"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}


