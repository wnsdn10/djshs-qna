// lib/cohort.ts
//
// 학교 이메일에서 기수와 번호를 뽑아내는 함수.
//
// 계획서 6번에서 "한 줄씩 읽고 왜 그렇게 동작하는지 설명할 수 있게 되고 싶다"고
// 적은 두 곳 중 첫 번째다. 아래 주석은 그 설명이다.

export type SchoolEmailInfo = {
  cohort: number; // 기수.  42th16 → 42
  studentNo: number; // 번호.  42th16 → 16
};

// 이메일이 맞춰야 할 모양.
//
//   ^            문자열의 시작
//   (\d+)        숫자 하나 이상 → 괄호로 묶었으니 나중에 꺼내 쓸 1번 그룹 (기수)
//   th           글자 그대로 "th"
//   (\d+)        숫자 하나 이상 → 2번 그룹 (번호)
//   @djshs       글자 그대로
//   \.           점 하나. 정규식에서 그냥 . 은 "아무 글자나 하나"라는 뜻이라
//                글자 그대로의 점을 쓰려면 앞에 \ 를 붙여 뜻을 막아야 한다
//   djsch\.kr
//   $            문자열의 끝
//
// ★ ^ 와 $ 가 핵심이다.
//   이게 없으면 정규식은 "어딘가에 이런 부분이 있으면 통과"로 동작한다.
//   그러면 42th16@djshs.djsch.kr.evil.com 같은 주소도 통과해 버린다.
//   앞뒤를 묶어야 "문자열 전체가 정확히 이 모양"이라는 뜻이 된다.
const SCHOOL_EMAIL = /^(\d+)th(\d+)@djshs\.djsch\.kr$/;

/**
 * 학교 이메일에서 기수와 번호를 뽑아낸다.
 * 형식이 맞지 않으면 null을 돌려준다.
 */
export function parseSchoolEmail(email: string): SchoolEmailInfo | null {
  // 1) 입력을 다듬는다.
  //    trim()        — 복사·붙여넣기로 앞뒤에 붙은 공백을 없앤다.
  //                    공백이 남아 있으면 ^ 바로 뒤가 공백이라 정규식이 어긋난다.
  //    toLowerCase() — 42TH16@DJSHS... 처럼 대문자로 쳐도 통과시키기 위해.
  //                    정규식에 i 옵션을 주는 방법도 있지만, 이렇게 해두면
  //                    아래에서 돌려주는 값도 소문자로 통일되어 DB에 넣기 좋다.
  const normalized = email.trim().toLowerCase();

  // 2) 모양이 맞는지 검사하면서 숫자 두 개를 꺼낸다.
  //    exec()는 안 맞으면 null, 맞으면 배열을 돌려준다.
  //      matched[0] = "42th16@djshs.djsch.kr"  (전체)
  //      matched[1] = "42"                     (1번 그룹)
  //      matched[2] = "16"                     (2번 그룹)
  const matched = SCHOOL_EMAIL.exec(normalized);

  // 3) 안 맞으면 "값이 없음"을 뜻하는 null.
  //    0이나 -1 같은 숫자를 돌려주면 부르는 쪽에서 그게 진짜 기수인지
  //    실패 표시인지 구분할 수 없다.
  if (matched === null) return null;

  // 4) 꺼낸 값은 문자열이므로 숫자로 바꾼다.
  //    "07" → 7 로 정리되는 것도 Number()가 해준다.
  return {
    cohort: Number(matched[1]),
    studentNo: Number(matched[2]),
  };
}
