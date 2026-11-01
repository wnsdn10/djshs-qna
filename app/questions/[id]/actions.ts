"use server";
//
// 질문 상세 화면의 동작들 — 답변 등록, 답변 채택.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAnswer, acceptAnswer } from "@/lib/data/answers";
import type { ContribType } from "@/lib/data/answers";
import { getQuestion } from "@/lib/data/questions";
import { judgeAnswer } from "@/lib/ai/judge";

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

  // ★ 질문을 "내 권한으로" 읽는다 (9차시에 추가)
  //   이유 1: Gemini에게 질문 내용을 같이 보여줘야 답변이 질문에 맞는지 판단할 수 있다.
  //   이유 2: 답변 저장은 RLS를 건너뛰는 secret 키로 하므로, "이 사람이 볼 수 있는 질문인가"를
  //          DB가 대신 확인해 주지 않는다. 여기서 RLS가 걸린 조회로 확인한다.
  //          선배 전용 질문이라 볼 수 없는 사람이면 null이 돌아온다.
  const question = await getQuestion(questionId);
  if (!question) redirect("/questions");

  // Gemini 판정. 실패하면 null — 답변 등록은 막지 않는다
  const judgement = await judgeAnswer({
    questionTitle: question.title,
    questionBody: question.body,
    answerBody: body,
  });

  // 최종 유형("고른 것과 AI 판정 중 낮은 쪽")은 createAnswer 안에서 정한다
  await createAnswer({
    questionId,
    // 작성자는 폼에서 받지 않는다. 받으면 남의 이름으로 답변을 올릴 수 있다.
    // secret 키로 저장하는 9차시부터는 RLS가 이걸 대신 막아주지 않으므로 더 중요하다.
    authorId: user.id,
    body,
    claimedType: contribType,
    judgement,
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
