// app/admin/users/[id]/page.tsx  →  주소: /admin/users/<uuid>
//
// 관리자 화면: 학생 한 명의 활동 전부. (10차시)
// 질문 · 답변(AI 판정 포함) · 점수 내역을 한 화면에서 본다.
// 점수가 이상하게 높은 학생이 있을 때 "어떤 답변으로 몇 점을 받았나"를 확인하는 곳이다.

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminUserDetail } from "@/lib/data/admin";
import { CONTRIB_LABEL, signedPoints } from "@/lib/data/answers";
import { deleteQuestionAction, deleteAnswerAction } from "@/app/admin/actions";
import AdminDeleteButton from "@/app/_components/AdminDeleteButton";
import { IconArrowLeft, IconLock } from "@/app/_components/icons";

export const metadata: Metadata = {
  title: "학생 활동 · 관리",
  robots: { index: false, follow: false },
};

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
  accepted: "채택됨",
  removed: "관리자 삭제로 회수",
};

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ★ 관리자 확인을 데이터 조회보다 "먼저" 한다.
  //   Promise.all로 같이 보내면, 관리자가 아니어도 조회가 이미 시작된다.
  //   결과를 화면에 안 보여줘도 secret 키로 남의 데이터를 읽는 일 자체가 생기면 안 된다.
  await requireAdmin();

  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  const { user: u, questions, answers, logs } = detail;

  return (
    <>
      <Link href="/admin" className="btn-plain">
        <IconArrowLeft size={15} />
        관리
      </Link>

      <div className="page-head">
        <div>
          <h1>
            {u.cohort}기 {u.studentNo}번 {u.name}
          </h1>
          <p className="q-meta">
            {u.email} · 가입 {u.joinedAt} ·{" "}
            {u.lastSignInAt ? `최근 로그인 ${u.lastSignInAt}` : "로그인 기록 없음"}
          </p>
        </div>
        <span className="score-big">
          {u.totalScore}
          <span>점</span>
        </span>
      </div>

      <h2 className="sec-title">
        질문 <span className="count">{questions.length}</span>
      </h2>
      {questions.length === 0 ? (
        <p className="empty">올린 질문이 없습니다.</p>
      ) : (
        <ul className="mini-list">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`/questions/${q.id}`}>{q.title}</Link>
              {q.visibility === "seniors" && (
                <span className="lock">
                  <IconLock size={12} />
                  선배 전용
                </span>
              )}
              <span className="mini-meta">
                {STATUS_LABEL[q.status] ?? q.status} · 답변 {q.answerCount} · {q.createdAt}
              </span>
              <AdminDeleteButton action={deleteQuestionAction} id={q.id} what="질문" />
            </li>
          ))}
        </ul>
      )}

      <h2 className="sec-title sec-gap">
        답변 <span className="count">{answers.length}</span>
      </h2>
      {answers.length === 0 ? (
        <p className="empty">쓴 답변이 없습니다.</p>
      ) : (
        <ul className="answer-list">
          {answers.map((a) => {
            const lowered = a.claimedType !== null && a.contribType !== a.claimedType;
            return (
              <li key={a.id} className={a.isAccepted ? "answer accepted" : "answer"}>
                <div className="answer-head">
                  <Link href={`/questions/${a.questionId}`} className="answer-who">
                    {a.questionTitle}
                  </Link>
                  <span className="chip">{CONTRIB_LABEL[a.contribType]}</span>
                  {a.isAccepted && <span className="chip chip-ok">채택됨</span>}
                  <span className="answer-date">{a.createdAt}</span>
                </div>
                <p className="answer-body">{a.body}</p>

                {/* 답변 화면과 같은 모양으로 AI 판정을 보여준다.
                    관리자는 "AI가 왜 낮췄는지"가 타당했는지를 여기서 확인한다 */}
                {a.claimedType !== null && (
                  <p className="ai-note">
                    <span className="ai-note-label">AI 판정</span>
                    {lowered && (
                      <span className="ai-note-change">
                        {CONTRIB_LABEL[a.claimedType]} → {CONTRIB_LABEL[a.contribType]}
                      </span>
                    )}
                    {a.aiType === null ? "판정을 받지 못함 (Gemini 실패)" : a.aiReason}
                  </p>
                )}

                <div className="mod-actions">
                  <AdminDeleteButton action={deleteAnswerAction} id={a.id} what="답변" />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="sec-title sec-gap">
        점수 내역 <span className="count">{logs.length}</span>
      </h2>
      {logs.length === 0 ? (
        <p className="empty">받은 점수가 없습니다.</p>
      ) : (
        <ul className="mini-list">
          {logs.map((l) => (
            <li key={l.id}>
              <span>{REASON_LABEL[l.reason] ?? l.reason}</span>
              <span className="mini-meta">
                {signedPoints(l.points)}점 · {l.at}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
