// app/page.tsx  →  주소: /
// 이 서비스는 첫 화면이 곧 질문 목록이므로, 홈에 오면 바로 그리로 보낸다.

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/questions");
}
