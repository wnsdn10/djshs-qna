// app/questions/page.tsx  →  주소: /questions
//
// 서버 컴포넌트. 데이터를 가져와서 화면에 넘겨주는 일만 한다.

import Link from "next/link";
import { getQuestions } from "@/lib/data/questions";
import QuestionList from "./_components/QuestionList";
import { IconPlus } from "@/app/_components/icons";
import { requireUser } from "@/lib/auth";

// 접속할 때마다 DB를 다시 읽는다 (5차시 참고)
export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  // ★ 교내 시스템이므로 목록 자체가 로그인한 사람에게만 보여야 한다.
  //    RLS는 "선배에게만" 질문을 가려주지만, 전체 공개 질문은 로그인 없이도
  //    읽힌다. DB 규칙과 화면 규칙을 같은 기준으로 맞춘다.
  await requireUser();

  const questions = await getQuestions();

  const waiting = questions.filter((q) => q.answerCount === 0).length;

  return (
    <>
      <div className="page-head">
        <h1>질문</h1>
        <Link href="/questions/new" className="btn">
          <IconPlus size={16} />
          질문하기
        </Link>
      </div>

      {/* 정렬 규칙을 화면에도 적어둔다.
          "왜 이 순서지?"를 사용자가 추측하게 두지 않는다. */}
      <p className="lead">
        {waiting > 0
          ? `답변을 기다리는 질문 ${waiting}개가 위에 있습니다.`
          : "모든 질문에 답변이 달렸습니다."}
      </p>

      <QuestionList questions={questions} />
    </>
  );
}
