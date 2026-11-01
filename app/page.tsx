// app/page.tsx  →  주소: /
//
// 메인 화면. 예전에는 들어오자마자 /questions 로 보냈는데,
// 처음 온 학생에게 질문 목록부터 보여주면 "여기가 뭐 하는 곳인지, 나는 뭘 하면 되는지"를
// 알 수 없어서 부담스럽다. 그래서 첫 화면을 따로 만들었다.
//
// ★ 로그인 여부로 화면이 둘로 나뉜다
//   - 로그인 전: 소개 화면. 무슨 곳인지 → 어떻게 쓰는지 → 점수 → 선배 전용 → 로그인
//   - 로그인 후: 할 일 화면. 내 점수와 "답변을 기다리는 질문"을 바로 보여준다
//   이미 쓰는 법을 아는 사람에게 매번 소개를 보여주면 오히려 걸리적거린다.
//   대신 "이용 방법 다시 보기"를 접어서 남겨둔다.
//
// ★ 여기서는 requireUser()를 쓰지 않는다
//   requireUser()는 로그인 안 한 사람을 /login 으로 보내버린다.
//   메인 화면은 로그인 전에도 보여야 하므로 getCurrentUser()로 "누구인지(또는 아무도 아닌지)"만 확인한다.
//   proxy.ts는 세션만 갱신하고 아무도 다른 곳으로 보내지 않으므로 거기서 막히지도 않는다.

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import type { CurrentUser } from "@/lib/auth";
import { getWaitingQuestions } from "@/lib/data/questions";
import {
  CONTRIB_LABEL,
  CONTRIB_POINTS,
  CONTRIB_HELP,
  ACCEPT_POINTS,
} from "@/lib/data/answers";
import type { ContribType } from "@/lib/data/answers";
import GoogleLoginButton from "@/app/_components/GoogleLoginButton";
import QuestionCard from "@/app/questions/_components/QuestionCard";
import {
  IconMessage,
  IconPencil,
  IconCheckCircle,
  IconTrophy,
  IconLock,
  IconPlus,
  IconArrowRight,
  IconChevronDown,
  IconInbox,
} from "@/app/_components/icons";

// 로그인 상태와 질문 목록이 접속할 때마다 달라지므로 매번 새로 그린다
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  return user ? <MemberHome user={user} /> : <Welcome />;
}

// =================================================================
// 로그인 전 — 소개 화면
// =================================================================
function Welcome() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">대전동신과학고 학생 전용</p>
        <h1 id="hero-title" className="hero-title">
          막힌 문제, 혼자 붙잡고 있지 마세요
        </h1>
        <p className="hero-lead">
          같은 학교 학생끼리 묻고 답하는 곳입니다. 질문에는 이름 없이 기수만
          보이고, 답을 달면 기여 점수가 쌓입니다.
        </p>
        <div className="hero-cta">
          <GoogleLoginButton />
          <p className="hint">
            @djshs.djsch.kr 계정만 들어올 수 있습니다. 처음이라면 누르는 순간
            가입됩니다.
          </p>
        </div>
      </section>

      <HowItWorks />
      <PointsGuide />
      <SeniorNote />

      {/* 끝까지 읽은 사람이 다시 위로 올라가지 않아도 되게, 마지막에 한 번 더 둔다 */}
      <section className="home-sec home-final" aria-labelledby="final-title">
        <h2 id="final-title" className="home-sec-title">
          지금 답변을 기다리는 질문이 있습니다
        </h2>
        <p className="home-sec-lead">
          학교 계정으로 들어와서 아는 만큼만 보태 주세요.
        </p>
        <div className="hero-cta">
          <GoogleLoginButton />
        </div>
      </section>
    </>
  );
}

// =================================================================
// 로그인 후 — 할 일 화면
// =================================================================
async function MemberHome({ user }: { user: CurrentUser }) {
  // 3개만 미리 보여주고, 전체 개수는 문장에 쓴다
  const { questions, total } = await getWaitingQuestions(3);

  return (
    <>
      <section className="member-head" aria-labelledby="member-title">
        <div className="member-text">
          <p className="eyebrow">
            {user.cohort}기 {user.name}
          </p>
          <h1 id="member-title" className="member-title">
            {total > 0
              ? `답변을 기다리는 질문이 ${total}개 있습니다`
              : "지금은 모든 질문에 답변이 달려 있습니다"}
          </h1>
          <div className="member-actions">
            <Link href="/questions/new" className="btn">
              <IconPlus size={16} />
              질문하기
            </Link>
            <Link href="/questions" className="btn-ghost">
              질문 둘러보기
            </Link>
          </div>
        </div>

        {/* 점수 카드 전체가 링크다. 누르면 "왜 이 점수인지" 내역을 볼 수 있다 */}
        <Link href="/me" className="score-card">
          <span className="score-card-label">내 기여 점수</span>
          <span className="score-big">
            {user.totalScore}
            <span>점</span>
          </span>
          <span className="score-card-more">
            점수 내역
            <IconArrowRight size={14} />
          </span>
        </Link>
      </section>

      <section className="home-sec" aria-labelledby="waiting-title">
        <div className="sec-head">
          <h2 id="waiting-title" className="sec-title">
            오래 기다린 질문
          </h2>
          {total > questions.length && (
            <Link href="/questions" className="btn-plain">
              전체 {total}개 보기
              <IconArrowRight size={14} />
            </Link>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="empty-box">
            <IconInbox size={32} />
            <p>
              답변을 기다리는 질문이 없습니다.
              <br />
              막힌 게 있다면 먼저 질문해 보세요.
            </p>
          </div>
        ) : (
          <div className="q-list">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </section>

      {/* ★ <details>: 눌러서 펼치는 영역을 자바스크립트 없이 만드는 HTML 기본 요소.
          키보드(Enter/Space)와 스크린 리더 지원이 처음부터 들어 있어서 직접 만드는 것보다 안전하다.
          이미 쓰는 법을 아는 사람에겐 접혀 있고, 잊었을 때만 펼쳐 보면 된다. */}
      <details className="howto">
        <summary>
          이용 방법 다시 보기
          <IconChevronDown size={16} className="howto-chevron" />
        </summary>
        <HowItWorks />
        <PointsGuide />
        <SeniorNote />
      </details>
    </>
  );
}

// =================================================================
// 두 화면이 같이 쓰는 설명 블록
// =================================================================

const STEPS = [
  {
    Icon: IconMessage,
    title: "질문 올리기",
    desc: "막힌 부분을 올립니다. 질문에는 이름 없이 기수만 보입니다.",
  },
  {
    Icon: IconPencil,
    title: "답변 달기",
    desc: "아는 만큼만 적으면 됩니다. 자료 하나, 방향 한 줄도 답변입니다.",
  },
  {
    Icon: IconCheckCircle,
    title: "채택",
    desc: "질문한 사람이 가장 도움이 된 답변 하나를 고릅니다.",
  },
  {
    Icon: IconTrophy,
    title: "점수와 랭킹",
    desc: "답변과 채택으로 기여 점수가 쌓이고, 과목별 랭킹에 오릅니다.",
  },
];

function HowItWorks() {
  return (
    <section className="home-sec" aria-labelledby="how-title">
      <h2 id="how-title" className="home-sec-title">
        이렇게 씁니다
      </h2>
      {/* 순서가 있는 단계라서 <ol>을 쓴다. 스크린 리더가 "4개 중 1번째"처럼 읽어준다 */}
      <ol className="steps">
        {STEPS.map(({ Icon, title, desc }, i) => (
          <li key={title} className="step">
            <span className="step-icon">
              <Icon size={20} />
            </span>
            {/* <ol>이 이미 "몇 번째"를 읽어주므로, 눈에 보이는 번호는 스크린 리더에서 숨긴다 */}
            <span className="step-no" aria-hidden="true">
              {i + 1}
            </span>
            <h3 className="step-title">{title}</h3>
            <p className="step-desc">{desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const CONTRIB_ORDER: ContribType[] = ["info", "direction", "full"];

function PointsGuide() {
  return (
    <section className="home-sec" aria-labelledby="points-title">
      <h2 id="points-title" className="home-sec-title">
        완벽한 답이 아니어도 점수가 됩니다
      </h2>
      {/* ★ 이 문장이 메인 화면에서 가장 중요하다.
          "완벽하게 풀어줘야 답을 달 수 있다"고 생각하면 아무도 답을 안 단다.
          자료 하나만 알려줘도 점수가 된다는 걸 먼저 보여줘서 답변 부담을 낮춘다. */}
      <p className="home-sec-lead">
        참고 자료 하나만 알려줘도 {CONTRIB_POINTS.info}점입니다. 답변을 쓸 때
        내가 한 만큼 유형을 고르면 됩니다.
      </p>

      {/* 점수 숫자는 lib/data/answers.ts의 CONTRIB_POINTS에서 가져온다.
          화면에 숫자를 직접 적으면 DB 점수표가 바뀔 때 여기만 틀린 채로 남는다.
          (실제 점수 계산은 DB 트리거가 한다. 이 숫자는 "보여주기용"이다) */}
      <ul className="points">
        {CONTRIB_ORDER.map((t) => (
          <li key={t} className="point-card">
            <span className="point-num">+{CONTRIB_POINTS[t]}</span>
            <span className="point-name">{CONTRIB_LABEL[t]}</span>
            <span className="point-desc">{CONTRIB_HELP[t]}</span>
          </li>
        ))}
      </ul>
      <p className="points-note">
        <IconCheckCircle size={16} />
        {/* 글을 <span> 하나로 감싼다. flex 상자 안에서는 <b>가 따로 떨어진 칸이 되어
            문장이 세 토막으로 갈라지기 때문이다. */}
        <span>
          질문자가 내 답변을 채택하면 <b>+{ACCEPT_POINTS}점</b>이 더해집니다.
        </span>
      </p>
    </section>
  );
}

function SeniorNote() {
  return (
    <section className="home-sec" aria-labelledby="senior-title">
      <div className="callout">
        <span className="callout-icon">
          <IconLock size={20} />
        </span>
        <div>
          <h2 id="senior-title" className="callout-title">
            선배에게만 물어볼 수도 있습니다
          </h2>
          <p className="callout-desc">
            질문을 올릴 때 공개 범위를 &lsquo;선배에게만&rsquo;으로 고르면 나보다
            앞 기수에게만 보입니다. 같은 학년에게 묻기 망설여지는 질문에
            쓰세요.
          </p>
        </div>
      </div>
    </section>
  );
}
