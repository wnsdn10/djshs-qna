// lib/supabase/server.ts
//
// 서버에서 쓰는 Supabase 클라이언트.
//
// 5차시에는 그냥 createClient 하나였는데, 6차시부터 달라진다.
// 로그인 상태는 "쿠키"에 담겨 브라우저와 서버를 오간다.
// 서버는 그 쿠키를 직접 꺼내서 Supabase에게 넘겨줘야 "누가 접속했는지" 알 수 있다.
// 그 연결을 해주는 게 @supabase/ssr 의 createServerClient 다.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 설정이 없습니다. 프로젝트 루트의 .env.local에 " +
        "NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 넣고, " +
        "npm run dev 를 껐다 켜세요."
    );
  }

  // ★ cookies()도 Promise다. params·searchParams와 같은 Next.js 16 규칙.
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      // Supabase가 "지금 쿠키 뭐 있어?"라고 물을 때 답해준다
      getAll() {
        return cookieStore.getAll();
      },
      // Supabase가 "이 쿠키로 바꿔줘"라고 할 때 (로그인·토큰 갱신 시)
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다(화면을 그리는 중이라 이미 늦었다).
          // 그래도 괜찮은 이유: proxy.ts가 매 요청의 "입구"에서 세션을 갱신해 두기 때문이다.
          // 이 catch를 비워두는 게 맞고, 그래서 proxy.ts가 없으면 로그인이 안 풀린다.
        }
      },
    },
  });
}
