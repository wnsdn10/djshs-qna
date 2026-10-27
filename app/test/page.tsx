// app/test/page.tsx  →  주소: /test
//
// lib/cohort.ts 가 제대로 동작하는지 눈으로 확인하는 임시 페이지.
// 8개가 전부 ✅ 가 되면 이 폴더는 지워도 된다.
//
// 이런 식으로 "맞아야 할 결과"를 먼저 적어두고 구현을 고쳐 나가는 방식을
// 테스트 주도 개발이라고 부른다. 콘솔에 찍어보며 고치는 것보다
// 빠뜨린 경우를 발견하기 쉽다.

import { parseSchoolEmail } from "@/lib/cohort";

type Case = {
  input: string;
  /** 기대하는 결과. null이면 "형식이 틀렸으니 거부해야 한다"는 뜻 */
  expected: { cohort: number; studentNo: number } | null;
  why: string;
};

const CASES: Case[] = [
  {
    input: "42th16@djshs.djsch.kr",
    expected: { cohort: 42, studentNo: 16 },
    why: "기본 형태",
  },
  {
    input: "43th7@djshs.djsch.kr",
    expected: { cohort: 43, studentNo: 7 },
    why: "번호가 한 자리",
  },
  {
    input: "42TH16@DJSHS.DJSCH.KR",
    expected: { cohort: 42, studentNo: 16 },
    why: "대문자로 입력해도 통과해야 한다",
  },
  {
    input: "  42th16@djshs.djsch.kr  ",
    expected: { cohort: 42, studentNo: 16 },
    why: "복사·붙여넣기로 공백이 섞여도 통과해야 한다",
  },
  {
    input: "42th16@gmail.com",
    expected: null,
    why: "학교 이메일이 아니므로 거부",
  },
  {
    input: "abc@djshs.djsch.kr",
    expected: null,
    why: "앞부분이 숫자th숫자 형식이 아니므로 거부",
  },
  {
    input: "42th@djshs.djsch.kr",
    expected: null,
    why: "번호가 없으므로 거부",
  },
  {
    input: "42th16@djshs.djsch.kr.evil.com",
    expected: null,
    why: "도메인 뒤에 뭔가 더 붙었으므로 거부 ($ 를 빼면 여기서 걸린다)",
  },
];

function show(v: { cohort: number; studentNo: number } | null) {
  return v === null ? "null" : `${v.cohort}기 ${v.studentNo}번`;
}

function same(
  a: { cohort: number; studentNo: number } | null,
  b: { cohort: number; studentNo: number } | null
) {
  if (a === null || b === null) return a === b;
  return a.cohort === b.cohort && a.studentNo === b.studentNo;
}

export const dynamic = "force-dynamic";

export default function TestPage() {
  const results = CASES.map((c) => {
    // 함수가 에러를 던져도 페이지가 통째로 죽지 않게 감싼다
    let actual: { cohort: number; studentNo: number } | null = null;
    let crashed = "";
    try {
      actual = parseSchoolEmail(c.input);
    } catch (e) {
      crashed = e instanceof Error ? e.message : String(e);
    }
    return { ...c, actual, crashed, pass: !crashed && same(actual, c.expected) };
  });

  const passed = results.filter((r) => r.pass).length;

  return (
    <>
      <h1>cohort.ts 테스트</h1>
      <p
        style={{
          fontWeight: 600,
          color: passed === results.length ? "#2e7d4f" : "#c0392b",
        }}
      >
        {passed} / {results.length} 통과
        {passed === results.length &&
          " — 전부 통과! app/test 폴더는 지워도 됩니다."}
      </p>

      <div className="tablewrap">
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.9rem" }}>
          <thead>
            <tr>
              <th style={th}></th>
              <th style={th}>입력</th>
              <th style={th}>기대</th>
              <th style={th}>실제</th>
              <th style={th}>이 경우를 확인하는 이유</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.input}>
                <td style={td}>{r.pass ? "✅" : "❌"}</td>
                <td style={td}>
                  <code>{JSON.stringify(r.input)}</code>
                </td>
                <td style={td}>{show(r.expected)}</td>
                <td style={td}>
                  {r.crashed ? `에러: ${r.crashed}` : show(r.actual)}
                </td>
                <td style={{ ...td, color: "#5b6b73" }}>{r.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.7rem",
  borderBottom: "1px solid #c6ced3",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.7rem",
  borderBottom: "1px solid #d8dcdf",
  verticalAlign: "top",
};
