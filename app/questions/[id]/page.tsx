// app/questions/[id]/page.tsx  →  주소: /questions/1, /questions/2 ...
//
// 서버 컴포넌트. 주소에서 id를 꺼내 그 질문 하나를 가져온다.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestion } from "@/lib/data/questions";
import type { QuestionStatus } from "@/lib/data/questions";

const STATUS_LABEL: Record<QuestionStatus, string> = {
  unanswered: "미답변",
  answered: "답변 있음",
  resolved: "해결됨",
};

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ★ Next.js 16 함정
  //   params는 Promise다. await 없이 params.id를 읽으면 undefined가 나온다.
  //   (Next.js 15까지는 그냥 params.id로 썼기 때문에 옛날 예제와 다르다)
  const { id } = params;

  const question = await getQuestion(id);

  // 없는 id로 들어오면 404 화면을 보여준다
  if (!question) notFound();

  return (
    <article className="q-detail">
      <div className="q-detail-head">
        <span className={`badge badge-${question.status}`}>
          {STATUS_LABEL[question.status]}
        </span>
        <span className="q-card-tags">
          {question.tags.map((t) => `#${t}`).join(" ")}
        </span>
      </div>

      <h1>{question.title}</h1>
      <p className="q-detail-body">{question.body}</p>

      <div className="q-card-meta">
        {question.authorCohort}기 · {question.createdAt}
      </div>

      <hr />

      {/* 답변 등록은 7차시에 만든다. 지금은 자리만 잡아둔다. */}
      <h2 className="answers-title">답변 {question.answerCount}</h2>
      <p className="empty">아직 답변이 없습니다.</p>

      <Link href="/questions" className="btn-plain">
        ← 목록으로
      </Link>
    </article>
  );
}
