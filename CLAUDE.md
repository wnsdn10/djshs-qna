@AGENTS.md

# 상호 협력 학습 지원 시스템 (djshs-qna)

대전동신과학고 교내 Q&A 서비스. 학교 구글 계정으로 로그인해서 질문을 올리고,
서로 답변하고, 기여 점수를 쌓는다. 학교 정보과학 수업 프로젝트.

- 만든 사람: 김준우 (42기 2505, `42th2505@djshs.djsch.kr`)
- 저장소: `github.com/wnsdn10/djshs-qna`
- 배포: `https://djshs-qna.vercel.app`
- Supabase 프로젝트 ref: `uruhiqflgsqgraljkiud`
- 로컬 경로: `C:\dev\djshs-qna`

---

## ⚠️ 이 프로젝트에서 가장 중요한 것

**이건 학습 과제다. 돌아가는 코드보다 "왜 이렇게 했는지 설명할 수 있는 코드"가 중요하다.**

계획서에 이렇게 적혀 있다:

> AI가 써 준 코드라도 한 줄씩 읽고 이해해서 설명할 수 있게 한다.

특히 두 군데는 발표·보고서에서 직접 설명해야 한다:

1. **이메일에서 기수를 뽑아내는 부분** → `lib/cohort.ts`
2. **기여 점수를 계산하는 부분** → `docs/schema-7-answers.sql`의 트리거 3개

그래서:

- 코드를 쓸 때 **한국어 주석으로 "왜"를 남긴다.** "무엇을 하는지"는 코드가 이미 말한다.
- 새 개념(Server Action, RLS, 트리거 같은 것)을 처음 쓸 때는 **짧게라도 설명을 덧붙인다.**
- 설명 없이 라이브러리를 추가하거나 추상화를 늘리지 않는다. 의존성은 최소로.
- 주석에 **틀린 말을 쓰지 않는다.** 전에 "`await` 없이 `params.id`를 읽으면 `undefined`가 나온다"고 썼는데 실제로는 **에러가 난다**. 이런 건 잘못 배우게 만든다. 확신 없으면 확인하고 쓴다.

### 설명할 때

- 길게 늘어놓지 말고 결론부터. 사용자가 "그래서 뭐 어쩌라고"라고 하면 너무 길었던 거다.
- 선택지를 나열하고 고르라고 하기보다, 근거를 대고 결정한 다음 진행한다.
- 틀렸으면 **틀렸다고 분명히 말한다.** 얼버무리지 않는다. 전에 "push는 안 꼬였어"라고 잘못 말했다가
  사용자 직감이 맞았던 적이 있다.

---

## 역할 분담 (사용자가 정한 규칙)

> "폴더 안의 파일을 지우고, 수정하고, 만드는 건 너가 할 수 있잖아.
> 너가 못하는 git 관련된것만 내가 할게."

| 누가 | 무엇을 |
|---|---|
| **Claude** | 파일 생성·수정·삭제, 브라우저로 Supabase/Vercel/Google Cloud 설정, 화면 확인 |
| **사용자** | `git add/commit/push`, `npm run dev` / `npm run build` 실행, DB에 SQL 실행 |

브라우저 작업도 Claude가 직접 한다 — 사용자는 옆에서 보면서 검토한다.
사이트 승인 요청은 그냥 호출하면 자동으로 승인된다. 망설이지 말고 진행할 것.

### 파일을 디스크에 쓰는 방법

`SendUserFile`로 보내면 데스크톱 앱이 그 사본을 **`C:\dev\djshs-qna\Claude outputs\`에 자동 저장**한다.
그 폴더는 프로젝트 안이라서 `tsc`가 복사본까지 타입 검사하고, 상대 경로 import가 깨져서
`TS2307 Cannot find module`로 빌드가 실패한다. 실제로 한 번 당했다.

**그래서 `SendUserFile`을 거치지 말고 이렇게 한다:**

```
1. /mnt/user-data/outputs/commit/ 에 파일을 복사 (이름이 겹치면 구분되게 바꿔서)
2. device_commit_files 에 stagedPath 로 넘긴다
```

`.gitignore`에 `/Claude outputs/`를 넣어두긴 했지만, 애초에 안 만드는 게 맞다.

### 쓸 수 없는 도구

- `device_bash` **없음.** 사용자 컴퓨터에서 명령을 못 돌린다. 파일 내용을 확인하려면
  `device_stage_files`로 가져와서 읽어야 한다.
- 따라서 `npm run build` / `git` / `npm run dev`는 **전부 사용자가 돌린다.**
- 컨테이너의 `/home/claude/proj`는 **부분 사본이고 오래됐을 수 있다.** `node_modules`도 `package.json`도 없어서
  여기서는 빌드가 안 된다. 중요한 파일은 디스크에서 다시 가져와 확인할 것.

---

## 기술 스택

Next.js 16.3.4 (App Router, Turbopack) · React 19.2 · TypeScript · Supabase (Postgres + Auth) · Vercel

### Next.js 16에서 바뀐 것 (training data와 다름)

| 항목 | 내용 |
|---|---|
| `middleware.ts` | **`proxy.ts`로 이름이 바뀜.** 함수 이름도 `proxy`여야 한다. 프로젝트 루트에 있음 |
| `params`, `searchParams` | **Promise다.** `const { id } = await params;` |
| `cookies()` | Promise다. `await cookies()` |
| `cacheTag` / `updateTag` | `cacheComponents` 플래그가 필요해서 **안 쓴다.** `revalidatePath`로 충분 |

`'use server'` 파일에서는 **async 함수만 export할 수 있다.** 상수를 export하면 빌드가 깨진다.
`lib/auth-actions.ts`의 `SCHOOL_DOMAIN`에 `export`가 없는 이유다. 실제로 이것 때문에
연쇄 에러 3개를 겪었다.

---

## 폴더 구조

```
proxy.ts                      세션 갱신 (Next 16: middleware 아님)
vercel.json                   { "regions": ["icn1"] } — 서울 리전
app/
  layout.tsx                  헤더 + 점수 pill + skip-link + 폰트
  globals.css                 디자인 토큰 전부. 라이트/다크
  error.tsx  loading.tsx
  _components/
    icons.tsx                 인라인 SVG 10개 (currentColor, aria-hidden)
    GoogleLoginButton.tsx
  login/page.tsx
  questions/
    page.tsx                  목록 (requireUser)
    _components/QuestionCard.tsx   data-status 로 색 막대·배지
    _components/QuestionList.tsx   검색 + 태그 필터 (클라이언트)
    new/page.tsx  new/actions.ts
    [id]/page.tsx  [id]/actions.ts
    [id]/_components/AnswerForm.tsx
  ranking/page.tsx            전체 + 과목별 (?subject=)
  me/page.tsx                 내 질문·답변·점수 내역
  auth/callback/route.ts      OAuth 콜백 + 도메인 2차 확인
  test/page.tsx               cohort 파싱 검증용 (8/8 통과). 보고서 쓰고 지워도 됨
lib/
  cohort.ts                   parseSchoolEmail — ★ 설명 대상
  auth.ts                     getCurrentUser (React cache()), requireUser
  auth-actions.ts             googleLoginAction, logoutAction
  supabase/server.ts          createClient (@supabase/ssr)
  data/
    questions.ts              getQuestions, getQuestion, createQuestion
    answers.ts                getAnswers, createAnswer, acceptAnswer, CONTRIB_POINTS
    ranking.ts                getOverallRanking, getSubjectRanking, getMy*
docs/
  schema.sql  schema-6-auth.sql  schema-7-answers.sql  schema-8-rls.sql  schema-9-ai-judge.sql
lib/ai/judge.ts               Gemini 답변 유형 판정 (fetch, Interactions API)
lib/supabase/admin.ts         secret 키 클라이언트 — createAnswer() 한 곳에서만
design-system/djshs-qna/MASTER.md   ui-ux-pro-max 추천 중 채택·거절 근거
ROADMAP.md                    8차시 전체 계획 + 에러 사례 모음 (785줄 이상)
```

### 설계 결정 C — 데이터 계층 분리 (이 프로젝트의 핵심)

`lib/data/*.ts`의 **함수 시그니처는 고정**이고, 안쪽 구현만 바뀐다.

3차시에는 배열(목데이터)을 돌려줬고, 5차시에 Supabase로 바꿨는데
**화면 코드는 한 줄도 안 고쳤다.** 이게 보고서에 쓸 만한 포인트다.

새 기능을 넣을 때도 이 경계를 지킨다. 화면 컴포넌트에서 `supabase.from(...)`을 직접 부르지 않는다.

---

## 보안: 3겹으로 막는다 (계속 반복되는 주제)

| 겹 | 수단 | 역할 |
|---|---|---|
| 1 | HTML `required`, 라디오 기본값 | 실수 방지 (사용자 편의) |
| 2 | Server Action 안의 검사 | 일반적인 잘못된 요청 차단 |
| 3 | **DB: RLS · 제약 · 트리거** | **진짜 방어선** |

**화면은 "보여주는" 곳이지 "막는" 곳이 아니다.** 목록에서 걸러내도
브라우저 개발자 도구로 Supabase에 직접 요청하면 다 받아올 수 있다.
`anon` 키는 클라이언트 번들에 들어있어서 누구나 볼 수 있다.

예시:
- 도메인 검사: 콜백에서 한 번 + `handle_new_user()` 트리거에서 exception (auth.users insert 자체가 취소됨)
- 채택 권한: 화면에서 버튼 숨김 + action에서 확인 + RLS `answers_update_by_question_author`
- 중복 채택: `create unique index ... on answers (question_id) where is_accepted;`
- 점수: **앱 코드에서 절대 더하지 않는다.** 트리거만 쓴다
- 답변 유형(9차시): 학생 계정은 answers insert 권한이 **없다.** Server Action이 Gemini 판정 후
  secret 키로 저장. 최종 = min(본인 선택, AI 판정), AI 실패 시 info. 같은 규칙이 DB check 제약에도 있음.
  secret 키는 RLS를 건너뛰므로 `author_id`는 반드시 `getCurrentUser()`에서, 질문 접근권은 `getQuestion()`(RLS)으로 확인
- 채택 시 질문 작성자가 바꿀 수 있는 칸은 `is_accepted` 하나 (열 단위 권한, schema-9)
- 채택은 되돌릴 수 없다 (RLS `with check (is_accepted ...)`, schema-9). 풀었다 다시 채택하면
  트리거 ②가 +5를 반복 적립하던 구멍 — 시험 DB에서 3번 반복에 9→29점 확인 후 막음

### 점수 트리거 3개 (연쇄)

`on_answer_created` → `on_answer_accepted` → `on_score_logged`

점수표는 `contrib_points(kind)` 하나뿐: 자료 제보 1 · 방향 제시 3 · 전체 답변 8 · 채택 +5.
같은 숫자가 앱과 DB 양쪽에 있으면 반드시 어긋난다. DB가 기준이고
`lib/data/answers.ts`의 `CONTRIB_POINTS`는 **표시용**이다.

### 기수 비교 — 부등호 방향 주의

**숫자가 작을수록 선배다.** 42기가 43기의 선배.
그래서 "내가 선배"는 `me.cohort < questions.author_cohort`.
반대로 쓰면 후배에게 열리는 정반대 결과가 된다.

---

## 🔴 지금 당장 해야 할 일 (미완료)

### 1. `docs/schema-9-ai-judge.sql` 실행 + 환경변수 3개 — 최우선

schema-8은 2026-10-31에 실행 완료.

9차시 코드는 **schema-9를 실행하기 전에 배포하면 답변 등록이 깨진다** (`claimed_type` 칸이 없음).
순서: 환경변수 → SQL 실행 → 빌드 → 푸시.

| 변수 | 어디서 | 비고 |
|---|---|---|
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → secret | **NEXT_PUBLIC_ 금지** |
| `GEMINI_API_KEY` | Google AI Studio | |
| `GEMINI_MODEL` (선택) | 없으면 `gemini-3.5-flash-lite` | 모델 종료되면 이것만 바꾸면 됨 |

키 값은 사용자가 직접 입력한다 (Claude는 키를 보거나 입력하지 않는다).

schema-9는 로컬 Postgres 16에서 7·8·9 순서로 실행해 검증함: 학생 직접 insert 거부,
제약 3개가 잘못된 유형 거부, 질문 작성자는 is_accepted만 수정 가능, 점수 3+1+5=9 정상.
Gemini 실제 호출은 키가 없어 못 해봤다 — 응답 모양(`steps[].content[].text`)은 문서 기준.
첫 답변 등록 때 서버 로그에 `[judgeAnswer]` 오류가 없는지 볼 것.

### 2. 커밋·푸시 안 된 변경

11차시(메인 화면 + 디자인) 14개 파일, 9차시 AI 판정 파일들이 디스크에만 있을 수 있다.
`git status`로 확인 후 `npm run build` → 푸시.

### 3. 남은 것

- 다른 기수 계정으로 **선배 전용 질문 RLS 실제 검증**
- `ROADMAP.md`는 최신이지만 **HTML 아티팩트 버전이 6·7·8차시 + 성능 + 디자인만큼 뒤처져 있음**
- 7차시 이해 확인 질문 2개가 아직 답 안 됨:
  - (a) 채택 트리거에서 `if new.is_accepted and not old.is_accepted`를 빼면 뭐가 깨지나?
  - (b) 점수를 앱 코드에서도 더하면 왜 안 되나?
- 결과 보고서 자료 정리

---

## 작업 습관

### 커밋 전에 반드시

```
npm run build
```

`npm run dev`가 통과해도 빌드는 깨질 수 있다. dev는 쓰이는 파일만 따라가지만
`next build`는 `tsconfig` 범위의 `.tsx`를 **전부** 타입 검사한다.
실제로 `await`를 뺀 코드가 dev에서 멀쩡했는데 Vercel에서 실패했다.

### 정적 점검 3종 (디자인·구조를 건드렸다면)

린터가 안 잡아주는 영역이다. TypeScript는 CSS 클래스 이름이 문자열이라 오타를 모르고,
CSS는 잘못된 값을 **에러 없이 조용히 버린다.**

1. `icons.tsx`의 export ↔ 각 파일의 import 대조
2. TSX의 `className` ↔ CSS에 정의된 선택자 대조
3. `var(--x)` ↔ `--x:` 정의 대조, 중괄호 개수 짝 맞추기

이걸로 실제로 잡은 것: `--ease: cubic-bezier(0.２, ...)` (전각 숫자 → transition 전부 무효),
`--line`/`--r-md` (존재하지 않는 토큰 이름), 정의 안 된 `.tablewrap`.

### 대비(contrast)는 눈으로 보지 말고 계산한다

다크 모드 `--success-soft`가 `#11312220` (8자리 = 알파 12.5%)이라
"해결됨" 배지 배경이 사실상 안 보였다. 눈으로는 "좀 연하네" 정도로 넘어갔을 것이다.
계산하니 1.75:1로 명백한 실패였다.

현재 전 토큰 쌍이 라이트·다크 모두 **4.5:1 이상** (최저 4.61:1, `muted` on `primary-soft`).

---

## 디자인 시스템

`app/globals.css`의 토큰만 고치면 전체가 바뀐다. 컴포넌트 CSS에 색을 직접 쓰지 않는다.
다크 모드는 `@media (prefers-color-scheme: dark)`에서 **토큰 값만 교체**한다.

### 색의 의미 (섞지 말 것)

| 색 | 토큰 | 뜻 |
|---|---|---|
| 청록 | `--primary` | 링크 · 버튼 · "답변 있음" |
| 초록 | `--success` | "해결됨" · 채택된 답변 |
| 호박 | `--score` | 점수 · "답변 기다리는 중" |
| 빨강 | `--danger` | **진짜 오류일 때만** (입력 오류, 화면 로드 실패) |

"답변 기다리는 중"을 빨강으로 썼다가 호박색으로 바꿨다.
답변이 없는 건 에러가 아니라 **점수를 받을 수 있는 자리**다.
상호 협력을 북돋우는 게 이 서비스의 목적이라 이 구분이 중요하다.

### 기타

- 글꼴: IBM Plex Sans KR / IBM Plex Mono (Google Fonts)
- 터치 영역 44px · `:focus-visible` · `prefers-reduced-motion` · 점수는 `tabular-nums`
- 질문 카드는 `data-status` 속성으로 왼쪽 색 막대와 배지를 함께 제어한다

---

## 성능

느리다는 얘기가 나오면 **추측하지 말고 네트워크 패널을 먼저 본다.**
전에 그렇게 해서 prefetch 요청 5개가 원인인 걸 찾았다.

- `getCurrentUser`는 React `cache()`로 감싸 요청당 1회만 실행
- 한 화면에서 여러 데이터가 필요하면 `Promise.all` (`await`를 줄줄이 쓰면 대기가 쌓인다)
- `vercel.json`의 `icn1` (서울) — Supabase와 가까워야 왕복이 짧다

---

## 자주 겪은 에러

| 증상 | 원인 |
|---|---|
| `TS2307 Cannot find module` + 경로에 `Claude outputs/` | 위 "파일을 디스크에 쓰는 방법" 참고 |
| `Only async functions are allowed in "use server"` | `'use server'` 파일에서 상수 export |
| `Property 'id' does not exist on type 'Promise<...>'` | `await params` 빠짐 |
| Vercel 500 / "This page couldn't load" | 환경변수 누락, 또는 **Supabase 프로젝트 일시정지** (무료 플랜은 1주쯤 방치하면 멈춤) |
| HTTP 431 | 쿠키가 쌓여 헤더 초과 → Clear site data |
| `Could not find the function public.xxx` | 해당 SQL 파일을 DB에서 실행 안 함 |
| Postgres uuid 형식 오류 | `getQuestion()`의 `UUID_RE` 가드로 막음 |
| 답변이 전부 "자료 제보"로 기록됨 + "판정을 받지 못해" | Gemini 실패. 서버 로그 `[judgeAnswer]` 확인 (키 누락·429 한도·404 모델 종료) |
| `permission denied for table answers` | 학생 계정 클라이언트로 answers insert 시도. 저장은 `createAdminClient()`로 |
| `SUPABASE_SECRET_KEY 가 없습니다` | `.env.local`/Vercel에 secret 키 누락. Vercel은 재배포 필요 |

### 환경변수

`.env.local` (로컬)과 Vercel 양쪽에 있어야 한다. **Vercel에서 바꾸면 재배포해야 적용된다.**

필요한 것: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, (선택) `GEMINI_MODEL`.

`service_role` / secret 키는 **절대** `NEXT_PUBLIC_`에 넣지 않고 스크린샷에도 나오면 안 된다.
`NEXT_PUBLIC_`이 붙으면 브라우저 번들에 그대로 들어간다.

### git 계정 주의

이 컴퓨터에는 개인 계정(`wns-dn1`)과 학교 계정(`wnsdn10`)이 둘 다 있다.
커밋 author가 섞인 적이 있다. 저장소 로컬에 `git config user.email`을 설정해 뒀지만,
이상하면 `git log`와 `git config user.email`을 먼저 확인할 것.
