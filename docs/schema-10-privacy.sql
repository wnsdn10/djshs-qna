-- ============================================================
-- 10차시: 프로필은 학생이 못 고치게 + 활동 내역은 본인(과 관리자)만
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- 여러 번 실행해도 안전하다.
--
-- 관리자 화면(/admin)을 만들면서 "지금 누가 무엇을 읽고 고칠 수 있나"를 다시 확인했더니
-- 화면에서는 안 보이지만 DB에서는 열려 있던 문이 있었다.
-- ============================================================


-- ---------- 1) 학생이 자기 프로필을 고치지 못하게 ★ 가장 중요 ----------
-- 지금 정책: profiles_update_own  using (auth.uid() = id)
--   "본인 행이면 수정 가능"인데, 어느 칸인지 제한이 없다. 그래서 브라우저 콘솔에서
--     supabase.from('profiles').update({ cohort: 1, total_score: 9999 }).eq('id', 내 id)
--   를 보내면 그대로 저장된다.
--     - cohort를 1로 → 모든 사람의 "선배"가 되어 선배 전용 질문이 전부 보인다 (8차시 RLS가 무력화)
--     - total_score를 9999로 → 랭킹 1등 (7차시 "점수는 트리거만 더한다"가 무력화)
--
--   6차시 SQL 주석에 "cohort를 스스로 바꾸지 못하게 하는 건 8차시에 더 조인다"고 적어 놓고
--   8차시에서 빠뜨렸다.
--
-- 앱은 profiles를 수정하는 곳이 한 군데도 없다. 그래서 수정 권한을 통째로 없앤다.
--   - 점수(total_score)는 트리거 ③이 security definer(테이블 주인 권한)로 더하므로 영향이 없다
--   - 가입할 때 만드는 것도 트리거(handle_new_user)라서 영향이 없다
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "본인 프로필만 수정" on public.profiles;   -- 6차시 파일에 있던 이름
revoke update on public.profiles from anon, authenticated;


-- ---------- 2) 남의 이메일·번호는 안 보이게 ----------
-- 랭킹과 답변 작성자 표시에는 이름·기수·점수만 필요하다.
-- 그런데 지금은 로그인한 학생 누구나 전체 학생의 이메일과 번호를 한 번에 가져갈 수 있다.
--
-- 열(column) 단위로 읽기 권한을 준다. 이메일·번호·가입일은 목록에서 빠진다.
-- (본인 이메일·번호는 앱이 로그인 정보에서 직접 꺼낸다 — lib/auth.ts)
-- 관리자 화면은 secret 키로 읽으므로 전부 볼 수 있다.
revoke select on public.profiles from anon, authenticated;
grant  select (id, name, cohort, total_score) on public.profiles to authenticated;


-- ---------- 3) 점수 내역(score_logs)은 본인 것만 ----------
-- 지금 정책: score_logs_select  using (true)  → 아무나 전체 학생의 점수 내역을 읽는다.
-- "누가 언제 무슨 답변으로 몇 점"은 활동 내역이라 본인과 관리자만 보면 된다.
drop policy if exists "score_logs_select" on public.score_logs;
drop policy if exists "score_logs_select_own" on public.score_logs;
create policy "score_logs_select_own"
  on public.score_logs for select
  to authenticated
  using (user_id = auth.uid());


-- ---------- 4) 과목별 랭킹은 계속 전체를 더해야 한다 ----------
-- subject_ranking()은 score_logs를 읽어서 과목별로 더한다.
-- 8차시에는 security invoker(부르는 사람 권한)였다. 위 3)을 적용하면
-- 부르는 사람이 "자기 점수 내역"만 보게 되어서 랭킹에 자기 이름만 나온다.
--
-- security definer(함수 주인 권한)로 바꾼다.
--   - 함수가 돌려주는 건 이름·기수·과목별 합계뿐이다. 개별 내역은 밖으로 나가지 않는다.
--   - 덤으로 고쳐지는 것: invoker일 때는 "내가 볼 수 있는 질문"의 점수만 더해져서
--     후배와 선배가 보는 랭킹 숫자가 서로 달랐다 (선배 전용 질문 점수가 후배에게는 빠짐).
--     이제 모두가 같은 랭킹을 본다.
--   - set search_path = public: definer 함수에서 다른 스키마의 같은 이름 테이블로
--     바꿔치기 당하지 않게 하는 보안 설정
create or replace function public.subject_ranking(subject text)
returns table (
  user_id uuid,
  name    text,
  cohort  int,
  points  bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.cohort, sum(s.points)::bigint as points
    from public.score_logs s
    join public.answers   a on a.id = s.answer_id
    join public.questions q on q.id = a.question_id
    join public.profiles  p on p.id = s.user_id
   where subject = any(q.tags)
   group by p.id, p.name, p.cohort
   order by points desc
   limit 20;
$$;


-- ============================================================
-- 확인
--   select policyname, cmd from pg_policies
--    where tablename in ('profiles', 'score_logs') order by tablename;
--   → profiles: profiles_select (SELECT) 만
--     score_logs: score_logs_select_own (SELECT) 만
--
--   select column_name, privilege_type from information_schema.column_privileges
--    where table_name = 'profiles' and grantee = 'authenticated' order by column_name;
--   → cohort, id, name, total_score 의 SELECT 만
-- ============================================================
