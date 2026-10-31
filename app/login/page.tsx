// app/login/page.tsx  →  주소: /login

import GoogleLoginButton from "@/app/_components/GoogleLoginButton";
import { IconAlert } from "@/app/_components/icons";

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
      <h1>상호 협력 학습 지원 시스템</h1>
      <p className="login-lead">
        학교 구글 계정으로 들어올 수 있습니다.
        <br />
        처음이라면 누르는 순간 가입됩니다.
      </p>

      {error && (
        <p className="form-error" role="alert" style={{ textAlign: "left" }}>
          <IconAlert size={16} />
          {ERROR_MESSAGE[error] ?? "로그인하지 못했습니다."}
        </p>
      )}

      <GoogleLoginButton />

      <p className="hint">@djshs.djsch.kr 계정만 로그인할 수 있습니다.</p>
    </div>
  );
}
