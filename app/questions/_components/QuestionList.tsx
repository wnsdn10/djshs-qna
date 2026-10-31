"use client";
//
// ↑ 이 한 줄이 "여기서부터는 브라우저에서 실행된다"는 경계 표시다.
//   useState는 사용자의 클릭에 반응해 화면을 다시 그리는 기능인데,
//   그건 브라우저에서만 할 수 있는 일이다.
//
// ★ 'use client'는 파일마다 붙이는 게 아니라 "경계"를 표시하는 것이다.
//   이 파일이 불러 쓰는 QuestionCard도 자동으로 클라이언트 쪽이 된다.

import { useState } from "react";
import type { Question } from "@/lib/data/questions";
import QuestionCard from "./QuestionCard";
import { IconSearch, IconInbox } from "@/app/_components/icons";

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

  const isFiltering = keyword.trim() !== "" || tag !== "전체";

  return (
    <>
      <div className="search-wrap">
        <IconSearch size={16} />
        <input
          className="search"
          type="search"
          placeholder="제목으로 검색"
          aria-label="질문 제목 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {/* 과목 필터. 지금 무엇이 선택됐는지 스크린 리더에도 알린다. */}
      <div className="tag-filter" role="group" aria-label="과목 필터">
        {TAGS.map((t) => (
          <button
            key={t}
            type="button"
            className={t === tag ? "tag-btn on" : "tag-btn"}
            aria-pressed={t === tag}
            onClick={() => setTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        // 빈 화면에 "없습니다" 한 줄만 두면 막다른 길처럼 느껴진다.
        // 왜 비었는지와 다음에 할 일을 같이 보여준다.
        <div className="empty-box">
          <IconInbox size={32} />
          {isFiltering ? (
            <p>
              조건에 맞는 질문이 없습니다.
              <br />
              검색어를 지우거나 다른 과목을 눌러 보세요.
            </p>
          ) : (
            <p>
              아직 올라온 질문이 없습니다.
              <br />첫 질문을 올려 보세요.
            </p>
          )}
        </div>
      ) : (
        <div className="q-list">
          {filtered.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </>
  );
}
