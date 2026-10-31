-- ============================================================
-- 8차시: RLS 조이기 + 과목별 랭킹
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
--
-- 5차시에 "누구나 읽기/쓰기"로 임시로 열어둔 정책을 진짜 규칙으로 바꾼다.
--
-- ★ 왜 화면에서 거르면 안 되는가
--   목록을 그릴 때 화면 코드에서 걸러내도, 브라우저 개발자 도구로
--   Supabase에 직접 요청을 보내면 전부 받아올 수 있다.
--   화면은 "보여주는" 곳이지 "막는" 곳이 아니다. 막는 건 DB가 한다.
-- ============================================================

-- ---------- 임시 정책 제거 ----------
drop policy if exists "임시: 누구나 읽기" on public.questions;
drop policy if exists "임시: 누구나 쓰기" on public.questions;


-- ---------- 질문 읽기 ----------
-- 세 가지 경우에만 보인다:
--   1) 전체 공개 질문
--   2) 내가 쓴 질문 (선배 전용으로 올렸어도 내 글은 보여야 한다)
--   3) 선배 전용인데 내가 그 사람의 선배인 경우
--
-- ★ 기수는 숫자가 작을수록 선배다. 42기가 43기의 선배.
--   그래서 "내 기수 < 작성자 기수"가 "내가 선배"라는 뜻이 된다.
--   부등호 방향을 반대로 쓰면 후배에게 열리는 정반대 결과가 되므로 주의.
drop policy if exists "questions_select" on public.questions;
create policy "questions_select"
  on public.questions for select
  to authenticated
  using (
    visibility = 'all'
    or author_id = auth.uid()
    or exists (
      select 1
        from public.profiles me
       where me.id = auth.uid()
         and me.cohort < questions.author_cohort
    )
  );

-- ---------- 질문 쓰기 ----------
-- author_id를 남의 것으로 적어 보내면 거부된다.
drop policy if exists "questions_insert_own" on public.questions;
create policy "questions_insert_own"
  on public.questions for insert
  to authenticated
  with check (auth.uid() = author_id);

-- ---------- 질문 수정 ----------
-- 본인 글만. (답변 수·상태는 트리거가 security definer로 바꾸므로 이 정책과 무관)
drop policy if exists "questions_update_own" on public.questions;
create policy "questions_update_own"
  on public.questions for update
  to authenticated
  using (auth.uid() = author_id);


-- ============================================================
-- 과목별 랭킹
--
-- 전체 랭킹은 profiles.total_score 하나로 끝나지만,
-- 과목별은 "그 태그가 붙은 질문에 단 답변으로 얻은 점수"만 더해야 한다.
--   score_logs → answers → questions 를 타고 가서 태그를 확인한다.
--
-- 이런 다단계 조인은 앱에서 하면 요청이 여러 번 오가므로
-- DB 안에 함수로 만들어 한 번에 끝낸다.
-- ============================================================
create or replace function public.subject_ranking(subject text)
returns table (
  user_id uuid,
  name    text,
  cohort  int,
  points  bigint
)
language sql
stable                 -- 데이터를 바꾸지 않는 함수
security invoker       -- 부르는 사람의 권한으로 실행 → RLS가 그대로 적용된다
set search_path = public
as $$
  select p.id, p.name, p.cohort, sum(s.points)::bigint as points
    from public.score_logs s
    join public.answers   a on a.id = s.answer_id
    join public.questions q on q.id = a.question_id
    join public.profiles  p on p.id = s.user_id
   where subject = any(q.tags)     -- tags 배열 안에 그 과목이 있으면
   group by p.id, p.name, p.cohort
   order by points desc
   limit 20;
$$;
