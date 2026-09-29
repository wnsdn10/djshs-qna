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
  //   params는 Promise다. await 없이 params.id를 읽으면 이런 에러가 난다:
  //     "params is a Promise and must be unwrapped with await or React.use()"
  //   Next.js 15까지는 그냥 params.id로 썼기 때문에 옛날 예제나 AI가 알려주는
  //   코드와 다르다. 다행히 조용히 undefined가 되지 않고 파일·줄 번호까지
  //   찍힌 에러로 멈춰주므로, 만나면 바로 고칠 수 있다.
  //
  //   (서버 컴포넌트는 async라서 await를 쓴다. 클라이언트 컴포넌트는 async가
  //    안 되므로 그쪽에서는 React.use()를 쓴다.)
  const { id } = await params;

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
