// app/me/page.tsx  →  주소: /me

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getMyQuestions,
  getMyAnswers,
  getMyScoreLogs,
} from "@/lib/data/ranking";
import { IconInbox } from "@/app/_components/icons";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  unanswered: "답변 기다리는 중",
  answered: "답변 있음",
  resolved: "해결됨",
};

const REASON_LABEL: Record<string, string> = {
  info: "자료 제보",
  direction: "방향 제시",
  full: "전체 답변",
  accepted: "답변 채택됨",
};

export default async function MePage() {
  const user = await requireUser();

  // 셋을 동시에 요청한다. 하나씩 await하면 앞의 것이 끝나야 다음이 시작된다.
  const [questions, answers, logs] = await Promise.all([
    getMyQuestions(user.id),
    getMyAnswers(user.id),
    getMyScoreLogs(user.id),
  ]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>내 활동</h1>
          <p className="q-meta">
            {user.cohort}기 {user.studentNo}번 {user.name}
          </p>
        </div>
        <span className="score-big">
          {user.totalScore}
          <span>점</span>
        </span>
      </div>

      <h2 className="sec-title">
        내가 올린 질문 <span className="count">{questions.length}</span>
      </h2>
      {questions.length === 0 ? (
        <div className="empty-box">
          <IconInbox size={28} />
          <p>
            아직 올린 질문이 없습니다.
            <br />
            <Link href="/questions/new">질문하기</Link>
          </p>
        </div>
      ) : (
        <ul className="mini-list">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`/questions/${q.id}`}>{q.title}</Link>
              <span className="mini-meta">
                {STATUS_LABEL[q.status] ?? q.status} · 답변 {q.answerCount} ·{" "}
                {q.createdAt}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="sec-title" style={{ marginTop: "var(--sp-6)" }}>
        내가 쓴 답변 <span className="count">{answers.length}</span>
      </h2>
      {answers.length === 0 ? (
        <div className="empty-box">
          <IconInbox size={28} />
          <p>
            아직 쓴 답변이 없습니다.
            <br />
            <Link href="/questions">답변을 기다리는 질문 보기</Link>
          </p>
        </div>
      ) : (
        <ul className="mini-list">
          {answers.map((a) => (
            <li key={a.id}>
              <Link href={`/questions/${a.questionId}`}>{a.questionTitle}</Link>
              <span className="mini-meta">
                {REASON_LABEL[a.contribType] ?? a.contribType}
                {a.isAccepted && " · 채택됨"} · {a.createdAt}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* ★ 점수 내역이 있는 이유
          합계만 보여주면 "왜 이 점수지?"를 확인할 방법이 없다.
          score_logs에 한 줄씩 남겨두었기 때문에 이렇게 보여줄 수 있다. */}
      <h2 className="sec-title" style={{ marginTop: "var(--sp-6)" }}>
        점수 내역
      </h2>
      {logs.length === 0 ? (
        <p className="empty">아직 받은 점수가 없습니다.</p>
      ) : (
        <ul className="mini-list">
          {logs.map((l) => (
            <li key={l.id}>
              <span>{REASON_LABEL[l.reason] ?? l.reason}</span>
              <span className="mini-meta">
                +{l.points}점 · {l.createdAt}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
