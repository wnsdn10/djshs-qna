-- ============================================================
-- 상호 협력 학습 지원 시스템 — 5차시: questions 테이블
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
--
-- 테이블을 한 번에 다 만들지 않고 차시마다 나눠 만든다.
--   5차시: questions          (지금)
--   6차시: profiles           + 로그인
--   7차시: answers, score_logs + 점수
--   8차시: reports            + RLS 정리
-- 한꺼번에 만들면 어느 테이블이 왜 필요한지 흐려진다.
-- ============================================================

-- ---------- 질문 ----------
create table if not exists public.questions (
  id           uuid primary key default gen_random_uuid(),
  title        text        not null,
  body         text        not null,
  tags         text[]      not null default '{}',

  -- check 제약: 정해진 값만 들어올 수 있게 DB가 직접 막는다.
  -- 화면에서 라디오 버튼으로 제한해도, 개발자 도구로 값을 바꿔 보낼 수 있다.
  -- 마지막 방어선은 언제나 DB다.
  q_type       text        not null default 'concept'
               check (q_type in ('concept', 'problem', 'research')),
  visibility   text        not null default 'all'
               check (visibility in ('all', 'seniors')),
  status       text        not null default 'unanswered'
               check (status in ('unanswered', 'answered', 'resolved')),

  -- 작성자. 6차시에 로그인을 붙이면 profiles 테이블과 연결된다.
  -- 지금은 화면에 "42기"를 표시하기 위한 값만 둔다.
  author_cohort int,

  answer_count int         not null default 0,
  created_at   timestamptz not null default now()
);

-- 목록은 항상 최신순으로 정렬하므로 인덱스를 걸어둔다
create index if not exists questions_created_at_idx
  on public.questions (created_at desc);


-- ---------- RLS (Row Level Security) ----------
-- Supabase는 기본적으로 모든 접근을 막는다.
-- 정책을 안 만들면 에러도 없이 "빈 배열"이 돌아온다. (5차시에 제일 많이 헤매는 지점)
--
-- 지금은 로그인이 없으므로 임시로 열어두고,
-- 8차시에 "선배에게만 공개" 같은 진짜 규칙으로 조인다.

alter table public.questions enable row level security;

drop policy if exists "임시: 누구나 읽기" on public.questions;
create policy "임시: 누구나 읽기"
  on public.questions for select
  using (true);

drop policy if exists "임시: 누구나 쓰기" on public.questions;
create policy "임시: 누구나 쓰기"
  on public.questions for insert
  with check (true);


-- ---------- 시드 데이터 ----------
-- 3차시에 쓰던 목데이터를 그대로 옮긴다.
-- 화면이 지금과 똑같이 보이면 "연결만 바뀌고 나머지는 그대로"라는 걸 눈으로 확인할 수 있다.

insert into public.questions
  (title, body, tags, q_type, visibility, status, author_cohort, answer_count, created_at)
values
  ('실험에서 오차가 너무 커요',
   '5회 반복측정했는데 오차가 너무 커요. 오차 분석을 한다고 해도 그대로 써도 될까요?',
   '{물리,R&E}', 'research', 'all', 'unanswered', 42, 0, '2026-09-02'),

  ('이거 어떻게 푸나요',
   '치환적분으로 풀려고 했는데 중간에 막혔습니다. 어디서부터 잘못됐는지 모르겠어요.',
   '{수학,미적분}', 'problem', 'all', 'unanswered', 43, 0, '2026-09-01'),

  ('오비탈 개념이 이해가 안돼요',
   's, p 오비탈 모양이 왜 그렇게 생겼는지 이해가 안 갑니다. 그냥 외워야 하나요?',
   '{화학,오비탈}', 'concept', 'all', 'answered', 43, 3, '2026-08-30'),

  ('보고서 참고문헌 형식 질문',
   'R&E 보고서 쓰는데 참고문헌을 어떤 형식으로 적어야 하는지 정해진 게 있나요?',
   '{기타,R&E}', 'research', 'seniors', 'resolved', 43, 2, '2026-08-28'),

  ('PCR 실험 결과가 안 나와요',
   '밴드가 아예 안 보입니다. 프라이머 문제일까요 아니면 온도 조건일까요?',
   '{생명,R&E}', 'research', 'all', 'unanswered', 43, 0, '2026-08-27'),

  ('재귀함수 시간복잡도 계산법',
   '점화식은 세웠는데 거기서 O표기로 넘어가는 과정이 헷갈립니다.',
   '{정보,알고리즘}', 'concept', 'all', 'answered', 42, 1, '2026-08-25');
