-- ============================================================
-- 7차시: answers · score_logs + 점수 계산
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
--
-- ★ 계획서 6번에서 "직접 이해하고 싶다"고 적은 두 곳 중 나머지 하나가 여기다.
--   (첫 번째는 lib/cohort.ts 의 이메일 → 기수 파싱)
--
-- 이 파일의 핵심 생각 하나:
--   점수의 "진실"은 score_logs 한 곳에만 둔다.
--   profiles.total_score는 그 합계를 미리 더해둔 사본일 뿐이다.
--   그래서 점수가 이상하면 score_logs만 보면 원인을 찾을 수 있고,
--   합계가 틀어져도 로그로부터 다시 계산할 수 있다.
-- ============================================================

-- ---------- 답변 ----------
create table if not exists public.answers (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid        not null references public.questions(id) on delete cascade,
  author_id    uuid        not null references public.profiles(id)  on delete cascade,
  body         text        not null,

  -- 계획서의 기여 유형 3가지
  contrib_type text        not null
               check (contrib_type in ('info', 'direction', 'full')),

  is_accepted  boolean     not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists answers_question_idx
  on public.answers (question_id, created_at);

-- ★ 질문 하나당 채택은 하나만.
--   "부분 유니크 인덱스" — is_accepted가 true인 행들 중에서만 question_id가 유일해야 한다.
--   false인 행은 몇 개든 상관없다.
--   화면에서 버튼을 숨기는 것과 달리, 이건 DB가 물리적으로 막는다.
create unique index if not exists answers_one_accepted_per_question
  on public.answers (question_id)
  where is_accepted;


-- ---------- 점수 기록 ----------
create table if not exists public.score_logs (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  answer_id  uuid        references public.answers(id) on delete set null,
  reason     text        not null
             check (reason in ('info', 'direction', 'full', 'accepted')),
  points     int         not null,
  created_at timestamptz not null default now()
);

create index if not exists score_logs_user_idx
  on public.score_logs (user_id, created_at desc);


-- ============================================================
-- 점수 표 — 계획서의 숫자가 여기 한 곳에만 있다
--
--   자료 제보  info       1점
--   방향 제시  direction  3점
--   전체 답변  full       8점
--   채택됨     accepted   5점 (위 점수에 더해서)
--
-- 나중에 점수를 조정하려면 이 함수만 고치면 된다.
-- 여러 군데 흩어져 있으면 한 곳을 빠뜨려서 점수가 안 맞게 된다.
-- ============================================================
create or replace function public.contrib_points(kind text)
returns int
language sql
immutable            -- 같은 입력이면 늘 같은 출력. Postgres가 최적화에 활용한다.
as $$
  select case kind
    when 'info'      then 1
    when 'direction' then 3
    when 'full'      then 8
    when 'accepted'  then 5
    else 0
  end;
$$;


-- ============================================================
-- 트리거 ① 답변이 등록되면
--   - 점수를 기록하고
--   - 질문의 답변 수와 상태를 갱신한다
-- ============================================================
create or replace function public.on_answer_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.score_logs (user_id, answer_id, reason, points)
  values (
    new.author_id,
    new.id,
    new.contrib_type,
    public.contrib_points(new.contrib_type)
  );

  update public.questions
     set answer_count = answer_count + 1,
         -- 이미 해결된 질문이면 그대로 두고, 아니면 "답변 있음"으로
         status = case when status = 'resolved' then 'resolved' else 'answered' end
   where id = new.question_id;

  return new;
end;
$$;

drop trigger if exists answers_after_insert on public.answers;
create trigger answers_after_insert
  after insert on public.answers
  for each row execute function public.on_answer_created();


-- ============================================================
-- 트리거 ② 답변이 채택되면
--   - 채택 점수를 더 기록하고
--   - 질문을 "해결됨"으로 바꾼다
-- ============================================================
create or replace function public.on_answer_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- ★ "방금 채택된 경우"에만 동작해야 한다.
  --   이 조건이 없으면 답변 내용을 고칠 때마다 채택 점수가 또 쌓인다.
  if new.is_accepted and not old.is_accepted then
    insert into public.score_logs (user_id, answer_id, reason, points)
    values (new.author_id, new.id, 'accepted', public.contrib_points('accepted'));

    update public.questions
       set status = 'resolved'
     where id = new.question_id;
  end if;

  return new;
end;
$$;

drop trigger if exists answers_after_update on public.answers;
create trigger answers_after_update
  after update on public.answers
  for each row execute function public.on_answer_accepted();


-- ============================================================
-- 트리거 ③ 점수가 기록되면 누적 점수를 더한다
--
-- ★ 점수를 더하는 곳이 여기 한 군데뿐이라는 점이 중요하다.
--   앱 코드에서도 더하고 트리거에서도 더하면 점수가 두 배가 된다.
--   (로드맵 7차시의 "막히는 지점"에 적어둔 바로 그 실수)
-- ============================================================
create or replace function public.on_score_logged()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set total_score = total_score + new.points
   where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists score_logs_after_insert on public.score_logs;
create trigger score_logs_after_insert
  after insert on public.score_logs
  for each row execute function public.on_score_logged();


-- ---------- RLS ----------
alter table public.answers    enable row level security;
alter table public.score_logs enable row level security;

-- 답변: 로그인한 사람은 모두 읽기
drop policy if exists "answers_select" on public.answers;
create policy "answers_select"
  on public.answers for select
  to authenticated
  using (true);

-- 답변 작성: 본인 이름으로만. author_id를 남의 것으로 보내면 거부된다.
drop policy if exists "answers_insert_own" on public.answers;
create policy "answers_insert_own"
  on public.answers for insert
  to authenticated
  with check (auth.uid() = author_id);

-- ★ 채택: 그 질문을 쓴 사람만 할 수 있다.
--   화면에서 버튼을 숨기는 것만으로는 부족하다. 요청을 직접 만들어 보낼 수 있으므로
--   DB가 "이 질문의 주인이 맞는가"를 확인해야 한다.
drop policy if exists "answers_update_by_question_author" on public.answers;
create policy "answers_update_by_question_author"
  on public.answers for update
  to authenticated
  using (
    exists (
      select 1 from public.questions q
       where q.id = answers.question_id
         and q.author_id = auth.uid()
    )
  );

-- 점수 기록: 읽기만 가능. 쓰기는 위 트리거(security definer)만 한다.
-- insert 정책이 없으므로 사용자가 직접 점수를 넣을 방법이 없다.
drop policy if exists "score_logs_select" on public.score_logs;
create policy "score_logs_select"
  on public.score_logs for select
  to authenticated
  using (true);
