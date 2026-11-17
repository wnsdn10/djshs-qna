"use client";
//
// app/admin/_components/RejudgeButton.tsx
//
// "다시 채점" 버튼. Gemini 응답을 기다리는 몇 초 동안 "채점하는 중"으로 바뀌고 잠긴다. (12차시)
// 답변 등록 버튼(SubmitAnswerButton)과 같은 방식이다 — useFormStatus는 <form> 안쪽에서만 쓸 수 있다.

import { useFormStatus } from "react-dom";

export default function RejudgeButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-ghost btn-sm" disabled={pending} aria-busy={pending}>
      {pending ? "채점하는 중…" : "다시 채점"}
    </button>
  );
}
