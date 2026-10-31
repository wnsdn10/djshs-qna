// app/questions/[id]/_components/AnswerForm.tsx
//
// 답변 작성 폼. 서버 컴포넌트다 ('use client'가 없다).
// 제출할 때 한 번만 서버로 가면 되므로 클라이언트로 만들 이유가 없다.

import { addAnswerAction } from "../actions";
import {
  CONTRIB_LABEL,
  CONTRIB_POINTS,
  ACCEPT_POINTS,
} from "@/lib/data/answers";
import type { ContribType } from "@/lib/data/answers";

const TYPES: ContribType[] = ["info", "direction", "full"];

const TYPE_HELP: Record<ContribType, string> = {
  info: "참고할 자료나 링크를 알려줌",
  direction: "어디를 보면 될지 방향을 짚어줌",
  full: "질문을 끝까지 해결해줌",
};

export default function AnswerForm({ questionId }: { questionId: string }) {
  return (
    <form action={addAnswerAction} className="form form-wide">
      {/* 어느 질문에 다는 답변인지 같이 보낸다 */}
      <input type="hidden" name="questionId" value={questionId} />

      <div className="field">
        <label htmlFor="body">답변 내용</label>
        {/* 설명은 입력칸 앞에 둔다. 다 쓰고 나서 읽으면 늦다. */}
        <p className="field-help">
          완전한 답이 아니어도 괜찮습니다. 방향만 짚어줘도 도움이 됩니다.
        </p>
        <textarea id="body" name="body" rows={6} required />
      </div>

      <fieldset className="field">
        <legend>기여 유형</legend>
        <p className="field-help">
          고른 유형에 따라 점수가 쌓이고, 질문자가 채택하면 {ACCEPT_POINTS}점이
          더해집니다.
        </p>
        <div className="choice-row">
          {TYPES.map((t, i) => (
            <label key={t} className="choice" title={TYPE_HELP[t]}>
              <input
                type="radio"
                name="contribType"
                value={t}
                defaultChecked={i === 0}
              />
              {CONTRIB_LABEL[t]}
              <span className="pts">+{CONTRIB_POINTS[t]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn">
          답변 등록
        </button>
      </div>
    </form>
  );
}
