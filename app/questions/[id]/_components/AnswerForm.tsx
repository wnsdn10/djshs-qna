// app/questions/[id]/_components/AnswerForm.tsx
//
// 답변 작성 폼. 서버 컴포넌트다 ('use client'가 없다).
//
// 3차시의 태그 필터는 클릭할 때마다 목록이 바뀌어야 해서 클라이언트가 필요했지만,
// 이 폼은 제출할 때 한 번만 서버로 가면 되므로 그럴 이유가 없다.
// "상태가 바뀌며 화면이 다시 그려져야 하는가"가 판단 기준이다.

import { addAnswerAction } from "../actions";
import { CONTRIB_LABEL, CONTRIB_POINTS } from "@/lib/data/answers";
import type { ContribType } from "@/lib/data/answers";

const TYPES: ContribType[] = ["info", "direction", "full"];

export default function AnswerForm({ questionId }: { questionId: string }) {
  return (
    <form action={addAnswerAction} className="answer-form">
      {/* 어느 질문에 다는 답변인지 같이 보낸다 */}
      <input type="hidden" name="questionId" value={questionId} />

      <div className="field">
        <label htmlFor="body">답변 작성하기</label>
        <textarea id="body" name="body" rows={5} required />
      </div>

      <fieldset className="field">
        <legend>기여 유형</legend>
        <div className="radio-row">
          {TYPES.map((t, i) => (
            <label key={t}>
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
        <p className="hint">
          채택되면 {5}점이 더해집니다. 유형은 스스로 고르는 것이니 솔직하게
          선택해 주세요.
        </p>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn">
          등록
        </button>
      </div>
    </form>
  );
}
