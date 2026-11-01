// lib/supabase/admin.ts
//
// ★ 서버 전용. RLS를 건너뛰는 Supabase 클라이언트.
//
// 왜 필요한가 (9차시)
//   답변 유형은 AI 판정을 거쳐서 정해져야 한다. 그런데 학생 계정이 answers에 직접 insert 할 수 있으면
//   브라우저에서 Supabase로 바로 { contrib_type: 'full' } 을 보내 AI를 건너뛸 수 있다.
//   그래서 schema-9에서 학생 계정의 insert 권한을 없앴고,
//   답변 저장은 서버만 가진 secret 키로만 한다. 그 키를 쓰는 클라이언트가 이것이다.
//
// ★ 이 키가 위험한 이유
//   secret 키(service_role)는 RLS를 통째로 무시한다. 새면 누구든 아무 데이터나 고칠 수 있다.
//   - 환경변수 이름에 NEXT_PUBLIC_ 을 절대 붙이지 않는다.
//     NEXT_PUBLIC_ 이 붙은 값만 브라우저 번들에 들어가고, 안 붙은 값은 서버에서만 읽힌다.
//   - RLS가 안 걸리므로 "누가 쓰는가(author_id)"는 이 클라이언트를 쓰는 쪽에서
//     반드시 로그인 정보(getCurrentUser)로 정해야 한다. 폼에서 받으면 안 된다.
//   - 그래서 이 클라이언트는 lib/data/answers.ts 의 createAnswer() 한 곳에서만 쓴다.

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  // 혹시라도 브라우저 쪽 코드에서 불리면 바로 멈춘다.
  // (환경변수가 비어 있어서 어차피 실패하지만, 원인을 분명히 알려주려고)
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient()는 서버에서만 쓸 수 있습니다.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SECRET_KEY 가 없습니다. Supabase 대시보드 → Project Settings → API Keys 의 " +
        "secret 키를 .env.local 과 Vercel 환경변수에 넣으세요. (NEXT_PUBLIC_ 을 붙이지 않는다)"
    );
  }

  return createClient(url, key, {
    // 로그인 세션을 저장하거나 갱신할 일이 없는 "기계용" 클라이언트라 꺼둔다
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
