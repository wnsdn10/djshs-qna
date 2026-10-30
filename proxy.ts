// proxy.ts  (프로젝트 루트. app 폴더 안이 아니다)
//
// ★ 파일 이름이 middleware.ts 가 아니라 proxy.ts 인 것에 주의.
//   Next.js 16부터 바뀌었다. 인터넷 예제와 AI가 알려주는 코드는 대부분
//   middleware 기준이라, "미들웨어가 안 먹는다"의 대부분이 이 이름 때문이다.
//
// 하는 일: 모든 요청이 화면에 닿기 "전에" 한 번 거쳐가면서 로그인 세션을 갱신한다.
//   로그인 토큰은 짧은 시간만 유효하고 주기적으로 새로 발급받아야 하는데,
//   그 갱신을 여기서 하고 새 쿠키를 응답에 실어 보낸다.
//   이게 없으면 토큰이 만료되는 순간 로그아웃된 것처럼 보인다.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // 설정이 없으면 그냥 통과시킨다. 여기서 에러를 던지면 모든 페이지가 죽는다.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 들어온 요청 쪽에도 반영하고
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // 나갈 응답 쪽에도 실어 보낸다 (브라우저가 저장하도록)
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // 이 한 줄이 토큰을 확인하고, 필요하면 갱신한다.
  // 결과를 쓰지 않아도 호출 자체에 의미가 있다.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 이미지·정적 파일 요청까지 거칠 필요는 없으므로 제외한다
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
