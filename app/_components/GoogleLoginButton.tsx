// app/_components/GoogleLoginButton.tsx
//
// 로그인·회원가입 화면에서 같이 쓰는 "학교 계정으로 로그인" 버튼.
// 구글은 가입과 로그인을 구분하지 않아서 두 화면에 같은 버튼이 들어간다.

import { googleLoginAction } from "@/lib/auth-actions";

export default function GoogleLoginButton() {
  return (
    <form action={googleLoginAction}>
      <button type="submit" className="btn-google">
        {/* 구글 로고 */}
        <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.3 6.6v5.5h7c4.1-3.8 6.6-9.4 6.6-16.1z"
          />
          <path
            fill="#34A853"
            d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-7-5.5c-1.9 1.3-4.4 2.1-7.3 2.1-5.6 0-10.4-3.8-12.1-8.9H4.7v5.6C8.3 41.2 15.6 46 24 46z"
          />
          <path
            fill="#FBBC05"
            d="M11.9 28.5c-.4-1.3-.7-2.6-.7-4s.2-2.7.7-4v-5.6H4.7C3.2 17.8 2.4 20.8 2.4 24s.8 6.2 2.3 9.1l7.2-4.6z"
          />
          <path
            fill="#EA4335"
            d="M24 11.1c3.2 0 6 1.1 8.2 3.2l6.2-6.2C34.7 4.6 29.8 2.4 24 2.4 15.6 2.4 8.3 7.2 4.7 14.9l7.2 5.6c1.7-5.1 6.5-8.9 12.1-8.9z"
          />
        </svg>
        학교 계정으로 로그인
      </button>
    </form>
  );
}
