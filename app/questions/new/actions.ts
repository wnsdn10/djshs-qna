"use server";
//
// ↑ 파일 맨 위의 'use server'는 "이 파일의 함수들은 서버에서 실행된다"는 표시다.
//   3차시의 'use client'와 짝이 되는 개념이라고 보면 된다.
//
//   왜 필요한가: 폼은 브라우저에 있는데 저장은 서버에서 해야 한다.
//   이 표시가 있으면 Next.js가 그 사이의 연결을 대신 만들어 준다.
//   fetch로 API 주소를 부르는 코드를 직접 쓰지 않아도 되는 이유다.

import { redirect } from "next/navigation";
import { createQuestion } from "@/lib/data/questions";
import type { QuestionType, Visibility } from "@/lib/data/questions";

export async function createQuestionAction(formData: FormData) {
  // formData.get()으로 폼의 각 칸을 이름으로 꺼낸다.
  // 이름은 page.tsx의 <input name="..."> 와 정확히 같아야 한다.
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "");
  const qType = String(formData.get("qType") ?? "concept") as QuestionType;
  const visibility = String(formData.get("visibility") ?? "all") as Visibility;

  // ★ 서버에서도 검사한다.
  //   화면의 required 속성은 브라우저가 해주는 편의일 뿐,
  //   개발자 도구로 지워버리면 그냥 통과한다. 서버 검사가 진짜 방어선이다.
  if (!title) redirect("/questions/new?error=title");
  if (!body) redirect("/questions/new?error=body");

  // "물리, R&E" 또는 "#물리 #R&E" 처럼 적어도 되게 쉼표·공백·# 을 정리한다
  const tags = tagsRaw
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);

  await createQuestion({ title, body, tags, qType, visibility });

  // 등록이 끝나면 목록으로 보낸다
  redirect("/questions");
}
