// app/_components/MathText.tsx
//
// 수식이 섞인 본문을 그린다. (12차시)
//   <MathText text={question.body} className="q-detail-body" />
//
// ★ 서버에서 수식을 다 그려서 보낸다 (서버 컴포넌트).
//   그래서 질문을 보는 학생의 브라우저는 KaTeX 프로그램(수백 KB)을 받지 않는다.
//   받는 건 이미 그려진 HTML과 CSS·글꼴뿐이다. 휴대폰에서도 바로 보인다.
//
// 수식 글꼴은 CSS에 등록만 되어 있고, 브라우저는 실제로 그 글꼴이 필요한 글자를 그릴 때만 내려받는다.
// 수식이 없는 글에서는 글꼴을 받지 않는다.

import katex from "katex";
// katex-swap: 글꼴이 아직 안 왔을 때 수식을 숨기지 않고 기본 글꼴로 먼저 보여주는 판 (font-display: swap)
// 이 파일에서 CSS를 불러오므로, MathText를 쓰는 화면에만 KaTeX CSS가 붙는다
import "katex/dist/katex-swap.min.css";
import { renderMathNodes } from "./renderMath";

export default function MathText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  // 한 줄 수식($$)도 KaTeX가 <span>으로 만들기 때문에 <p> 안에 넣어도 HTML 규칙에 맞는다
  return <p className={className}>{renderMathNodes(text, katex)}</p>;
}
