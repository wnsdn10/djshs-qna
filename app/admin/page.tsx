// app/admin/page.tsx  →  주소: /admin
//
// 관리자 화면. 가입한 학생 전체의 점수와 활동을 본다. (10차시)
// 11차시: 최근 질문·답변을 훑어보고 이상한 글을 바로 지울 수 있게 했다.
//
// ★ 관리자(lib/auth.ts의 ADMIN_EMAILS)가 아니면 404가 뜬다.
//   헤더의 "관리" 메뉴도 관리자에게만 보이지만, 메뉴를 숨기는 건 편의일 뿐이다.
//   주소를 직접 쳐서 들어와도 막히는 건 아래 requireAdmin() 덕분이다.

import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminUsers,
  getRecentScoreLogs,
  getRecentQuestions,
  getRecentAnswers,
  getPendingAnswers,
} from "@/lib/data/admin";
import type { AdminRecentAnswer } from "@/lib/data/admin";
import { CONTRIB_LABEL, signedPoints } from "@/lib/data/answers";
import { deleteQuestionAction, deleteAnswerAction, rejudgeAnswerAction } from "./actions";
import RejudgeButton from "./_components/RejudgeButton";
import AdminDeleteButton from "@/app/_components/AdminDeleteButton";
import { IconArrowRight, IconLock } from "@/app/_components/icons";

// 검색엔진이 이 주소를 목록에 올리지 않게 한다 (어차피 로그인이 필요하지만)
export const metadata: Metadata = {
  title: "관리 · 상호 협력 학습 지원 시스템",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// score_logs.reason → 화면 글자
const REASON_LABEL: Record<string, string> = {
  info: "자료 제보",
  direction: "방향 제시",
  full: "전체 답변",
  accepted: "채택됨",
  removed: "관리자 삭제로 회수",
};

export default async function AdminPage() {
  await requireAdmin();

  const [{ users, totals }, logs, recentQuestions, recentAnswers, pendingAnswers] =
    await Promise.all([
      getAdminUsers(),
      getRecentScoreLogs(30),
      getRecentQuestions(15),
      getRecentAnswers(15),
      getPendingAnswers(),
    ]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>관리</h1>
          <p className="q-meta">이 화면은 관리자에게만 보입니다.</p>
        </div>
      </div>

      {/* 숫자 몇 개로 서비스 상태를 먼저 본다 */}
      <ul className="stat-grid" aria-label="전체 현황">
        <li className="stat">
          <span className="stat-num">{totals.users}</span>
          <span className="stat-label">가입한 학생</span>
        </li>
        <li className="stat">
          <span className="stat-num">{totals.questions}</span>
          <span className="stat-label">질문</span>
        </li>
        <li className="stat">
          <span className="stat-num">{totals.answers}</span>
          <span className="stat-label">답변</span>
        </li>
        <li className="stat">
          <span className="stat-num">{totals.zero}</span>
          <span className="stat-label">AI가 0점 준 답변</span>
        </li>
        {/* 채점 대기는 0이 정상이다. 0이 아닐 때만 눈에 띄게 (Gemini가 실패했다는 뜻이라 빨강) */}
        <li className={totals.pending > 0 ? "stat stat-warn" : "stat"}>
          <span className="stat-num">{totals.pending}</span>
          <span className="stat-label">채점 대기</span>
        </li>
      </ul>

      {/* 12차시: Gemini가 실패해서 점수 없이 저장된 답변. 있을 때만 보인다.
          "다시 채점"을 누르면 그때 점수가 정해지고 DB 트리거가 적립한다. */}
      {pendingAnswers.length > 0 && (
        <>
          <h2 className="sec-title sec-gap">
            채점 대기 <span className="count">{pendingAnswers.length}</span>
          </h2>
          <p className="lead lead-tight">
            AI 채점이 실패해 아직 0점인 답변입니다. 계속 실패하면 서버 로그의 [judgeAnswer] 줄을 확인하세요.
          </p>
          <ul className="mini-list mod-list">
            {pendingAnswers.map((a) => (
              <li key={a.id}>
                <span className="mod-main">
                  <span className="mod-excerpt">{a.excerpt}</span>
                  <span className="mini-meta mod-meta">
                    <Link href={`/admin/users/${a.authorId}`}>{a.who}</Link>
                    <Link href={`/questions/${a.questionId}`}>{a.questionTitle}</Link>
                    <span>{a.at}</span>
                  </span>
                </span>
                <form action={rejudgeAnswerAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <RejudgeButton />
                </form>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ★ 최근 올라온 글을 학생 목록보다 위에 둔다.
          관리자가 이 화면에 들어오는 가장 흔한 이유가 "이상한 글이 올라왔나"이기 때문이다. */}
      <h2 className="sec-title sec-gap">최근 질문</h2>
      {recentQuestions.length === 0 ? (
        <p className="empty">올라온 질문이 없습니다.</p>
      ) : (
        <ul className="mini-list mod-list">
          {recentQuestions.map((q) => (
            <li key={q.id}>
              <span className="mod-main">
                <Link href={`/questions/${q.id}`}>{q.title}</Link>
                <span className="mini-meta mod-meta">
                  {q.authorId ? (
                    <Link href={`/admin/users/${q.authorId}`}>
                      {q.who}
                    </Link>
                  ) : (
                    q.who
                  )}
                  {q.visibility === "seniors" && (
                    <span className="lock">
                      <IconLock size={12} />
                      선배 전용
                    </span>
                  )}
                  <span>답변 {q.answerCount}</span>
                  <span>{q.at}</span>
                </span>
              </span>
              <AdminDeleteButton action={deleteQuestionAction} id={q.id} what="질문" />
            </li>
          ))}
        </ul>
      )}

      <h2 className="sec-title sec-gap">최근 답변</h2>
      {recentAnswers.length === 0 ? (
        <p className="empty">올라온 답변이 없습니다.</p>
      ) : (
        <ul className="mini-list mod-list">
          {recentAnswers.map((a) => (
            <li key={a.id}>
              <span className="mod-main">
                {/* 답변 목록에서는 "무슨 내용인지"가 판단 기준이라 본문 앞부분을 보여준다 */}
                <span className="mod-excerpt">{a.excerpt}</span>
                <span className="mini-meta mod-meta">
                  <Link href={`/admin/users/${a.authorId}`}>
                    {a.who}
                  </Link>
                  <span>{answerScoreText(a)}</span>
                  <Link href={`/questions/${a.questionId}`}>{a.questionTitle}</Link>
                  <span>{a.at}</span>
                </span>
              </span>
              <AdminDeleteButton action={deleteAnswerAction} id={a.id} what="답변" />
            </li>
          ))}
        </ul>
      )}

      <h2 className="sec-title sec-gap">
        학생 <span className="count">{users.length}</span>
      </h2>
      <p className="lead lead-tight">최근에 로그인한 순서입니다. 누르면 그 학생의 활동 전체를 봅니다.</p>

      {users.length === 0 ? (
        <p className="empty">아직 가입한 학생이 없습니다.</p>
      ) : (
        <ul className="admin-users">
          {users.map((u) => (
            <li key={u.id}>
              <Link href={`/admin/users/${u.id}`} className="admin-user">
                <span className="admin-user-main">
                  <span className="admin-user-name">
                    {u.cohort}기 {u.studentNo}번 {u.name}
                  </span>
                  <span className="admin-user-email">{u.email}</span>
                </span>

                {/* 숫자만 늘어놓으면 무슨 숫자인지 모르므로 단어를 같이 쓴다 */}
                <span className="admin-user-stats">
                  <span>질문 {u.questionCount}</span>
                  <span>답변 {u.answerCount}</span>
                  <span>채택 {u.acceptedCount}</span>
                  {/* 0점 답변이 많으면 성의 없는 답을 반복한다는 신호다 */}
                  {u.zeroCount > 0 && (
                    <span className="chip">0점 답변 {u.zeroCount}</span>
                  )}
                </span>

                {/* 점수와 로그인 시각을 따로 둔다. 좁은 화면에서 서로 다른 줄로 보내기 위해서다 */}
                <span className="rank-pts admin-user-score">{u.totalScore}점</span>
                <span className="admin-user-seen">
                  {u.lastSignInAt ? `최근 로그인 ${u.lastSignInAt}` : "로그인 기록 없음"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="sec-title sec-gap">최근 점수 기록</h2>
      {logs.length === 0 ? (
        <p className="empty">아직 점수 기록이 없습니다.</p>
      ) : (
        <ul className="mini-list">
          {logs.map((l) => (
            <li key={l.id}>
              <Link href={`/admin/users/${l.userId}`}>{l.who}</Link>
              <span>
                {REASON_LABEL[l.reason] ?? l.reason}{" "}
                <span className="pts">{signedPoints(l.points)}</span>
              </span>
              {l.questionId && (
                <Link href={`/questions/${l.questionId}`} className="admin-log-q">
                  {l.questionTitle}
                  <IconArrowRight size={13} />
                </Link>
              )}
              <span className="mini-meta">{l.at}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** 답변 목록의 점수 표시. 12차시 답변은 "5점", 그 전 답변은 유형 이름, 채점 대기는 그대로 표시 */
function answerScoreText(a: AdminRecentAnswer): string {
  if (a.pending) return "채점 대기";
  if (a.aiScore !== null) return `AI ${a.aiScore}점`;
  return a.contribType ? CONTRIB_LABEL[a.contribType] : "";
}
