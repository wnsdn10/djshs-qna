// app/questions/[id]/_components/AnswerForm.tsx
//
// 답변 작성 폼. 서버 컴포넌트다 ('use client'가 없다).
// 제출할 때 한 번만 서버로 가면 되므로 클라이언트로 만들 이유가 없다.

import { addAnswerAction } from "../actions";
import {
  CONTRIB_LABEL,
  CONTRIB_HELP,
  ACCEPT_POINTS,
  SCORE_BANDS,
  SCORE_MAX,
} from "@/lib/data/answers";
import SubmitAnswerButton from "./SubmitAnswerButton";
import MathTextarea from "@/app/_components/MathTextarea";

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
        {/* 12차시: 수식 미리보기가 붙은 입력칸. 폼으로 보내지는 값은 그냥 textarea와 같다 */}
        <MathTextarea id="body" name="body" rows={6} required />
      </div>

      {/* ★ 12차시: 기여 유형을 고르는 라디오 버튼을 없앴다.
            "AI가 낮추기만 하니 모두 최고 점수를 고른다"는 피드백 때문이다.
            대신 AI가 어떤 기준으로 매기는지 등록 "전에" 보여준다 — 기준을 알고 쓰게.
            이 블록은 입력이 아니라 안내라서 <fieldset> 대신 <section>이다. */}
      <section className="field" aria-labelledby="score-guide-title">
        <h3 id="score-guide-title" className="field-title">점수는 AI가 매깁니다</h3>
        <p className="field-help ai-help">
          등록하면 AI가 답변 내용을 읽고 0~{SCORE_MAX}점 중 하나를 줍니다. 질문자가 채택하면{" "}
          {ACCEPT_POINTS}점이 더해집니다.
        </p>
        <ul className="points points-compact">
          {SCORE_BANDS.map((b) => (
            <li key={b.type} className="point-card">
              <span className="point-num">
                +{b.min}~{b.max}
              </span>
              <span className="point-name">{CONTRIB_LABEL[b.type]}</span>
              <span className="point-desc">{CONTRIB_HELP[b.type]}</span>
            </li>
          ))}
        </ul>
        <p className="field-help">
          질문과 상관없거나 아무 정보가 없는 답은 0점입니다. 길이보다 내용을 봅니다.
        </p>
      </section>

      <div className="form-actions">
        <SubmitAnswerButton />
      </div>
    </form>
  );
}
