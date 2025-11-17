// 에러 메시지를 화면 상단에 표시하는 토스트 컴포넌트
import React from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  message: string;
}

export default function ErrorToast({ message }: Props) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2">
      <AlertCircle size={20} />
      <span>{message}</span>
    </div>
  );
}


