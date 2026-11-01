// app/questions/[id]/_components/AnswerForm.tsx
//
// 답변 작성 폼. 서버 컴포넌트다 ('use client'가 없다).
// 제출할 때 한 번만 서버로 가면 되므로 클라이언트로 만들 이유가 없다.

import { addAnswerAction } from "../actions";
import {
  CONTRIB_LABEL,
  CONTRIB_POINTS,
  CONTRIB_HELP,
  ACCEPT_POINTS,
} from "@/lib/data/answers";
import type { ContribType } from "@/lib/data/answers";
import SubmitAnswerButton from "./SubmitAnswerButton";

const TYPES: ContribType[] = ["info", "direction", "full"];

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
        {/* ★ 규칙을 등록 "전에" 알려준다. 등록하고 나서 점수가 깎인 걸 보면 억울하다.
            "올려 주지는 않는다"도 같이 적는다. 겸손하게 낮게 고르면 AI가 높여 주지 않으니, 한 만큼 고르라는 뜻이다. */}
        <p className="field-help ai-help">
          등록하면 AI가 내용을 보고 유형을 확인합니다. 고른 유형보다 내용이
          부족하면 낮춰서 기록하고, 더 높게 올려 주지는 않습니다.
        </p>
        {/* ★ 설명을 title(마우스를 올리면 뜨는 말풍선)에서 화면에 보이는 글자로 옮겼다.
            title은 휴대폰에서는 볼 방법이 없고, 키보드 사용자에게도 잘 안 보인다.
            학생 대부분이 휴대폰으로 들어올 서비스라 "올려야 보이는 정보"는 없는 정보와 같다. */}
        <div className="choice-row choice-row-stack">
          {TYPES.map((t, i) => (
            <label key={t} className="choice choice-stack">
              <input
                type="radio"
                name="contribType"
                value={t}
                defaultChecked={i === 0}
              />
              <span className="choice-text">
                <span className="choice-name">
                  {CONTRIB_LABEL[t]}
                  <span className="pts">+{CONTRIB_POINTS[t]}</span>
                </span>
                <span className="choice-help">{CONTRIB_HELP[t]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-actions">
        <SubmitAnswerButton />
      </div>
    </form>
  );
}
