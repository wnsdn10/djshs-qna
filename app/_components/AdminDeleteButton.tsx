"use client";
//
// app/_components/AdminDeleteButton.tsx
//
// 관리자 전용 삭제 버튼. 누르면 바로 지우지 않고 한 번 더 묻는다. (11차시)
//
// ★ 왜 두 번 누르게 하나
//   삭제는 되돌릴 수 없다. 글이 사라지고, 그 글로 받은 점수도 회수된다.
//   목록에서 옆 줄 버튼을 잘못 누르는 일은 생각보다 흔하다.
//   그래서 첫 클릭은 "무엇이 일어나는지" 보여주기만 하고, 두 번째 클릭에서 지운다.
//
// ★ 브라우저 기본 confirm() 창을 안 쓰는 이유
//   그 창은 모양을 바꿀 수 없어서 "점수도 회수된다" 같은 설명을 제대로 보여주기 어렵고,
//   떠 있는 동안 페이지 전체가 멈춘다. 같은 자리에서 버튼이 바뀌는 쪽이 덜 놀랍다.
//
// 이 버튼을 화면에 그리는 것 자체는 보안이 아니다. 실제로 막는 건 actions.ts의 requireAdmin()이다.

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { IconTrash } from "@/app/_components/icons";

type Props = {
  /** 서버에서 실행될 삭제 함수 (app/admin/actions.ts) */
  action: (formData: FormData) => Promise<void>;
  id: string;
  what: "질문" | "답변";
  /** 질문 상세 화면에서 질문을 지울 때 "question" — 지운 뒤 목록으로 보낸다 */
  from?: "question";
};

export default function AdminDeleteButton({ action, id, what, from }: Props) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        className="btn-del"
        onClick={() => setConfirming(true)}
      >
        <IconTrash size={14} />
        {what} 삭제
      </button>
    );
  }

  return (
    <form action={action} className="del-confirm">
      <input type="hidden" name="id" value={id} />
      {from && <input type="hidden" name="from" value={from} />}

      {/* role="alert": 확인 문구가 나타나면 스크린 리더가 바로 읽어준다 */}
      <span className="del-warn" role="alert">
        {what === "질문"
          ? "답변까지 모두 지워지고, 그 답변들로 받은 점수도 회수됩니다."
          : "이 답변으로 받은 점수가 회수됩니다."}{" "}
        되돌릴 수 없습니다.
      </span>

      <ConfirmButton what={what} />

      {/* autoFocus: 버튼이 바뀌면서 키보드 초점이 사라지지 않게, "취소"로 옮긴다.
          실수로 Enter를 한 번 더 눌러도 지워지지 않는 쪽(취소)에 초점을 두는 게 안전하다 */}
      <button
        type="button"
        className="btn-ghost btn-sm"
        onClick={() => setConfirming(false)}
        autoFocus
      >
        취소
      </button>
    </form>
  );
}

// useFormStatus는 <form> 안쪽 컴포넌트에서만 쓸 수 있어서 따로 뗐다 (SubmitAnswerButton과 같은 이유)
function ConfirmButton({ what }: { what: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-danger btn-sm" disabled={pending}>
      {pending ? "지우는 중…" : `${what} 삭제`}
    </button>
  );
}
