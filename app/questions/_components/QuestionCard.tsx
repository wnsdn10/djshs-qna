// app/questions/_components/QuestionCard.tsx
//
// 카드 하나의 모양. 카드 디자인을 고칠 일이 생기면 이 파일만 고치면 된다.
// 순수 HTML로 만들었다면 목록을 그리는 코드 안에 문자열로 섞여 있었을 것이다.
//
// 'use client'가 없지만, 이 컴포넌트를 쓰는 QuestionList가 클라이언트라서
// 이것도 클라이언트 쪽에서 실행된다. (경계는 부모가 정한다)

import Link from "next/link";
import type { Question, QuestionStatus } from "@/lib/data/questions";

const STATUS_LABEL: Record<QuestionStatus, string> = {
  unanswered: "미답변",
  answered: "답변 있음",
  resolved: "해결됨",
};

export default function QuestionCard({ question }: { question: Question }) {
  return (
    <Link href={`/questions/${question.id}`} className="q-card">
      <span className={`badge badge-${question.status}`}>
        {STATUS_LABEL[question.status]}
      </span>

      <div className="q-card-main">
        <div className="q-card-title">
          {question.title}
          {/* 선배에게만 공개인 질문 표시. 실제로 걸러내는 건 8차시 RLS에서 */}
          {question.visibility === "seniors" && (
            <span className="lock">선배 전용</span>
          )}
        </div>
        <div className="q-card-tags">
          {question.tags.map((t) => `#${t}`).join(" ")}
        </div>
      </div>

      <div className="q-card-meta">
        {/* 계획서의 익명 원칙: 이름 없이 기수만 보인다 */}
        {question.authorCohort}기 작성 · 답변 {question.answerCount}
      </div>
    </Link>
  );
}
