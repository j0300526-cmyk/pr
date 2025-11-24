// 개인 미션을 선택하여 추가할 수 있는 모달 컴포넌트
import React, { useEffect, useState } from "react";
import { CatalogMission } from "../types";

interface Props {
  visible: boolean;
  loading: boolean;
  availableMissions: CatalogMission[];
  onSearch: (q: string) => void;
  onAdd: (selection: { missionId: number; submissions: string[] }) => void | Promise<void>;
  onClose: () => void;
}

interface SelectionState {
  categoryId: number | null;
  selectedExamples: string[];
}

export default function AddMissionModal({
  visible,
  loading,
  availableMissions,
  onSearch,
  onAdd,
  onClose,
}: Props) {
  const [selection, setSelection] = useState<SelectionState>({
    categoryId: null,
    selectedExamples: [],
  });
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (!visible) {
      setSelection({ categoryId: null, selectedExamples: [] });
      setSearchText("");
    } else {
      // 디버그: 모달이 열렸을 때 미션 데이터 확인
      console.log("[AddMissionModal] 모달 열림");
      console.log("[AddMissionModal] availableMissions 개수:", availableMissions.length);
      console.log("[AddMissionModal] availableMissions:", availableMissions);
    }
  }, [visible, availableMissions]);

  if (!visible) return null;

  const selectedCategory = availableMissions.find((m) => m.id === selection.categoryId);
  const exampleList = selectedCategory?.submissions || [];

  const filteredCategories = searchText
    ? availableMissions.filter((m) => {
        const q = searchText.toLowerCase();
        const inCategory = m.category.toLowerCase().includes(q);
        const inSubmissions = (m.submissions || []).some((s) =>
          s.toLowerCase().includes(q)
        );
        const inName = (m.name || "").toLowerCase().includes(q);
        return inCategory || inSubmissions || inName;
      })
    : availableMissions;

  const handleCategorySelect = (categoryId: number) => {
    console.log("[AddMissionModal] 대주제 선택:", categoryId);
    setSelection({ categoryId, selectedExamples: [] });
  };

  const handleExampleToggle = (example: string) => {
    setSelection((prev) => {
      const alreadySelected = prev.selectedExamples.includes(example);
      const nextExamples = alreadySelected
        ? prev.selectedExamples.filter((item) => item !== example)
        : [...prev.selectedExamples, example];
      return { ...prev, selectedExamples: nextExamples };
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-2">개인 미션 추가하기</h3>
        <p className="text-xs text-gray-500 mb-4">
          * 대주제를 선택한 뒤 여러 소주제를 함께 선택할 수 있어요.
        </p>

        {/* 검색 입력 */}
        <input
          type="text"
          placeholder="카테고리 검색..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            onSearch(e.target.value);
          }}
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-2xl mb-4 focus:outline-none focus:border-green-300"
        />

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
        {selectedCategory && exampleList.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ✨ 소주제 선택 (예시)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {exampleList.map((example, idx) => {
                const isSelected = selection.selectedExamples.includes(example);
                return (
                  <button
                    key={`${example}-${idx}`}
                    onClick={() => handleExampleToggle(example)}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition ${
                      isSelected
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-gray-800">
                      <span>{example}</span>
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

        {/* 선택 요약 */}
        {selection.categoryId && selection.selectedExamples.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-3 mb-4 border-2 border-green-200">
            <p className="text-xs text-gray-600 font-bold">
              ✓ 선택한 소주제 {selection.selectedExamples.length}개
            </p>
            <p className="font-bold text-gray-800 mt-1">{selectedCategory?.category}</p>
            <ul className="text-sm text-gray-700 mt-2 space-y-1 list-disc list-inside">
              {selection.selectedExamples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
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
              if (selection.categoryId && selection.selectedExamples.length > 0) {
                onAdd({
                  missionId: selection.categoryId,
                  submissions: selection.selectedExamples,
                });
              }
            }}
            disabled={
              !selection.categoryId || selection.selectedExamples.length === 0 || loading
            }
            className={`flex-1 py-3 rounded-2xl font-medium text-white ${
              selection.categoryId &&
              selection.selectedExamples.length > 0 &&
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


