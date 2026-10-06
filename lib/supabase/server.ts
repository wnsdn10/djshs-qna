// lib/supabase/server.ts
//
// Supabase에 접속하는 클라이언트를 만든다.
//
// 5차시에는 읽고 쓰기만 하므로 이 하나면 충분하다.
// 6차시에 로그인을 붙이면 "누가 접속했는지"를 쿠키로 알아내야 해서
// @supabase/ssr 패키지와 서버용·브라우저용 클라이언트가 따로 필요해진다.

import { createClient } from "@supabase/supabase-js";

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // 환경변수가 없으면 여기서 분명한 메시지로 멈춘다.
  // 이게 없으면 나중에 엉뚱한 곳에서 "undefined" 관련 에러가 나서 원인 찾기가 어렵다.
  if (!url || !key) {
    throw new Error(
      "Supabase 설정이 없습니다. 프로젝트 루트의 .env.local에 " +
        "NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 넣고, " +
        "npm run dev 를 껐다 켜세요. (.env.local은 서버가 시작할 때 한 번만 읽습니다)"
    );
  }

  return createClient(url, key);
}
