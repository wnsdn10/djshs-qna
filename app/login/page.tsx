// app/login/page.tsx  →  주소: /login
//
// 로그인 방법이 구글 하나뿐이라 화면도 단순하다.
// 회원가입 화면이 따로 없다 — 처음 누르는 사람은 그 자리에서 계정이 만들어진다.

import GoogleLoginButton from "@/app/_components/GoogleLoginButton";

const ERROR_MESSAGE: Record<string, string> = {
  oauth: "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  domain: "학교 계정(@djshs.djsch.kr)으로만 로그인할 수 있습니다.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="login-box">
      <h1>로그인</h1>
      <p className="login-lead">
        학교 구글 계정으로 들어올 수 있습니다.
        <br />
        처음이라면 누르는 순간 가입됩니다.
      </p>

      {/* 계획서 스케치의 빨간 글씨 자리 */}
      {error && (
        <p className="form-error">
          {ERROR_MESSAGE[error] ?? "로그인하지 못했습니다."}
        </p>
      )}

      <GoogleLoginButton />

      <p className="hint">
        <strong>@djshs.djsch.kr</strong> 계정만 로그인할 수 있습니다.
      </p>
    </div>
  );
}
