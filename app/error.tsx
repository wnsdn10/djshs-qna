"use client";
//
// app/error.tsx
//
// 화면을 그리다 에러가 났을 때 보여줄 화면.
// 'use client'가 필요하다 — 다시 시도 버튼이 동작해야 하기 때문이다.

import { IconAlert } from "@/app/_components/icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="empty-box" style={{ borderStyle: "solid" }}>
      <IconAlert size={32} />
      <h1 style={{ fontSize: "1.2rem" }}>화면을 불러오지 못했습니다</h1>
      <p>
        잠시 후 다시 시도해 주세요.
        <br />
        계속 같은 문제가 생기면 알려주세요.
      </p>

      {/* 개발 중에만 원인을 보여준다.
          배포본에서 DB 구조나 내부 사정이 그대로 노출되면 안 된다. */}
      {process.env.NODE_ENV === "development" && (
        <pre className="err-detail">{error.message}</pre>
      )}

      <button type="button" className="btn" onClick={reset}>
        다시 시도
      </button>
    </div>
  );
}
