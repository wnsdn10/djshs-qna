// app/questions/_components/QuestionCard.tsx
//
// 목록에서 한 줄. 훑어보며 고르는 자리라 정보 순서가 중요하다.
//   1) 상태 (왼쪽 색 막대 + 배지)  — 지금 도움이 필요한 질문인지
//   2) 제목                        — 가장 크게
//   3) 태그 · 기수 · 답변 수       — 작게, 한 줄로

import Link from "next/link";
import type { Question, QuestionStatus } from "@/lib/data/questions";
import { IconLock, IconMessage } from "@/app/_components/icons";

const STATUS_LABEL: Record<QuestionStatus, string> = {
  unanswered: "답변 기다리는 중",
  answered: "답변 있음",
  resolved: "해결됨",
};

export default function QuestionCard({ question }: { question: Question }) {
  return (
    <Link
      href={`/questions/${question.id}`}
      className="q-card"
      data-status={question.status}
    >
      <div className="q-card-title">{question.title}</div>

      <div className="q-card-row">
        {/* 상태는 색 막대(왼쪽)와 글자 배지로 두 번 알린다.
            색만으로 구분하면 색각 이상인 사람이 읽을 수 없다. */}
        <span className={`badge badge-${question.status}`}>
          {STATUS_LABEL[question.status]}
        </span>

        {question.visibility === "seniors" && (
          <span className="lock">
            <IconLock size={12} />
            선배 전용
          </span>
        )}

        <span className="q-card-tags">
          {question.tags.map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </span>

        {/* 계획서의 익명 원칙: 이름 없이 기수만 */}
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: "0.75rem" }}>
          <span>{question.authorCohort}기</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <IconMessage size={13} />
            {question.answerCount}
          </span>
        </span>
      </div>
    </Link>
  );
}
