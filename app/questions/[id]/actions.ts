"use server";
//
// 질문 상세 화면의 동작들 — 답변 등록, 답변 채택.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAnswer, acceptAnswer } from "@/lib/data/answers";
import type { ContribType } from "@/lib/data/answers";
import { getQuestion } from "@/lib/data/questions";

const VALID_TYPES: ContribType[] = ["info", "direction", "full"];

export async function addAnswerAction(formData: FormData) {
  const user = await requireUser();

  const questionId = String(formData.get("questionId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const contribType = String(formData.get("contribType") ?? "") as ContribType;

  if (!body) redirect(`/questions/${questionId}?error=body`);
  if (!VALID_TYPES.includes(contribType)) {
    redirect(`/questions/${questionId}?error=type`);
  }

  await createAnswer({
    questionId,
    // 작성자는 폼에서 받지 않는다. 받으면 남의 이름으로 답변을 올릴 수 있다.
    authorId: user.id,
    body,
    contribType,
  });

  // ★ 화면을 다시 그리게 한다.
  //   이게 없으면 답변이 DB에 들어갔는데도 화면은 이전 상태 그대로다.
  //   (4차시 끝에 "저장은 됐는데 목록에 안 뜬다"로 겪었던 그 문제)
  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/questions"); // 목록의 답변 수·상태 배지도 바뀐다
}

export async function acceptAnswerAction(formData: FormData) {
  const user = await requireUser();

  const answerId = String(formData.get("answerId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  // ★ 앱에서도 한 번 확인한다.
  //   RLS 정책이 이미 막고 있지만, 여기서 걸러주면 사용자가
  //   "왜 아무 일도 안 일어나지?" 대신 분명한 결과를 보게 된다.
  const question = await getQuestion(questionId);
  if (!question) redirect("/questions");

  await acceptAnswer(answerId);

  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/questions");
}
