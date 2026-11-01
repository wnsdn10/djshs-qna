"use client";
//
// app/questions/[id]/_components/SubmitAnswerButton.tsx
//
// 답변 등록 버튼. 누른 뒤 AI 판정을 기다리는 동안(보통 1~3초) "확인하는 중"으로 바뀌고 잠긴다.
//
// ★ 왜 필요한가
//   9차시부터 답변 등록이 Gemini 응답을 기다리느라 몇 초 걸린다.
//   버튼이 그대로면 사용자는 "안 눌렸나?" 하고 또 누르고, 같은 답변이 두 번 등록된다.
//   (답변이 두 번 등록되면 점수도 두 번 쌓인다)
//
// ★ useFormStatus
//   "이 버튼이 들어 있는 <form>이 지금 서버로 보내지는 중인가"를 알려주는 React 기능이다.
//   폼(AnswerForm)은 서버 컴포넌트로 두고, 상태가 필요한 버튼만 클라이언트로 떼어냈다.
//   반드시 <form> "안쪽"의 컴포넌트에서 불러야 한다 — 폼 바깥에서는 아무것도 모른다.

import { useFormStatus } from "react-dom";

export default function SubmitAnswerButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="btn"
      disabled={pending}
      // 스크린 리더에도 "처리 중"임을 알린다
      aria-busy={pending}
    >
      {pending ? "AI가 답변 유형을 확인하는 중…" : "답변 등록"}
    </button>
  );
}
