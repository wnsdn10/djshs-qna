# 상호 협력 학습 지원 시스템 — 개발 로드맵

> 정보과학 프로젝트 / 2505 김준우
> 스택: **Next.js 16 (App Router, 정석 방식) + Supabase + Vercel**
> 작성일: 2026-09-01

---

## 0. 이 로드맵을 쓰는 법

계획서 4번의 8차시 계획을 그대로 유지하되, 각 차시를 **세부 단계 → 완료 판정 → 막히는 지점 → 커밋 메시지**로 쪼갰다.

- **완료 판정**은 "이게 되면 이번 차시는 끝"이라는 객관적 기준이다. 애매하게 넘어가지 말 것.
- **막히는 지점**은 미리 읽어두면 막혔을 때 검색 시간을 절반으로 줄인다. 계획서 5번의 "예상되는 어려움"을 기술적으로 구체화한 것.
- 차시마다 마지막 3분은 **회고 3줄**(무엇을 했나 / 무엇이 막혔나 / 어떻게 풀었나)을 `docs/journal.md`에 남긴다. 이게 결과 보고서의 재료가 된다.

---

## 1. 시작하기 전에 못 박고 갈 5가지 결정

개발 도중에 이걸 바꾸면 앞서 쓴 코드를 대부분 다시 써야 한다. 1차시 전에 확정할 것.

### 결정 A — 인증은 Supabase Auth를 쓴다

계획서에는 "비밀번호를 원문 그대로가 아니라 알아볼 수 없는 형태로 바꾸어 저장"이라고 되어 있다. 이걸 직접 구현할 수도 있지만(bcrypt로 해시), **정석 Next.js에서는 세션을 쿠키로 직접 관리해야 해서 난이도가 급격히 올라간다.** 8차시 안에 안전하게 끝내려면 Supabase Auth를 쓰는 게 맞다.

- Supabase Auth는 내부적으로 bcrypt로 해시해서 `auth.users` 테이블에 저장한다.
- 학습 목표(해시를 이해하기)는 **6차시에 Supabase Table Editor에서 `auth.users`의 `encrypted_password` 컬럼을 직접 열어보는 것**으로 달성한다. 내가 입력한 비밀번호와 저장된 값이 전혀 다르다는 걸 눈으로 확인하고, 왜 되돌릴 수 없는지 보고서에 쓴다.
- 학교 이메일 도메인 제한(`djshs.djsch.kr`)은 Auth가 대신 해주지 않는다. **직접 검증해야 한다.** (6차시)

### 결정 B — 기수·번호는 가입할 때 한 번만 계산해서 저장한다

`42th16@djshs.djsch.kr` → 42기 16번.

```
정규식: /^(\d+)th(\d+)@djshs\.djsch\.kr$/
```

매번 이메일을 파싱하면 목록 화면에서 질문 20개마다 20번 파싱하게 된다. **가입 시점에 한 번 계산해서 `profiles.cohort`, `profiles.student_no`에 숫자로 저장한다.** 그래야 "선배에게만 공개" 조건을 `cohort < 42` 같은 숫자 비교로 처리할 수 있다.

> 기수 숫자가 **작을수록 선배**다. 42기는 43기의 선배다. 부등호 방향을 헷갈리기 쉬우니 코드에 주석으로 남길 것.

### 결정 C — 데이터를 가져오는 코드를 화면 코드에서 분리한다 ★ 가장 중요

계획서 4번의 전략은 "① 잘 동작하는 프론트 만들기 → ② Supabase를 붙여 서버 기능 추가"다. Next.js는 서버 컴포넌트가 데이터를 직접 가져오는 구조라서, 아무 생각 없이 만들면 이 2단계 분리가 깨진다.

**해결책: `lib/data/` 폴더에 데이터 함수만 모아둔다.**

```
lib/data/questions.js
  ├─ getQuestions(filter)   질문 목록
  ├─ getQuestion(id)        질문 하나
  └─ createQuestion(input)  질문 등록
```

- **3~4차시**: 이 함수들이 하드코딩된 배열을 반환한다.
- **5차시**: 함수 **내부만** Supabase 쿼리로 교체한다.
- 결과: 화면 코드(`page.jsx`)는 **한 줄도 바뀌지 않는다.**

이게 계획서의 2단계 전략을 Next.js에서 지키는 방법이다. 5차시에 화면 코드를 안 고치고 DB가 붙는 순간이 이 설계의 보상이다.

### 결정 D — 파일명은 `middleware`가 아니라 `proxy`다

Next.js 16부터 `middleware.ts`가 **`proxy.ts`로 이름이 바뀌었다.** 함수 이름도 `middleware`가 아니라 `proxy`다.

```js
// proxy.js  (middleware.js 아님!)
export function proxy(request) { ... }
```

인터넷의 튜토리얼과 AI가 알려주는 코드는 대부분 `middleware.ts` 기준이다. **"미들웨어가 안 먹는다"는 문제의 90%가 이것이다.** 6차시에 반드시 다시 확인할 것.

### 결정 E — AI에게 Next.js 16 문서를 먼저 읽힌다

Next.js 16은 15와 문법이 여러 군데 다르다. AI는 학습 데이터에 있는 옛날 문법으로 코드를 써주는 경우가 많다. `create-next-app`의 **마지막 질문에서 Yes를 고르면** 해결된다.

```
Would you like to include AGENTS.md to guide coding agents
to write up-to-date Next.js code?  →  Yes
```

`AGENTS.md`와 `CLAUDE.md`가 생성되고, Claude Code가 코드를 쓰기 전에 **설치된 버전의 실제 문서**(`node_modules/next/dist/docs/`)를 읽게 된다. 질문 하나에 Yes를 누르는 것으로 이후 7차시의 삽질을 줄이는 셈이다.

> 이미 만들어둔 프로젝트에 나중에 추가하려면 `npx @next/codemod@canary agents-md`

---

## 2. 데이터베이스 설계

### 테이블 5개

#### `profiles` — 사용자
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | `auth.users.id`와 동일 |
| `email` | text | 학교 이메일 |
| `cohort` | int | 기수 (42) |
| `student_no` | int | 번호 (16) |
| `name` | text | 이름 |
| `total_score` | int | 누적 기여 점수 (기본 0) |
| `created_at` | timestamptz | |

#### `questions` — 질문
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | |
| `author_id` | uuid → profiles | 화면엔 안 보이지만 DB엔 항상 저장 |
| `title` | text | |
| `body` | text | |
| `tags` | text[] | `{수학, 미적분}` |
| `q_type` | text | `concept` / `problem` / `research` |
| `visibility` | text | `all` / `seniors` |
| `status` | text | `unanswered` / `answered` / `resolved` |
| `created_at` | timestamptz | |

#### `answers` — 답변
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | |
| `question_id` | uuid → questions | |
| `author_id` | uuid → profiles | |
| `body` | text | |
| `contrib_type` | text | `info`(자료 제보) / `direction`(방향 제시) / `full`(전체 답변) |
| `is_accepted` | bool | 채택 여부 |
| `created_at` | timestamptz | |

#### `score_logs` — 점수 기록
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid → profiles | |
| `answer_id` | uuid → answers | |
| `reason` | text | `info` / `direction` / `full` / `accepted` |
| `points` | int | |
| `created_at` | timestamptz | |

> **왜 `profiles.total_score`가 있는데 로그를 또 남기나?**
> 랭킹은 합계만 있으면 되지만, "누가 언제 어떤 행동으로 몇 점을 얻었는지"가 없으면 점수가 이상할 때 원인을 찾을 수 없다. 계획서 2번의 "점수 기록 테이블"이 정확히 이것이다.

#### `reports` — 신고 (계획서 5번 대비책)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | |
| `target_type` | text | `question` / `answer` |
| `target_id` | uuid | |
| `reporter_id` | uuid → profiles | |
| `reason` | text | |

### 점수 규칙

| 행동 | 점수 |
|---|---|
| 자료 제보 답변 | +1 |
| 방향 제시 답변 | +3 |
| 전체 답변 | +8 |
| 답변이 채택됨 | +5 (추가) |

`score_logs`에 행이 들어가면 **DB 트리거**가 `profiles.total_score`를 자동으로 갱신한다. 점수 계산 로직이 한 곳에만 있게 되고, 랭킹 조회가 `ORDER BY total_score DESC` 한 줄로 끝난다.

---

## 3. 폴더 구조 (최종 목표)

```
djshs-qna-project/
├─ app/
│  ├─ layout.jsx                 공통 헤더 · 내 점수 표시
│  ├─ page.jsx                   → /questions 로 리다이렉트
│  ├─ globals.css
│  ├─ login/page.jsx
│  ├─ signup/page.jsx
│  ├─ questions/
│  │  ├─ page.jsx                목록 (서버 컴포넌트)
│  │  ├─ new/page.jsx            질문 작성
│  │  ├─ [id]/page.jsx           질문 상세
│  │  └─ _components/
│  │     ├─ QuestionCard.jsx     (서버)
│  │     ├─ QuestionFilter.jsx   'use client' — 태그·검색
│  │     └─ AnswerForm.jsx       'use client' — 답변 입력
│  ├─ ranking/page.jsx
│  └─ me/page.jsx                내 활동
├─ lib/
│  ├─ supabase/
│  │  ├─ client.js               브라우저용
│  │  └─ server.js               서버 컴포넌트용
│  ├─ data/
│  │  ├─ questions.js            ★ 3차시 배열 → 5차시 DB
│  │  ├─ answers.js
│  │  └─ scores.js
│  └─ cohort.js                  이메일 → 기수·번호 파싱
├─ proxy.js                      ★ middleware 아님. 세션 갱신
├─ docs/
│  ├─ journal.md                 차시별 회고 3줄
│  └─ schema.sql                 테이블 생성 SQL 보관
├─ AGENTS.md                     AI가 읽을 Next 16 문서 안내
├─ .env.local                    ★ 절대 커밋 금지
└─ README.md
```

---

## 4. 차시별 개발 계획

### 0차시 — 사전 준비 (수업 전, 집에서)

수업 시간에 설치하느라 1차시를 날리지 않기 위한 준비.

- [ ] **Node.js 20.9 이상** 설치 → `node -v`로 확인 (Next.js 16은 Node 18을 지원하지 않는다)
- [ ] VS Code + Git 설치 → `git --version`
- [ ] GitHub 계정 로그인 확인
- [ ] Vercel 계정 생성 (GitHub 계정으로 가입)
- [ ] Supabase 계정 생성

---

### 1차시 — 준비: 저장소, 프로젝트 뼈대, 첫 배포

> **이번 차시 목표**: 아무것도 없는 상태에서 "인터넷 주소로 접속되는 웹사이트"까지. 내용은 없어도 된다.

**세부 단계**

1. **작업 폴더는 OneDrive 밖에** 만든다. `C:\dev\djshs-qna` 정도가 무난하다.
   > OneDrive 안에서 개발하면 `node_modules`의 파일 수만 개를 클라우드로 동기화하려다 빌드가 느려지고 `EPERM` 에러가 난다.
2. GitHub에 `djshs-qna` 저장소 생성 (Public, README 포함) → `git clone <주소>`
3. **★ clone 직후 `git config`부터 확인한다**
   ```bash
   git config user.name
   git config user.email
   ```
   계정을 여러 개 쓴다면 엉뚱한 계정이 남아 있기 쉽다. GitHub는 커밋 작성자를 **이메일로** 판별하므로, 이 저장소에서 쓸 계정의 이메일로 맞춰둔다.
   ```bash
   git config user.name "이름"
   git config user.email "GitHub에 등록된 주소"
   ```
   `--global`을 빼면 이 저장소에만 적용된다 — 개인 계정과 학교 계정을 나눠 쓸 때 유용. **나중에 고치려면 이미 올라간 기록을 다시 써야 하므로 지금 확인하는 게 가장 싸다.**
4. **`README.md`를 지운다.** `create-next-app`은 자기가 모르는 파일이 폴더에 있으면 중단하는데, `.git`이나 `.gitignore`와 달리 `README.md`는 예외 목록에 없다.
5. `npx create-next-app@latest .` — 첫 질문에서 **customize settings**를 고르고 아래대로 답한다.

   | 질문 | 답 | 이유 |
   |---|---|---|
   | TypeScript | **Yes** | Next.js·Supabase 공식 예제가 전부 TS라 그대로 복사해 쓸 수 있다. 타입 때문에 막히면 `any`로 넘기고 나중에 채운다 |
   | 린터 | **ESLint** | 오타·실수를 편집기가 미리 잡아준다 |
   | React Compiler | **No** | Babel을 거쳐서 컴파일이 느려진다. 이 규모엔 최적화할 것도 없고, 내 코드와 실제 도는 코드 사이에 한 겹이 더 생겨 학습에도 불리하다 |
   | Tailwind CSS | **No** | `globals.css`로 직접 쓴다. 대신 AI에게 코드를 부탁할 때 **"Tailwind 말고 CSS로"**를 꼭 붙일 것 |
   | `src/` 디렉토리 | **No** | 3장의 폴더 구조가 `app/`을 맨 위에 두는 기준 |
   | App Router | **Yes** | 우리가 쓰기로 한 방식 |
   | import alias | **No** | 기본값 `@/*`로 충분 |
   | **AGENTS.md** | **Yes** | **결정 E.** `AGENTS.md`와 `CLAUDE.md`가 함께 생성된다 |

   > 낯선 질문이 새로 나오면 판단 기준은 하나다 — **지금 배울 게 하나 더 늘어나는 선택지면 No.**
6. `npm run dev` → `localhost:3000` 접속 확인 (끄는 건 Ctrl+C. 켜둔 채로 코드를 고치면 브라우저가 알아서 갱신된다)
7. `app/page.tsx`의 내용을 지우고 "상호 협력 학습 지원 시스템"만 남기기
8. **App Router 구조 이해**: `app/` 아래 **폴더 이름이 곧 URL**이고, 그 안의 `page.tsx`가 화면이다. `app/ranking/page.tsx` → `/ranking`. 이 규칙 하나만 확실히 잡고 넘어간다.
9. **커밋과 push**
   ```bash
   git status          # node_modules가 목록에 없는지 먼저 확인
   git add .
   git commit -m "chore: Next.js 16 프로젝트 초기 생성"
   git push
   ```
10. **Vercel 배포** — vercel.com에 GitHub로 로그인 → Add New → Project → Import → 설정은 건드리지 말고 Deploy
11. **★ 배포 보호 끄기** — Settings → Deployment Protection → Vercel Authentication을 **Disabled**
    > 켜져 있으면 내 브라우저에서는 잘 보여도 **로그아웃한 다른 사람은 로그인 화면으로 튕긴다.** 친구들이 쓸 서비스이므로 반드시 끈다.
12. **고정 주소를 확인한다.** 배포 직후 나오는 `프로젝트-해시-계정.vercel.app`은 **이번 배포에만 붙은 임시 주소**라서 push할 때마다 바뀐다. 프로젝트 첫 화면의 **Domains**에 있는 `djshs-qna.vercel.app` 형태가 계속 쓸 주소다.
13. `docs/schema.sql`에 2장의 테이블 설계를 SQL 초안으로 적어두기 (아직 실행 안 함)

**완료 판정**
- [ ] Vercel 고정 주소로 **로그아웃 상태의 휴대폰에서** 접속해도 페이지가 뜬다
- [ ] 커밋 작성자가 의도한 계정으로 표시된다
- [ ] "폴더 이름이 URL이 된다"를 말로 설명할 수 있다

**막히는 지점**
| 증상 | 원인 |
|---|---|
| `'code'은(는) 내부 또는 외부 명령이 아닙니다` | VS Code가 안 깔렸거나, 설치 후 터미널을 껐다 켜지 않았다. Cursor를 쓴다면 `cursor .` |
| `create-next-app` 실행 중 에러 | Node 버전이 20.9 미만 |
| `The directory contains files that could conflict` | `README.md` 때문 (4번) |
| `Permission to A denied to B` (403) | 윈도우 자격 증명 관리자에 다른 GitHub 계정이 저장돼 있다. `control /name Microsoft.CredentialManager` → Windows 자격 증명 → github 항목 제거 후 재시도 |
| **커밋 작성자가 엉뚱한 계정으로 뜬다** | `git config user.email`이 그 계정 것 (3번). 이미 올라갔다면 `git commit --amend --reset-author --no-edit` 후 `git push --force-with-lease` |
| Vercel 주소가 로그인 화면으로 튕긴다 | Deployment Protection (11번) |
| Vercel에 저장소가 안 보임 | Adjust GitHub App Permissions에서 접근 권한을 안 줬다 |
| 배포는 됐는데 404 | 루트에 `app/page.tsx`가 없다 |

**커밋 메시지 예시**
```
chore: Next.js 16 프로젝트 초기 생성
docs: 데이터베이스 스키마 초안 작성
chore: AI 에이전트 문서(AGENTS.md) 설정
```

---

### 2차시 — 프론트: 화면 6개 뼈대와 이동

> **이번 차시 목표**: 계획서 3번 스케치의 화면들이 빈 껍데기로 존재하고, 헤더 링크로 서로 이동된다.

**세부 단계**

1. 라우트 폴더 6개 생성. 각 `page.tsx`에는 `<h1>` 제목 하나만.
   ```
   app/login/page.tsx        app/questions/page.tsx
   app/signup/page.tsx       app/questions/new/page.tsx
   app/ranking/page.tsx      app/questions/[id]/page.tsx
   ```
2. `app/layout.tsx`에 공통 헤더 추가 — 로고 + `<Link>` 네비게이션
   - `<a>`가 아니라 **`<Link>`**를 쓴다. `<a>`는 페이지 전체를 다시 받아오고, `<Link>`는 바뀐 부분만 갈아끼운다. 개발자 도구 Network 탭에서 둘의 차이를 직접 비교해볼 것.
3. `globals.css`에 색·간격 정하기. 계획서 스케치의 남색 배경(`#1b5e7e` 계열) + 밝은 회색 카드.
4. **★ 서버 컴포넌트 실험** — 이번 차시의 핵심
   ```jsx
   export default function Page() {
     console.log("여기는 어디에서 실행될까?")
     return <h1>질문 목록</h1>
   }
   ```
   브라우저 F12 콘솔에는 **안 뜨고**, VS Code 터미널에 뜬다.
   → Next.js에서 컴포넌트는 **기본적으로 서버에서 실행**된다. 이 한 가지를 이해하면 3~4차시가 훨씬 쉬워진다.

**완료 판정**
- [ ] 헤더 링크로 6개 화면 전부 이동된다
- [ ] `console.log`가 터미널에 찍히는 것을 확인했다
- [ ] "이 코드는 서버에서 실행된다"를 이해했다

**막히는 지점**
| 증상 | 원인 |
|---|---|
| `[id]` 폴더 이름에 대괄호를 못 씀 | 폴더명 그대로 `[id]`가 맞다. 동적 경로 표기 |
| CSS가 적용 안 됨 | `globals.css`를 `layout.tsx`에서 import 했는지 확인 |

**커밋 메시지 예시**
```
feat: 6개 화면 라우트 뼈대 추가
feat: 공통 헤더와 네비게이션 링크 구현
style: 기본 색상과 카드 레이아웃 지정
```

---

### 3차시 — 프론트: 목데이터로 목록·상세 그리기 + `'use client'` 첫 도입

> **이번 차시 목표**: DB 없이도 계획서 스케치의 질문 목록과 상세 화면이 실제로 보인다.

**세부 단계**

1. **`lib/data/questions.ts` 생성** (**결정 C**)
   ```ts
   const MOCK = [
     { id: "1", title: "실험에서 오차가 너무 커요", tags: ["물리","R&E"],
       status: "unanswered", cohort: 43, answerCount: 0, createdAt: "..." },
     // 5개 정도
   ]
   export async function getQuestions() { return MOCK }
   export async function getQuestion(id) { return MOCK.find(q => q.id === id) }
   ```
   > `async`를 붙여두는 게 중요하다. 5차시에 DB로 바꿀 때 함수 모양이 안 바뀐다.

2. **목록 페이지** — `getQuestions()`를 `await`하고 `.map()`으로 카드 렌더링
   - 카드에 들어갈 것: 상태 배지(미답변=빨강 / 답변완료=초록), 제목, 태그, "43기 작성, 답변: 0"

3. **`QuestionCard.tsx`로 분리** — 카드 디자인을 고칠 때 한 파일만 고치면 되게

4. **상세 페이지** — ★ Next.js 16 함정
   ```jsx
   export default async function Page({ params }) {
     const { id } = await params   // ← await 필수!
     const q = await getQuestion(id)
     ...
   }
   ```
   Next.js 15까지는 `params.id`로 바로 썼지만 **16부터는 반드시 `await`** 해야 한다. AI가 옛날 문법으로 써주면 여기서 에러가 난다.

5. **`'use client'` 첫 도입** — 태그 필터
   ```jsx
   'use client'
   import { useState } from 'react'
   export default function QuestionFilter({ tags, onChange }) { ... }
   ```
   `useState`를 쓰려면 파일 맨 위에 `'use client'`가 있어야 한다. 없으면 에러가 난다. **일부러 빼보고 에러 메시지를 읽어볼 것.**

6. **경계 실험**: `QuestionFilter.tsx`(클라이언트) 안에서 `getQuestions()`를 부르면 어떻게 되는지 확인 → 왜 서버 코드는 서버 컴포넌트에서만 불러야 하는지 체감

**완료 판정**
- [ ] 목록에 카드 5개가 스케치와 비슷한 모양으로 뜬다
- [ ] 카드를 클릭하면 상세 화면으로 이동하고 그 질문 내용이 나온다
- [ ] 태그 버튼을 누르면 목록이 걸러진다
- [ ] 어떤 파일이 서버이고 어떤 파일이 클라이언트인지 종이에 그릴 수 있다

**막히는 지점**
| 증상 | 원인 |
|---|---|
| `params.id`가 undefined | `await params` 안 함 (Next 16) |
| "You're importing a component that needs useState..." | `'use client'` 누락 |
| 클라이언트 컴포넌트에서 서버 함수 호출 시 에러 | 데이터는 서버에서 가져와 props로 내려줘야 한다 |

**커밋 메시지 예시**
```
feat: 목데이터 기반 질문 목록 렌더링
feat: 질문 상세 화면 구현 (async params 적용)
feat: 태그 필터 클라이언트 컴포넌트 추가
```

---

### 4차시 — 프론트: 질문 작성 폼과 Server Action

> **이번 차시 목표**: 폼을 제출하면 목록에 새 카드가 추가된다. 단, 새로고침하면 사라진다 — 그리고 그 이유를 안다.

**세부 단계**

1. **작성 폼 UI** (계획서 스케치 그대로)
   - 제목(input), 내용(textarea), 태그(input), 질문 유형(라디오 3개: 개념/문제/연구·보고서), 공개 범위(토글: 전체/선배에게만)
2. **Server Action 개념 잡기**
   ```jsx
   // app/questions/new/page.jsx
   export default function NewQuestionPage() {
     async function submit(formData) {
       'use server'                       // ← 이 함수는 서버에서 실행
       const title = formData.get('title')
       await createQuestion({ title, ... })
       redirect('/questions')
     }
     return <form action={submit}> ... </form>
   }
   ```
   - `onSubmit`에 `fetch`를 쓰는 옛날 방식이 아니라, **`<form action={함수}>`에 서버 함수를 직접 연결**하는 게 Next.js의 방식이다.
   - 이게 왜 되는지: 폼을 제출하면 브라우저가 서버에 요청을 보내고, Next.js가 그 요청을 이 함수와 연결해준다.
3. `lib/data/questions.ts`에 `createQuestion()` 추가 — 지금은 배열에 `push`
4. **새로고침하면 사라지는 것을 직접 확인** ← 5차시의 동기. 왜 사라지는지(서버 메모리의 배열이라 서버가 다시 시작되면 초기화) 회고에 적어둘 것
5. 폼 검증: 제목이 비었으면 "제목을 입력하세요" 표시

**완료 판정**
- [ ] 폼을 제출하면 목록으로 이동하고 새 카드가 보인다
- [ ] 새로고침하면 사라지는 것을 확인했고 이유를 설명할 수 있다
- [ ] 빈 제목으로 제출하면 에러 메시지가 뜬다

**막히는 지점**
| 증상 | 원인 |
|---|---|
| "Functions cannot be passed directly to Client Components" | 폼이 들어있는 컴포넌트에 `'use client'`가 붙어 있다. 서버 컴포넌트로 둬야 `action={서버함수}`가 된다 |
| 제출해도 목록이 안 바뀜 | `redirect` 후 캐시된 목록을 보고 있다. 7차시의 `revalidatePath`로 해결 |

**커밋 메시지 예시**
```
feat: 질문 작성 폼 UI 구현
feat: Server Action으로 질문 등록 처리
fix: 제목 미입력 시 검증 메시지 표시
```

---

### 5차시 — 서버·DB: Supabase 연결 (프로젝트의 전환점)

> **이번 차시 목표**: 새로고침해도 질문이 남아 있다. **그리고 화면 코드는 한 줄도 안 고쳤다.**

**세부 단계**

1. **Supabase 프로젝트 생성** (Region: Northeast Asia (Seoul) 권장)
2. **SQL Editor에서 테이블 5개 생성** — `docs/schema.sql`의 내용을 실행하고, 실행한 SQL을 그 파일에 최종본으로 저장
3. **환경변수 설정** ★ 사고 방지
   ```
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   - **`.gitignore`에 `.env.local`이 있는지 반드시 확인.** 키를 GitHub에 올리면 누구나 내 DB를 읽을 수 있다.
   - 변수 이름 앞의 `NEXT_PUBLIC_`은 "브라우저에도 보내도 되는 값"이라는 뜻이다. 그래서 여기 넣는 키는 반드시 공개용(publishable) 키여야 하고, `service_role` 키는 **절대** 넣으면 안 된다.
4. **패키지 설치**: `npm install @supabase/supabase-js @supabase/ssr`
5. **클라이언트 2개 만들기** — Supabase 공식 문서(`supabase.com/docs/guides/auth/server-side/nextjs`)의 코드를 **그대로** 복사한다. 이건 직접 쓰지 말고 공식 코드를 쓰는 게 맞다.
   - `lib/supabase/client.ts` — `createBrowserClient` (클라이언트 컴포넌트용)
   - `lib/supabase/server.ts` — `createServerClient` + 쿠키 `getAll`/`setAll` (서버 컴포넌트용)
   - **왜 2개인가**: 브라우저에는 쿠키가 그냥 있지만, 서버에서는 요청에 딸려온 쿠키를 직접 꺼내 넘겨줘야 하기 때문. 이 차이를 이해하는 게 6차시 인증의 절반이다.
6. **★ 결정 C의 보상 회수** — `lib/data/questions.ts` **내부만** 교체
   ```ts
   export async function getQuestions() {
     const supabase = await createClient()
     const { data, error } = await supabase
       .from('questions')
       .select('*, profiles(cohort), answers(count)')
       .order('created_at', { ascending: false })
     if (error) throw error
     return data
   }
   ```
   `app/questions/page.tsx`는 **건드리지 않는다.** 이게 3차시에 함수를 분리한 이유다.
7. Table Editor에서 시드 질문 3~4개 직접 입력
8. **Vercel 환경변수 등록** → 재배포 (로컬에서는 되는데 배포본이 안 되는 원인 1위)

**완료 판정**
- [ ] 새로고침해도 질문 목록이 그대로 있다
- [ ] Supabase Table Editor의 데이터와 화면의 목록이 일치한다
- [ ] 배포된 Vercel 주소에서도 목록이 보인다
- [ ] 화면 코드를 고치지 않았다는 것을 `git diff`로 확인했다

**막히는 지점**
| 증상 | 원인 |
|---|---|
| **데이터가 빈 배열로 온다 (에러도 없이)** | **RLS(Row Level Security)** 때문. Supabase는 기본으로 모든 접근을 막는다. 지금은 "모두 읽기 허용" 정책을 임시로 넣고, 8차시에 제대로 조인다 |
| `process.env.NEXT_PUBLIC_...`가 undefined | `.env.local` 만든 뒤 `npm run dev`를 재시작 안 함 |
| 로컬은 되는데 Vercel은 안 됨 | Vercel 대시보드에 환경변수를 안 넣었다 |

**커밋 메시지 예시**
```
feat: Supabase 클라이언트 설정 (브라우저/서버)
feat: 질문 목록을 목데이터에서 Supabase 조회로 교체
docs: 테이블 생성 SQL 최종본 기록
```

---

### 6차시 — 서버·DB: 인증 (가장 큰 산, 2차시로 나눠도 좋음)

> **이번 차시 목표**: 학교 이메일로 가입·로그인이 되고, 헤더에 "42기 김준우"가 뜬다. 새로고침해도 유지된다.

**세부 단계**

1. Supabase Dashboard → Authentication → Email 가입 활성화. 학습용이므로 **이메일 확인(Confirm email)은 일단 끈다** (실제 메일함 접근이 필요해서 수업 중 막힌다)
2. **`lib/cohort.ts` 작성** (**결정 B**)
   ```ts
   export function parseSchoolEmail(email) {
     const m = /^(\d+)th(\d+)@djshs\.djsch\.kr$/.exec(email.trim().toLowerCase())
     if (!m) return null
     return { cohort: Number(m[1]), studentNo: Number(m[2]) }
   }
   ```
   테스트: `42th16@djshs.djsch.kr` → OK / `42th16@gmail.com` → null / `abc@djshs.djsch.kr` → null
3. **회원가입 화면**
   - 도메인 검증(위 함수가 `null`이면 거부) → 비밀번호 8자 이상 → 비밀번호 확인 일치
   - `supabase.auth.signUp({ email, password, options: { data: { name } } })`
4. **`profiles` 자동 생성 트리거** — `auth.users`에 행이 생기면 `profiles`도 만들어지게
   ```sql
   create function public.handle_new_user() returns trigger as $$
   begin
     insert into public.profiles (id, email, name, cohort, student_no)
     values (
       new.id, new.email,
       new.raw_user_meta_data->>'name',
       (regexp_match(new.email, '^(\d+)th(\d+)@'))[1]::int,
       (regexp_match(new.email, '^(\d+)th(\d+)@'))[2]::int
     );
     return new;
   end; $$ language plpgsql security definer;
   ```
   > 왜 트리거인가: 클라이언트가 `profiles`에 직접 insert 하게 두면, 누군가 `cohort: 1`로 조작해서 모든 선배 전용 질문을 볼 수 있다. **서버(DB)가 계산해야 안전하다.**
5. **★ 비밀번호 해시 확인** — Table Editor에서 `auth.users`의 `encrypted_password` 열기. 내가 입력한 값과 전혀 다른 문자열이 저장돼 있다. 스크린샷을 찍어 보고서에 넣을 것. (**결정 A**)
6. **로그인 / 로그아웃** — `signInWithPassword`, `signOut`. 틀리면 "이메일 또는 비밀번호가 올바르지 않습니다" (계획서 스케치의 빨간 글씨)
7. **`proxy.ts` 작성** ★ (**결정 D**) — 요청마다 세션 토큰을 갱신하고 쿠키에 다시 심는다. 이게 없으면 새로고침할 때마다 로그아웃된다. Supabase 공식 문서 코드를 쓰되 **파일명과 함수명을 `proxy`로** 바꿀 것.
8. **보호된 페이지** — 서버 컴포넌트에서 `supabase.auth.getClaims()`로 확인하고, 없으면 `redirect('/login')`
   > `getSession()`이 아니라 **`getClaims()`**를 쓴다. 서버에서 `getSession()`은 토큰 검증을 보장하지 않아 Supabase가 명시적으로 권장하지 않는다.
9. 헤더에 로그인한 사람의 기수·이름 표시

**완료 판정**
- [ ] `@gmail.com`으로 가입하면 거부된다
- [ ] 가입하면 `profiles`에 기수·번호가 숫자로 들어간다
- [ ] 틀린 비밀번호로 로그인하면 에러 메시지가 뜬다
- [ ] 로그인 후 새로고침해도 로그인 상태가 유지된다
- [ ] 로그아웃 상태로 `/questions/new`에 가면 로그인 화면으로 튕긴다

**막히는 지점**
| 증상 | 원인 |
|---|---|
| **새로고침하면 로그아웃된다** | `proxy.ts`가 없거나 파일명이 `middleware.ts`다 (**결정 D**) |
| 서버 컴포넌트에서 로그인 정보를 못 읽음 | `server.ts`의 쿠키 `setAll` 처리 누락 |
| 가입은 됐는데 `profiles`가 비어 있음 | 트리거 미생성, 또는 `security definer` 누락 |
| "Email not confirmed" | 대시보드에서 이메일 확인을 안 껐다 |

**커밋 메시지 예시**
```
feat: 학교 이메일 도메인 검증과 기수 파싱 함수 추가
feat: 회원가입/로그인 구현
feat: proxy.ts로 세션 유지 처리
fix: profiles 자동 생성 트리거를 DB 측에서 처리하도록 변경
```

---

### 7차시 — 서버·DB: 답변, 채택, 기여 점수

> **이번 차시 목표**: 답변을 달면 점수가 쌓이고, 채택하면 +5가 더해지며, 질문 상태 배지가 바뀐다.

**세부 단계**

1. **답변 등록** — 상세 화면 하단의 `AnswerForm`(`'use client'`) + Server Action
   - 기여 유형 3버튼(자료 제보 / 방향 제시 / 전체 답변) 중 하나 선택 필수
2. **★ 등록 후 화면 갱신** — Next.js의 캐시 함정
   ```ts
   'use server'
   import { revalidatePath } from 'next/cache'

   export async function addAnswer(input) {
     await supabase.from('answers').insert(...)
     revalidatePath(`/questions/${input.questionId}`)  // 상세
     revalidatePath('/questions')                      // 목록
   }
   ```
   - `revalidatePath(경로)`가 그 경로의 캐시를 비운다. **Server Action 안에서 부르면 화면이 즉시 갱신된다.** 추가 설정 없이 바로 쓸 수 있어서 이걸 쓴다.
   - 클라이언트 컴포넌트 안에서 갱신이 필요하면 `useRouter().refresh()`.

   > **AI가 `cacheTag` / `updateTag`를 제안하면 거절할 것.**
   > 더 정밀한 방법이 맞지만, `next.config.ts`에 `cacheComponents: true`를 켜야만 동작한다. 그리고 이 플래그를 켜는 순간 **캐시되지 않은 데이터가 `<Suspense>` 밖에 있으면 빌드가 실패**한다. Supabase 조회가 곳곳에 있는 이 프로젝트에서 켜면 8차시 안에 수습이 안 된다. `revalidatePath`로 충분하다.
   > (참고: `revalidateTag`는 Next 16부터 두 번째 인자가 필수다 → `revalidateTag('questions', 'max')`. 이것도 `cacheComponents`와 짝인 기능이라 지금은 쓸 일이 없다.)

   > "분명 저장했는데 목록에 안 뜬다"의 원인이 바로 여기다. DB를 의심하기 전에 Supabase Table Editor를 먼저 열어볼 것 — 데이터가 있으면 캐시 문제다.
3. **점수 트리거 (SQL)** — `answers` insert 시 `score_logs`에 점수 기록, `score_logs` insert 시 `profiles.total_score` 갱신
   ```
   info=1, direction=3, full=8, accepted=+5
   ```
4. **채택 버튼** — 질문 작성자에게만 보이고, 질문당 1개만 가능. 채택 시 `answers.is_accepted = true` + `score_logs`에 `accepted` 5점
5. **질문 상태 자동 전환** — 답변 0=`unanswered` / 1개 이상=`answered` / 채택됨=`resolved`. 목록의 배지 색이 여기 연결된다
6. **익명 처리** — 화면에는 `42기`만, DB에는 `author_id`를 항상 저장 (계획서 5번 대비책). 답변에는 이름을 표시(`42기 김준우`), 질문에는 기수만.

**완료 판정**
- [ ] 답변을 등록하면 **즉시** 화면에 나타난다
- [ ] 기여 유형에 따라 점수가 정확히 다르게 쌓인다 (`score_logs` 확인)
- [ ] 채택하면 답변자 점수가 5 오르고, 상태가 "해결됨"으로 바뀐다
- [ ] 남의 질문에서는 채택 버튼이 안 보인다

**막히는 지점**
| 증상 | 원인 |
|---|---|
| 답변이 저장은 됐는데 화면에 없음 | 캐시. Server Action에 `revalidatePath` 추가 |
| `cacheTag is not allowed` 류의 에러 | `cacheComponents` 플래그가 필요한 API를 썼다. `revalidatePath`로 바꿀 것 |
| 점수가 두 배로 쌓임 | 트리거와 애플리케이션 코드가 **둘 다** 점수를 넣고 있다. 한쪽만 남길 것 |
| 채택을 여러 번 할 수 있음 | 질문당 채택 1개 제약(부분 유니크 인덱스)이 없다 |

**커밋 메시지 예시**
```
feat: 답변 등록과 기여 유형 선택 구현
feat: 점수 합산 트리거 추가 (score_logs → total_score)
feat: 답변 채택 기능과 질문 상태 자동 전환
fix: 등록 후 목록이 갱신되지 않던 캐시 문제 해결
```

---

### 8차시 — 마무리: 랭킹, 정렬 규칙, 보안, 최종 배포

> **이번 차시 목표**: 계획서의 모든 화면이 채워지고, 보안이 정리되고, 결과 보고서 재료가 준비된다.

**세부 단계**

1. **랭킹 화면** — 전체 순위(`profiles` `ORDER BY total_score DESC`) + 과목별 순위(`score_logs` × `questions.tags` 조인 집계). 익명 원칙에 맞춰 "42기 김준우" 형태로 표시
2. **내 활동 화면** — 내가 올린 질문, 내가 쓴 답변, 누적 점수, 점수 내역(`score_logs`)
3. **★ 정렬 규칙** (계획서 2번의 요구사항)
   - 답변 0개이면서 오래된 질문을 **목록 위로** 올린다
   - 예: `ORDER BY (answer_count = 0) DESC, created_at ASC` — 방치된 질문이 묻히지 않게 하는 것이 이 서비스의 존재 이유다
4. **★ RLS 정책 정리** — 5차시에 임시로 열어둔 것을 여기서 조인다
   - `profiles`: 로그인한 사람은 모두 읽기 / 본인 행만 수정
   - `questions`: `visibility='all'`이면 모두 / `visibility='seniors'`면 **`내 cohort < 작성자 cohort`인 사람만** (기수 숫자가 작아야 선배)
   - `answers`: 볼 수 있는 질문의 답변만 / 본인 것만 수정
   - `score_logs`: 읽기만, 쓰기는 트리거(서버)만
   > **왜 화면에서 거르면 안 되나**: 화면에서만 숨기면 브라우저 개발자 도구로 API를 직접 불러 다 볼 수 있다. **DB가 막아야 진짜로 막힌 것이다.**
5. **빈 상태·로딩·에러 화면** — 질문이 0개일 때, 로딩 중일 때(`loading.tsx`), 에러가 났을 때(`error.tsx`)
6. **최종 점검**: 로그아웃 상태에서 모든 URL을 직접 쳐서 들어가 보기 → 튕겨야 할 곳이 튕기는지
7. **README.md** — 서비스 소개, 스크린샷, 스택, 실행 방법, 배포 주소
8. **결과 보고서 재료 정리** — `docs/journal.md`의 회고 8개 + 커밋 로그(`git log --oneline`) + "가장 오래 막혔던 문제와 해결 과정" 3개

**완료 판정**
- [ ] 랭킹이 실제 점수 순으로 정확히 나온다
- [ ] 43기 계정으로 로그인하면 "선배에게만" 질문이 **목록에도, API에도** 안 보인다
- [ ] 답변 없는 오래된 질문이 목록 위쪽에 있다
- [ ] 배포본에서 전체 흐름(가입→질문→답변→채택→랭킹)이 한 번에 돌아간다

**커밋 메시지 예시**
```
feat: 전체·과목별 랭킹 화면 구현
feat: 미답변 질문 우선 정렬 적용
feat: RLS 정책으로 선배 전용 질문 접근 제한
docs: README와 결과 보고서용 개발 기록 정리
```

---

## 5. 여유가 있을 때 (확장 기능)

8차시 안에 위 내용을 다 끝내는 게 우선이다. 아래는 남는 시간에.

| 기능 | 난이도 | 메모 |
|---|---|---|
| **파일 첨부** | 중 | Supabase Storage. 계획서 2번에 있지만 인증·점수보다 후순위. 버킷 정책 설정이 은근히 걸린다 |
| **신고 기능** | 하 | `reports` 테이블은 이미 만들어져 있다. 신고 3회 이상이면 목록에서 하단으로 (계획서 5번 대비책) |
| **검색** | 하 | 제목 `ilike` 검색부터. 한국어 전문검색은 욕심 |
| **질문 등록 시 점수 차감** | 하 | 계획서 5번의 "답변이 안 붙으면 질문 등록에 점수를 쓰게" — `score_logs`에 음수 점수를 넣으면 끝. 결정 C처럼 점수 로직을 한 곳에 모아둔 보상 |
| **알림** | 상 | 내 질문에 답변이 달리면 표시. Supabase Realtime |

---

## 6. 자주 만날 에러 빠른 참조표

| 에러 메시지 / 증상 | 십중팔구 원인 |
|---|---|
| `params` / `searchParams`가 undefined | `await params` 안 함 (Next.js 16 변경점) |
| `You're importing a component that needs useState` | `'use client'` 누락 |
| `Functions cannot be passed directly to Client Components` | 서버 함수를 클라이언트 컴포넌트에 props로 넘김 |
| 데이터가 **에러 없이** 빈 배열 | RLS 정책 |
| 저장은 됐는데 화면 갱신 안 됨 | 캐시 → Server Action에 `revalidatePath` |
| `cacheTag` / `use cache` 관련 에러 | `cacheComponents` 플래그 필요. 이 프로젝트에선 안 쓴다 |
| 미들웨어가 동작 안 함 | 파일명이 `middleware`다 → `proxy`로 |
| 로그인이 새로고침에 안 남음 | `proxy.ts` 세션 갱신 누락 |
| `process.env.X`가 undefined | `NEXT_PUBLIC_` 접두사 확인 + 서버 재시작 |
| 로컬은 되는데 Vercel은 안 됨 | Vercel 환경변수 미등록 |
| 빌드 실패인데 로컬 dev는 됨 | 타입 에러. `npm run build`를 차시마다 한 번씩 돌려볼 것 |

---

## 7. AI를 쓰는 방식 (계획서 6번의 다짐을 실행 규칙으로)

계획서에 이렇게 썼다 — *"오류가 나면 메시지를 끝까지 읽고, 어느 파일 어느 줄에서 났는지 스스로 짚어 본 뒤에 질문하는 습관을 만들고 싶다."* 이걸 매번 지킬 수 있게 규칙으로 만든다.

### 에러가 났을 때 — 붙여넣기 전에 30초

1. 에러 메시지의 **맨 아래 줄**을 읽는다 (거기에 진짜 원인이 있다)
2. **파일명과 줄 번호**를 찾아 그 줄을 직접 열어본다
3. **내 가설을 한 줄로 쓴다**: "아마 `await`를 안 붙여서인 것 같다"
4. 그 다음에 질문한다:

```
[상황] 질문 상세 페이지에서 id를 읽으려는데 undefined가 나온다.
[에러] (마지막 5줄만) ...
[내 코드] app/questions/[id]/page.jsx 12번째 줄: const { id } = params
[내 가설] Next.js 16에서 params가 Promise로 바뀌었다고 들었는데 그것 때문일까?
[원하는 것] 원인 설명 먼저. 코드는 그 다음에.
```

가설이 틀려도 상관없다. **가설을 세우는 행위 자체가 코드를 읽게 만든다.**

### 코드를 받았을 때 — 커밋 전에 1분

- [ ] 새로 들어온 함수·문법 중 **모르는 것에 표시**했는가
- [ ] 표시한 것을 "이건 뭐 하는 거야?"라고 한 번 더 물었는가
- [ ] 이 코드가 **서버에서 도는지 브라우저에서 도는지** 말할 수 있는가
- [ ] 지우면 안 되는 줄이 어떤 건지 아는가

특히 계획서에서 직접 짚은 **이메일→기수 파싱**과 **기여 점수 합산**, 이 두 곳은 AI 코드를 그대로 받지 말고 한 줄씩 주석을 달아본다.

### 커밋 규칙

```
feat:  새 기능        fix:  버그 수정
style: 화면·CSS       docs: 문서
chore: 설정·패키지    refactor: 동작 그대로 구조 개선
```

한 차시에 **커밋 3개 이상**. 커밋 메시지는 "무엇을"이 아니라 **"무엇을 왜"**. 이 로그가 결과 보고서에서 "내가 어떤 순서로 문제를 풀어왔는지"를 증명해준다.

### 차시 회고 (`docs/journal.md`)

```markdown
## 5차시 (2026-XX-XX)
- 한 것: Supabase 연결, getQuestions를 DB 조회로 교체
- 막힌 것: 데이터가 빈 배열로 왔다. 에러도 없어서 30분 헤맴
- 푼 방법: Supabase 문서에서 RLS를 읽고 임시 정책 추가. DB가 기본으로 다 막는다는 걸 처음 알았다
```

---

## 8. 전체 흐름 한눈에

```
0차시  설치와 계정                          ┐
1차시  저장소 · Next 프로젝트 · 첫 배포      │ 준비
2차시  화면 6개 뼈대 · 서버 컴포넌트 이해    ┐
3차시  목데이터로 목록/상세 · 'use client'   │ 프론트 개발
4차시  질문 작성 폼 · Server Action          ┘   (DB 없이 동작)
5차시  Supabase 연결 ★ 전환점                ┐
6차시  인증 · 기수 파싱 · 세션               │ 서버·DB 추가
7차시  답변 · 채택 · 점수                    │
8차시  랭킹 · 정렬 · RLS · 최종 배포          ┘
```

**5차시에 화면 코드를 한 줄도 안 고치고 DB가 붙는 것** — 이 로드맵 전체가 그 한 순간을 위해 설계돼 있다. 결정 C를 지키는 것이 이 프로젝트를 8차시 안에 끝내는 열쇠다.
