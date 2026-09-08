// app/questions/page.tsx  →  주소: /questions
//
// 서버 컴포넌트. 데이터를 가져와서 화면에 넘겨주는 일만 한다.
// 'use client'가 없으므로 이 코드는 서버에서 실행된다.

import Link from "next/link";
import { getQuestions } from "@/lib/data/questions";
import QuestionList from "./_components/QuestionList";

export default async function QuestionsPage() {
  // 데이터를 가져오는 방법은 여기서 몰라도 된다. 함수만 부른다.
  // 5차시에 이 함수 안이 Supabase 쿼리로 바뀌어도 이 줄은 그대로다.
  const questions = await getQuestions();

  return (
    <>
      <div className="page-head">
        <h1>질문 목록</h1>
        <Link href="/questions/new" className="btn">
          + 질문하기
        </Link>
      </div>

      {/* 필터는 사용자의 클릭에 반응해야 해서 클라이언트 컴포넌트다.
          서버에서 가져온 데이터를 props로 넘겨준다. */}
      <QuestionList questions={questions} />
    </>
  );
}
