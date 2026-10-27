-- ============================================================
-- 6차시: profiles 테이블 + 가입 트리거
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
--
-- 5차시에는 questions 하나만 만들었다. 이제 "누가 썼는가"가 필요해졌으므로
-- 사용자 테이블을 만들고 questions와 연결한다.
-- ============================================================

-- ---------- 사용자 ----------
-- Supabase는 로그인 정보를 auth.users 라는 자기 테이블에 보관한다.
-- 거기에는 이메일과 암호화된 비밀번호만 있고, 기수·번호·점수 같은
-- 우리 서비스만의 정보는 둘 수 없다. 그래서 profiles를 따로 만들어
-- auth.users와 같은 id로 1:1 짝을 짓는다.

create table if not exists public.profiles (
  -- auth.users의 id를 그대로 쓴다.
  -- on delete cascade: 계정이 지워지면 프로필도 같이 지워진다.
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text        not null unique,
  name         text        not null default '',
  cohort       int,                       -- 42th16 → 42
  student_no   int,                       -- 42th16 → 16
  total_score  int         not null default 0,
  created_at   timestamptz not null default now()
);

-- 랭킹은 점수 내림차순으로 조회하므로 인덱스를 걸어둔다
create index if not exists profiles_total_score_idx
  on public.profiles (total_score desc);


-- ---------- 가입할 때 프로필을 자동으로 만드는 트리거 ----------
--
-- ★ 왜 앱이 아니라 DB에서 하는가
--   화면에서 "가입 후 profiles에 insert" 하도록 만들면,
--   누군가 개발자 도구로 cohort를 1로 바꿔 보낼 수 있다.
--   그러면 모든 선배 전용 질문이 보인다.
--   기수는 이메일에서 "계산되는" 값이지 사용자가 "정하는" 값이 아니므로
--   서버(DB)가 직접 계산해야 한다.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer          -- 이 함수는 테이블 주인 권한으로 실행된다
set search_path = public  -- 보안 권장 설정
as $$
declare
  parts text[];
begin
  -- 이메일에서 기수와 번호를 뽑는다. 형식이 안 맞으면 parts는 null이 된다.
  parts := regexp_match(lower(new.email), '^(\d+)th(\d+)@djshs\.djsch\.kr$');

  -- ★ 마지막 방어선
  --   화면에서도, 서버 액션에서도 도메인을 검사하지만 여기서 한 번 더 막는다.
  --   여기서 예외를 던지면 auth.users에 넣는 것까지 통째로 취소되어
  --   "계정은 생겼는데 프로필이 없는" 어정쩡한 상태가 아예 생기지 않는다.
  if parts is null then
    raise exception '학교 이메일(예: 42th16@djshs.djsch.kr)로만 가입할 수 있습니다';
  end if;

  insert into public.profiles (id, email, name, cohort, student_no)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    (parts[1])::int,
    (parts[2])::int
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------- profiles의 RLS ----------
alter table public.profiles enable row level security;

-- 랭킹과 답변 작성자 표시에 필요하므로, 로그인한 사람은 모두 읽을 수 있다
drop policy if exists "로그인한 사람은 프로필 읽기" on public.profiles;
create policy "로그인한 사람은 프로필 읽기"
  on public.profiles for select
  to authenticated
  using (true);

-- 수정은 본인 행만. (cohort를 스스로 바꾸지 못하게 하는 건 8차시에 더 조인다)
drop policy if exists "본인 프로필만 수정" on public.profiles;
create policy "본인 프로필만 수정"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- insert 정책은 없다. 프로필은 위 트리거(security definer)만 만들 수 있다.


-- ---------- questions에 작성자 연결 ----------
-- 5차시에는 로그인이 없어서 author_cohort만 두었다.
-- 이제 실제 작성자를 가리킬 수 있다.
alter table public.questions
  add column if not exists author_id uuid references public.profiles(id) on delete set null;

-- author_cohort는 그대로 둔다.
-- 목록을 그릴 때마다 profiles를 조인하지 않아도 되도록 복사해 두는 값이다.
-- (실제 서비스에서도 조회를 줄이려고 흔히 쓰는 방법이다)
