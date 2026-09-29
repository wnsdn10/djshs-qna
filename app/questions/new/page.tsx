// app/questions/new/page.tsx  →  주소: /questions/new
//
// 서버 컴포넌트다. 'use client'가 없다는 점에 주목할 것.
// 폼에 useState를 쓰지 않고, <form action={서버함수}> 하나로 처리하기 때문에
// 클라이언트 컴포넌트로 만들 필요가 없다.

import Link from "next/link";
import { createQuestionAction } from "./actions";

const ERROR_MESSAGE: Record<string, string> = {
  title: "제목을 입력하세요.",
  body: "내용을 입력하세요.",
};

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // ★ searchParams도 params와 똑같이 Promise다. await가 필요하다. (Next.js 16)
  //   주소 뒤의 ?error=title 부분을 읽는 것.
  const { error } = await searchParams;

  return (
    <>
      <div className="page-head">
        <h1>질문 작성</h1>
        <Link href="/questions" className="btn-plain">
          ← 목록으로
        </Link>
      </div>

      {error && (
        <p className="form-error">{ERROR_MESSAGE[error] ?? "입력을 확인하세요."}</p>
      )}

      {/* action에 서버 함수를 그대로 연결한다.
          onSubmit + fetch로 API를 부르는 옛날 방식이 필요 없다. */}
      <form action={createQuestionAction} className="form">
        <div className="field">
          <label htmlFor="title">제목</label>
          <input id="title" name="title" type="text" required />
        </div>

        <div className="field">
          <label htmlFor="body">내용</label>
          <textarea id="body" name="body" rows={8} required />
        </div>

        <div className="field">
          <label htmlFor="tags">태그</label>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="예: 물리, R&E  (쉼표나 띄어쓰기로 구분)"
          />
        </div>

        <fieldset className="field">
          <legend>질문 유형</legend>
          <div className="radio-row">
            <label>
              <input type="radio" name="qType" value="concept" defaultChecked />
              개념
            </label>
            <label>
              <input type="radio" name="qType" value="problem" />
              문제
            </label>
            <label>
              <input type="radio" name="qType" value="research" />
              연구·보고서
            </label>
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>공개 범위</legend>
          <div className="radio-row">
            <label>
              <input type="radio" name="visibility" value="all" defaultChecked />
              전체
            </label>
            <label>
              <input type="radio" name="visibility" value="seniors" />
              선배에게만
            </label>
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn">
            등록하기
          </button>
        </div>
      </form>
    </>
  );
}
