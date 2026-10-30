"use server";
//
// 파일 맨 위의 'use server'는 "이 파일의 함수들은 서버에서 실행된다"는 표시다.
// 3차시의 'use client'와 짝이 되는 개념.

import { redirect } from "next/navigation";
import { createQuestion } from "@/lib/data/questions";
import type { QuestionType, Visibility } from "@/lib/data/questions";
import { requireUser } from "@/lib/auth";

export async function createQuestionAction(formData: FormData) {
  // ★ 6차시에 추가 — 로그인한 사람만 질문을 올릴 수 있다.
  //   화면에서 버튼을 숨기는 것만으로는 부족하다. 주소를 직접 쳐서 들어오거나
  //   폼을 흉내내 보낼 수 있으므로, 실제로 저장하는 이 자리에서 막아야 한다.
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "");
  const qType = String(formData.get("qType") ?? "concept") as QuestionType;
  const visibility = String(formData.get("visibility") ?? "all") as Visibility;

  // 화면의 required는 브라우저가 해주는 편의일 뿐,
  // 개발자 도구로 지워버리면 그냥 통과한다. 서버 검사가 진짜 방어선이다.
  if (!title) redirect("/questions/new?error=title");
  if (!body) redirect("/questions/new?error=body");

  // "물리, R&E" 또는 "#물리 #R&E" 처럼 적어도 되게 쉼표·공백·# 을 정리한다
  const tags = tagsRaw
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);

  await createQuestion({
    title,
    body,
    tags,
    qType,
    visibility,
    // 작성자는 폼에서 받지 않는다. 받으면 남의 이름으로 올릴 수 있다.
    // 로그인 정보에서 서버가 직접 가져온다.
    authorId: user.id,
    authorCohort: user.cohort ?? 0,
  });

  redirect("/questions");
}
