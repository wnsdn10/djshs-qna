// app/questions/[id]/page.tsx  →  주소: /questions/1, /questions/2 ...
//
// 폴더 이름의 대괄호는 오타가 아니다. "여기 자리에 아무 값이나 들어온다"는 표기법이라
// 질문 하나하나가 각자의 주소를 갖게 된다.
// 그 값(id)을 실제로 꺼내 쓰는 건 3차시에 한다.

export default function QuestionDetailPage() {
  return <h1>질문 상세</h1>;
}
