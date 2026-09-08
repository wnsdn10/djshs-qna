"use client";
//
// ↑ 이 한 줄이 "여기서부터는 브라우저에서 실행된다"는 경계 표시다.
//
// 왜 필요한가: useState는 사용자의 클릭에 반응해 화면을 다시 그리는 기능인데,
// 그건 브라우저에서만 할 수 있는 일이다. 서버는 HTML을 한 번 만들어 보내면 끝이라
// 그 뒤에 일어나는 클릭을 알지 못한다.
//
// ★ 중요: 'use client'는 파일마다 붙이는 게 아니라 "경계"를 표시하는 것이다.
//   이 파일이 불러 쓰는 QuestionCard도 자동으로 클라이언트 쪽이 된다.
//   그래서 QuestionCard.tsx에는 'use client'가 없다.

import { useState } from "react";
import type { Question } from "@/lib/data/questions";
import QuestionCard from "./QuestionCard";

// 지금은 과목을 직접 적어둔다. 나중에 DB에서 뽑아 쓸 수도 있다.
const TAGS = ["전체", "수학", "물리", "화학", "생명", "정보", "기타"];

export default function QuestionList({ questions }: { questions: Question[] }) {
  const [keyword, setKeyword] = useState("");
  const [tag, setTag] = useState("전체");

  // 원본 questions는 그대로 두고, 걸러낸 새 배열을 만든다.
  const filtered = questions.filter((q) => {
    const matchTag = tag === "전체" || q.tags.includes(tag);
    const matchKeyword = q.title.includes(keyword.trim());
    return matchTag && matchKeyword;
  });

  return (
    <>
      <input
        className="search"
        type="text"
        placeholder="검색어를 입력하세요"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="tag-filter">
        {TAGS.map((t) => (
          <button
            key={t}
            type="button"
            className={t === tag ? "tag-btn on" : "tag-btn"}
            onClick={() => setTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="q-list">
        {filtered.length === 0 ? (
          <p className="empty">조건에 맞는 질문이 없습니다.</p>
        ) : (
          filtered.map((q) => <QuestionCard key={q.id} question={q} />)
        )}
      </div>
    </>
  );
}
