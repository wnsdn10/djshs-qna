// app/_components/renderMath.tsx
//
// splitMath()로 자른 조각을 React 요소로 바꾼다. (12차시)
// 본문(MathText, 서버)과 미리보기(MathTextarea, 브라우저) 둘 다 이 함수를 쓴다.
// 그래서 "미리보기에서 본 모양 = 등록 후 모양"이 보장된다.
//
// KaTeX를 직접 import하지 않고 인자로 받는다.
//   서버 쪽은 처음부터 불러 두고, 브라우저 쪽은 수식을 쓰기 시작할 때만 내려받기 때문이다.

import { Fragment, type ReactNode } from "react";
import { splitMath, KATEX_OPTIONS } from "@/lib/math";

/** KaTeX에서 우리가 쓰는 함수 하나만 정의한 모양 */
type Katex = {
  renderToString: (tex: string, options: object) => string;
};

export function renderMathNodes(text: string, katex: Katex): ReactNode[] {
  return splitMath(text).map((seg, i) => {
    if (seg.type === "text") {
      // ★ 일반 글자는 React가 그대로 글자로 넣는다 (<b> 같은 걸 써도 태그가 아니라 글자로 보인다).
      return <Fragment key={i}>{seg.value}</Fragment>;
    }

    // ★ 수식만 dangerouslySetInnerHTML 로 넣는다.
    //   이름 그대로 "위험한" 방법이다. 넣는 HTML을 브라우저가 그대로 해석하기 때문이다.
    //   여기서 써도 되는 이유: 넣는 것이 학생의 글이 아니라 KaTeX가 "만든" HTML이고,
    //   KaTeX는 수식 안의 < > & 를 전부 글자로 바꾸고(escape),
    //   trust: false 라서 링크·스크립트를 만드는 명령은 거부한다 (lib/math.ts의 KATEX_OPTIONS).
    //   시험: "$<img src=x onerror=alert(1)>$" → 태그가 아니라 글자로 그려지는 것을 확인했다.
    const html = katex.renderToString(seg.value, {
      ...KATEX_OPTIONS,
      displayMode: seg.display,
    });

    return (
      <span
        key={i}
        // 한 줄 수식에만 클래스를 붙인다 (좌우 스크롤용). 문장 안 수식은 KaTeX 기본 모양 그대로
        className={seg.display ? "math-display" : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });
}
