"use client";
//
// app/_components/MathTextarea.tsx
//
// 수식을 쓸 수 있는 입력칸 + 미리보기. (12차시)
// 질문 작성(new/page.tsx)과 답변 작성(AnswerForm.tsx)의 <textarea>를 이걸로 바꿨다.
//
// ★ 왜 미리보기가 있나
//   LaTeX는 괄호 하나만 빠져도 안 그려진다. 답변은 등록하면 고칠 수 없고 AI 판정까지 받으므로,
//   등록 "전에" 어떻게 보일지 확인할 수 있어야 한다.
//
// ★ KaTeX를 "필요할 때만" 내려받는다 (dynamic import)
//   import katex from "katex" 를 맨 위에 쓰면, 수식을 안 쓰는 학생도 이 화면을 열 때마다
//   KaTeX 프로그램을 통째로 내려받는다. 대신 글에 $가 처음 나타나는 순간 import("katex")로 불러온다.
//   한 번 불러오면 브라우저가 기억하므로 두 번째부터는 기다리지 않는다.

import { useEffect, useState, type ReactNode } from "react";
import "katex/dist/katex-swap.min.css";
import { renderMathNodes } from "./renderMath";

type Props = {
  id: string;
  name: string;
  rows?: number;
  required?: boolean;
};

export default function MathTextarea({ id, name, rows = 6, required }: Props) {
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState<ReactNode[] | null>(null);

  // $가 하나라도 있을 때만 미리보기를 만든다
  const hasMath = value.includes("$");

  useEffect(() => {
    if (!hasMath) {
      setPreview(null);
      return;
    }

    // ★ 글자를 칠 때마다 바로 그리지 않고, 0.2초 동안 더 안 치면 그린다 (debounce).
    //   한 글자마다 수식을 다시 계산하면 긴 글에서 입력이 버벅인다.
    let cancelled = false;
    const timer = setTimeout(async () => {
      const katex = (await import("katex")).default;
      // 기다리는 사이에 글이 또 바뀌었으면 이 결과는 버린다 (늦게 온 옛 결과가 새 결과를 덮지 않게)
      if (!cancelled) setPreview(renderMathNodes(value, katex));
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, hasMath]);

  return (
    <>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-describedby={`${id}-math-help`}
      />
      <p id={`${id}-math-help`} className="field-help math-help">
        수식은 <code>$x^2$</code> (문장 안), <code>$$\int_0^1 x\,dx$$</code> (따로 한 줄)처럼
        씁니다. $ 글자 자체는 <code>\$</code>.
      </p>

      {hasMath && (
        <div className="math-preview">
          <span className="math-preview-label">미리보기</span>
          {/* 본문과 같은 모양(.answer-body)으로 그려서 등록 후 모습과 같게 한다 */}
          <p className="answer-body">{preview ?? "수식을 불러오는 중…"}</p>
        </div>
      )}
    </>
  );
}
