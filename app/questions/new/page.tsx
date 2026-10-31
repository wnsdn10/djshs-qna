// app/questions/new/page.tsx  →  주소: /questions/new

import Link from "next/link";
import { createQuestionAction } from "./actions";
import { requireUser } from "@/lib/auth";
import { IconArrowLeft, IconAlert } from "@/app/_components/icons";

const ERROR_MESSAGE: Record<string, string> = {
  title: "제목을 입력하세요.",
  body: "내용을 입력하세요.",
};

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // 로그인 안 했으면 로그인 화면으로. 저장하는 쪽(actions.ts)에서도 한 번 더 막는다.
  await requireUser();

  const { error } = await searchParams;

  return (
    <>
      <Link href="/questions" className="btn-plain">
        <IconArrowLeft size={15} />
        질문 목록
      </Link>

      <div className="page-head">
        <h1>질문하기</h1>
      </div>

      {error && (
        <p className="form-error" role="alert">
          <IconAlert size={16} />
          {ERROR_MESSAGE[error] ?? "입력을 확인하세요."}
        </p>
      )}

      {/* action에 서버 함수를 그대로 연결한다.
          onSubmit + fetch로 API를 부르는 옛날 방식이 필요 없다. */}
      <form action={createQuestionAction} className="form form-wide">
        <div className="field">
          <label htmlFor="title">제목</label>
          <p className="field-help">
            무엇이 막혔는지 한 문장으로 적으면 답변이 더 빨리 붙습니다.
          </p>
          <input id="title" name="title" type="text" required />
        </div>

        <div className="field">
          <label htmlFor="body">내용</label>
          <p className="field-help">
            시도해 본 것과 어디서 막혔는지를 같이 적어주세요.
          </p>
          <textarea id="body" name="body" rows={8} required />
        </div>

        <div className="field">
          <label htmlFor="tags">태그</label>
          <p className="field-help">
            과목이나 단원을 적으면 아는 사람에게 더 잘 보입니다.
          </p>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="물리, R&E"
          />
        </div>

        <fieldset className="field">
          <legend>질문 유형</legend>
          <div className="choice-row">
            <label className="choice">
              <input type="radio" name="qType" value="concept" defaultChecked />
              개념
            </label>
            <label className="choice">
              <input type="radio" name="qType" value="problem" />
              문제
            </label>
            <label className="choice">
              <input type="radio" name="qType" value="research" />
              연구·보고서
            </label>
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>공개 범위</legend>
          <p className="field-help">
            선배에게만 공개하면 나보다 앞 기수인 사람에게만 보입니다.
          </p>
          <div className="choice-row">
            <label className="choice">
              <input type="radio" name="visibility" value="all" defaultChecked />
              전체
            </label>
            <label className="choice">
              <input type="radio" name="visibility" value="seniors" />
              선배에게만
            </label>
          </div>
        </fieldset>

        <div className="form-actions">
          <Link href="/questions" className="btn-ghost">
            취소
          </Link>
          <button type="submit" className="btn">
            등록
          </button>
        </div>
      </form>
    </>
  );
}
