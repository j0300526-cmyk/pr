// src/components/BottomTab.tsx
import React from "react";
import { Home, Users, Send, User as UserIcon, Trophy } from "lucide-react";
import { PageType } from "../types";

interface Props {
  currentPage: PageType;
  setCurrentPage: (p: PageType) => void;
}

export default function BottomTab({ currentPage, setCurrentPage }: Props) {
  return (
    <div className="border-t bg-white/80 backdrop-blur px-4 py-3">
      <nav className="grid grid-cols-5 gap-2">
        {/* 홈 */}
        <button
          onClick={() => setCurrentPage("home")}
          className={`group flex flex-col items-center gap-1 p-2 rounded-2xl transition ${
            currentPage === "home"
              ? "bg-green-50 text-green-700"
              : "text-gray-400 hover:bg-gray-50"
          }`}
          aria-current={currentPage === "home"}
        >
          <Home size={22} className={currentPage === "home" ? "" : "opacity-80"} />
          <span className="text-[11px] leading-none">홈</span>
          {currentPage === "home" && (
            <span className="h-0.5 w-6 rounded-full bg-green-400 mt-0.5" />
          )}
        </button>

        {/* 그룹 */}
        <button
          onClick={() => setCurrentPage("groupmanage")}
          className={`group flex flex-col items-center gap-1 p-2 rounded-2xl transition ${
            currentPage === "groupmanage"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-400 hover:bg-gray-50"
          }`}
          aria-current={currentPage === "groupmanage"}
        >
          <Users size={22} className={currentPage === "groupmanage" ? "" : "opacity-80"} />
          <span className="text-[11px] leading-none">그룹</span>
          {currentPage === "groupmanage" && (
            <span className="h-0.5 w-6 rounded-full bg-blue-400 mt-0.5" />
          )}
        </button>

        {/* ✅ 랭킹 */}
<button
  onClick={() => setCurrentPage("ranking")}
  className={`group flex flex-col items-center gap-1 p-2 rounded-2xl transition ${
    currentPage === "ranking"
      ? "bg-teal-50 text-teal-700"
      : "text-gray-400 hover:bg-gray-50"
  }`}
>
  <Trophy size={22} />
  <span className="text-[11px] leading-none">랭킹</span>
  {currentPage === "ranking" && (
    <span className="h-0.5 w-6 rounded-full bg-teal-400 mt-0.5" />
  )}
</button>

        {/* 초대 */}
        <button
          onClick={() => setCurrentPage("invite")}
          className={`group flex flex-col items-center gap-1 p-2 rounded-2xl transition ${
            currentPage === "invite"
              ? "bg-purple-50 text-purple-700"
              : "text-gray-400 hover:bg-gray-50"
          }`}
          aria-current={currentPage === "invite"}
        >
          <Send size={22} className={currentPage === "invite" ? "" : "opacity-80"} />
          <span className="text-[11px] leading-none">초대</span>
          {currentPage === "invite" && (
            <span className="h-0.5 w-6 rounded-full bg-purple-400 mt-0.5" />
          )}
        </button>

        
        {/* 마이페이지 */}
        <button
          onClick={() => setCurrentPage("mypage")}
          className={`group flex flex-col items-center gap-1 p-2 rounded-2xl transition ${
            currentPage === "mypage"
              ? "bg-amber-50 text-amber-700"
              : "text-gray-400 hover:bg-gray-50"
          }`}
          aria-current={currentPage === "mypage"}
        >
          <UserIcon size={22} className={currentPage === "mypage" ? "" : "opacity-80"} />
          <span className="text-[11px] leading-none">마이</span>
          {currentPage === "mypage" && (
            <span className="h-0.5 w-6 rounded-full bg-amber-400 mt-0.5" />
          )}
        </button>
      </nav>
    </div>
  );
}
