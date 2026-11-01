"use server";
//
// app/admin/actions.ts
//
// 관리자 삭제 동작. (11차시)
//
// ★ Server Action은 "버튼이 안 보이면 못 부르는 것"이 아니다.
//   'use server' 함수는 Next.js가 주소를 하나 만들어서 브라우저가 부를 수 있게 한다.
//   학생 화면에는 삭제 버튼이 없지만, 그 주소로 요청을 직접 만들어 보낼 수는 있다.
//   그래서 함수 첫 줄에서 requireAdmin()으로 다시 확인한다. 이 줄이 빠지면 누구나 아무 글이나 지울 수 있다.
//   (게다가 삭제는 secret 키로 하므로 RLS도 막아주지 않는다)

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminDeleteQuestion, adminDeleteAnswer } from "@/lib/data/admin";

export async function deleteQuestionAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  await adminDeleteQuestion(id);

  // 질문 하나가 사라지면 목록·메인·랭킹·내 활동·관리 화면이 전부 달라진다.
  // "/" 아래 layout 전체를 다시 그리게 해서 하나도 빠뜨리지 않는다.
  revalidatePath("/", "layout");

  // 질문 상세 화면에서 지웠다면 그 화면은 이제 없는 주소다. 목록으로 보낸다.
  // (어디로 보낼지를 폼 값 그대로 쓰지 않고 정해진 값과 비교한다.
  //  주소를 그대로 받아 redirect하면 엉뚱한 사이트로 보내는 데 악용될 수 있다)
  if (formData.get("from") === "question") redirect("/questions");
}

export async function deleteAnswerAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  await adminDeleteAnswer(id);

  revalidatePath("/", "layout");
}
