// lib/math.ts
//
// 질문·답변 본문에서 LaTeX 수식 부분을 찾아낸다. (12차시)
//
//   $x^2$          → 문장 안 수식 (inline)
//   $$\int_0^1$$   → 따로 한 줄 수식 (display)
//   \$             → 수식이 아니라 그냥 $ 글자
//
// 이 파일은 "어디가 수식인가"만 정한다. 수식을 그림으로 바꾸는 건 KaTeX가 하고,
// 그 일은 app/_components/MathText.tsx(본문)와 MathTextarea.tsx(미리보기)가 한다.
// 두 곳이 같은 함수로 자르기 때문에, 미리보기에서 본 모양 그대로 등록된다.
//
// ★ $ 하나짜리가 어려운 이유
//   "사탕이 $3이고 과자가 $5" 처럼 수식이 아닌 $가 섞여 있을 수 있다.
//   그래서 Pandoc(문서 변환기)이 쓰는 규칙을 따른다:
//     - 여는 $ 바로 뒤에 공백이 오면 수식이 아니다       ("$ 3"  ✗)
//     - 닫는 $ 바로 앞에 공백이 오면 수식이 아니다       ("3 $"  ✗)
//     - 닫는 $ 바로 뒤에 숫자가 오면 수식이 아니다       ("$3이고 과자가 $5": 닫는 후보 $ 뒤가 5 → ✗)
//     - 한 줄 안에서 닫혀야 한다 (줄을 넘어가면 실수로 남은 $일 가능성이 크다)
//   여기에 우리 서비스용 규칙 하나를 더했다:
//     - $...$ 사이에 한글이 있으면 수식이 아니다 (\text{...}를 쓴 경우는 예외)
//       "가격은 $15였어요. 잘못 쓴 식: $\frac{1}{$" 를 시험해 보니 Pandoc 규칙만으로는
//       돈 표시 $와 수식의 $가 짝지어져 한국어 문장 전체가 수식으로 그려졌다.
//       수식 안에 한글이 들어가는 일은 거의 없으므로 이걸로 구분한다.
//   이 규칙에 안 맞으면 그 $는 그냥 글자로 남긴다. 수식을 못 알아보는 쪽이,
//   멀쩡한 문장을 수식으로 망가뜨리는 쪽보다 덜 나쁘다.

export type Segment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; display: boolean };

/**
 * KaTeX 설정. 본문과 미리보기가 같은 설정을 쓰도록 여기 한 곳에 둔다.
 * (KaTeX를 직접 import하지 않는 이유: 이 파일은 브라우저 쪽에서도 쓰는데,
 *  KaTeX는 크기가 커서 미리보기는 필요할 때만 따로 불러온다 — MathTextarea.tsx 참고)
 */
export const KATEX_OPTIONS = {
  // 문법이 틀려도 에러로 화면을 깨뜨리지 않고, 그 부분만 빨간 원문으로 보여준다
  throwOnError: false,
  // 빨강은 우리 디자인 토큰을 쓴다 (KaTeX 기본값은 #cc0000 고정색이라 다크 모드에서 안 맞는다)
  errorColor: "var(--danger)",
  // ★ 보안: \href{javascript:...} 같은 "링크·외부 자원" 명령을 막는다. 기본값이 false지만 일부러 적어 둔다.
  //   학생이 쓴 글이 다른 학생 화면에 그려지므로, 글 안의 명령이 브라우저에서 무언가를 실행하면 안 된다.
  trust: false,
  // 남이 쓴 수식이 화면을 망가뜨리지 않게 상한을 둔다
  //   maxSize: \rule{1000em}{...} 같은 거대한 도형 크기 제한 (em 단위)
  //   maxExpand: 매크로가 자기 자신을 계속 펼쳐서 서버를 붙잡는 것 제한
  maxSize: 20,
  maxExpand: 500,
  // 교과서에 없는 문법을 써도 경고 대신 그냥 그린다
  strict: "ignore" as const,
} as const;

/** 한 글이 수식으로 바뀌는 개수 상한. 수천 개를 붙여 서버를 느리게 만드는 걸 막는다 */
const MAX_MATH = 200;

export function splitMath(src: string): Segment[] {
  const out: Segment[] = [];
  let text = ""; // 아직 내보내지 않은 일반 글자
  let i = 0;
  let mathCount = 0;

  const flushText = () => {
    if (text) out.push({ type: "text", value: text });
    text = "";
  };

  while (i < src.length) {
    const ch = src[i];

    // \$ → 그냥 $ 글자
    if (ch === "\\" && src[i + 1] === "$") {
      text += "$";
      i += 2;
      continue;
    }

    if (ch === "$" && mathCount < MAX_MATH) {
      // $$ ... $$ (따로 한 줄 수식). 줄을 넘어가도 된다
      if (src[i + 1] === "$") {
        const end = findClose(src, i + 2, "$$", true);
        if (end !== -1) {
          const body = src.slice(i + 2, end).trim();
          if (body) {
            flushText();
            out.push({ type: "math", value: body, display: true });
            mathCount++;
            i = end + 2;
            continue;
          }
        }
      } else if (src[i + 1] !== undefined && !/\s/.test(src[i + 1])) {
        // $ ... $ (문장 안 수식). 여는 $ 바로 뒤가 공백이면 수식이 아니다
        const end = findInlineClose(src, i + 1);
        if (end !== -1 && !looksLikeSentence(src.slice(i + 1, end))) {
          flushText();
          out.push({ type: "math", value: src.slice(i + 1, end), display: false });
          mathCount++;
          i = end + 1;
          continue;
        }
      }
    }

    text += ch;
    i++;
  }
  flushText();

  return trimAroundDisplay(out);
}

/**
 * $$의 짝을 찾는다. 수식 안의 \$ 는 닫는 기호가 아니다.
 * 수식 안에서 \ 를 만나면 다음 글자를 건너뛴다 (\\ 도 한 덩어리로 넘어간다).
 */
function findClose(src: string, from: number, close: string, multiline: boolean): number {
  for (let j = from; j < src.length; j++) {
    if (src[j] === "\\") {
      j++;
      continue;
    }
    if (!multiline && src[j] === "\n") return -1;
    if (src.startsWith(close, j)) return j;
  }
  return -1;
}

/** $ 하나짜리의 짝. 위 Pandoc 규칙(앞 공백 ✗, 뒤 숫자 ✗, 한 줄 안)을 지킨다 */
function findInlineClose(src: string, from: number): number {
  for (let j = from; j < src.length; j++) {
    const c = src[j];
    if (c === "\\") {
      j++;
      continue;
    }
    if (c === "\n") return -1;
    if (c === "$") {
      const before = src[j - 1];
      const after = src[j + 1];
      if (/\s/.test(before)) continue; // "3 $" — 닫는 $ 앞이 공백이면 닫는 기호가 아니다
      if (after !== undefined && /[0-9]/.test(after)) continue; // "$5" — 다음 $의 여는 기호일 가능성
      return j;
    }
  }
  return -1;
}

/** 한글이 섞여 있으면 수식이 아니라 문장일 가능성이 크다. \text{...} 안의 한글은 수식의 일부로 본다 */
function looksLikeSentence(inner: string): boolean {
  return /[가-힣]/.test(inner) && !inner.includes("\\text");
}

/**
 * 따로 한 줄 수식($$) 앞뒤의 줄바꿈 하나씩을 없앤다.
 *
 * 학생은 보통 이렇게 쓴다:
 *     식을 세우면
 *     $$x^2 + 1$$
 *     이 된다
 * 본문은 줄바꿈을 그대로 보여주는데(white-space: pre-wrap), 한 줄 수식은 그 자체로 위아래 여백이 있다.
 * 줄바꿈까지 그대로 두면 수식 위아래에 빈 줄이 하나씩 더 생겨 보인다.
 */
function trimAroundDisplay(segs: Segment[]): Segment[] {
  return segs
    .map((s, k) => {
      if (s.type !== "text") return s;
      let v = s.value;
      const prev = segs[k - 1];
      const next = segs[k + 1];
      if (prev?.type === "math" && prev.display) v = v.replace(/^\r?\n/, "");
      if (next?.type === "math" && next.display) v = v.replace(/\r?\n$/, "");
      return { ...s, value: v };
    })
    .filter((s) => s.type !== "text" || s.value !== "");
}
