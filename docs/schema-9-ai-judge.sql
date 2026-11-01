-- ============================================================
-- 9차시: AI(Gemini)가 답변 유형을 확인한다
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- 여러 번 실행해도 안전하다 (if not exists / drop ... if exists).
--
-- 문제: 답변 유형(자료 제보 1 · 방향 제시 3 · 전체 답변 8)을 작성자가 스스로 고른다.
--       대충 쓰고 "전체 답변"을 고르면 8점을 받을 수 있다.
--
-- 해결의 규칙 하나:
--   최종 유형 = "본인이 고른 유형"과 "AI 판정" 중 낮은 쪽
--   → AI는 점수를 깎을 수만 있고 올릴 수는 없다.
--     AI가 틀려도, 누가 AI를 속여도, 본인이 고른 점수보다 많이 받는 일은 없다.
--
-- 이 파일이 하는 일:
--   1) 판정 결과를 남길 칸을 만든다 (왜 이 점수인지 나중에 확인할 수 있게)
--   2) 위 규칙을 DB 제약으로도 건다 (앱 코드에 실수가 있어도 DB가 거부한다)
--   3) 학생 계정이 answers에 직접 insert 하지 못하게 막는다 ★ 가장 중요
--   덤) 채택할 때 바꿀 수 있는 칸을 is_accepted 하나로, 채택은 되돌릴 수 없게 (점수 반복 적립 구멍)
-- ============================================================


-- ---------- 1) 판정 기록 칸 ----------
--   contrib_type  최종 유형. 점수 트리거는 지금처럼 이 칸만 본다 (트리거는 안 바뀐다)
--   claimed_type  작성자가 고른 유형
--   ai_type       AI가 판정한 유형. AI 호출이 실패하면 null
--   ai_reason     AI가 댄 이유 한 줄. 화면에 그대로 보여준다
--
-- 9차시 전에 쓴 답변은 claimed_type 이 null 이다. 그 답변들은 아래 제약에서 빠진다.
alter table public.answers
  add column if not exists claimed_type text,
  add column if not exists ai_type      text,
  add column if not exists ai_reason    text;

alter table public.answers drop constraint if exists answers_claimed_type_check;
alter table public.answers add  constraint answers_claimed_type_check
  check (claimed_type is null or claimed_type in ('info', 'direction', 'full'));

alter table public.answers drop constraint if exists answers_ai_type_check;
alter table public.answers add  constraint answers_ai_type_check
  check (ai_type is null or ai_type in ('info', 'direction', 'full'));


-- ---------- 2) "AI는 올리지 못한다"를 DB에서도 ----------
-- 유형의 높낮이. 점수(1·3·8)로 비교하지 않고 순서를 따로 둔 이유:
-- 나중에 점수표를 바꿔도 "어느 쪽이 더 높은 유형인가"는 그대로여야 하기 때문이다.
create or replace function public.contrib_rank(kind text)
returns int
language sql
immutable
as $$
  select case kind
    when 'info'      then 1
    when 'direction' then 2
    when 'full'      then 3
  end;
$$;

-- 최종 유형은 본인이 고른 것보다 높을 수 없다
alter table public.answers drop constraint if exists answers_final_le_claimed;
alter table public.answers add  constraint answers_final_le_claimed
  check (claimed_type is null
         or public.contrib_rank(contrib_type) <= public.contrib_rank(claimed_type));

-- 최종 유형은 AI 판정보다 높을 수 없다
alter table public.answers drop constraint if exists answers_final_le_ai;
alter table public.answers add  constraint answers_final_le_ai
  check (ai_type is null
         or public.contrib_rank(contrib_type) <= public.contrib_rank(ai_type));

-- AI 판정을 못 받았으면(ai_type이 null) 가장 낮은 '자료 제보'로만 기록할 수 있다.
-- AI가 고장 났을 때 "그냥 본인 선택대로" 넣어주면, 고장 난 틈에 점수를 부풀릴 수 있다.
alter table public.answers drop constraint if exists answers_no_ai_means_info;
alter table public.answers add  constraint answers_no_ai_means_info
  check (claimed_type is null or ai_type is not null or contrib_type = 'info');


-- ---------- 3) 학생 계정의 직접 insert 막기 ★ ----------
-- 왜 필요한가:
--   AI 판정은 서버(Server Action)에서 한다. 그런데 학생 계정이 answers에 insert 할 수 있으면,
--   브라우저 개발자 도구로 Supabase에 직접 { contrib_type: 'full' } 을 보내서
--   서버를 거치지 않고 8점을 받을 수 있다. (anon 키는 브라우저 번들에 들어 있어서 누구나 본다)
--   AI 검사를 아무리 잘 만들어도 "건너뛸 수 있는 문"이 열려 있으면 소용없다.
--
-- 그래서 답변 저장은 서버만 가진 secret 키(service_role)로만 하게 바꾼다.
--   - insert 정책을 지우면 RLS가 학생 계정의 insert를 전부 거부한다
--   - revoke로 테이블 권한 자체도 뺀다 (정책을 누가 실수로 다시 만들어도 막히도록 두 겹)
--   - service_role은 RLS를 건너뛰므로 서버의 insert는 그대로 된다
--   - 점수 트리거(answers_after_insert)는 누가 insert 했든 그대로 실행된다
drop policy if exists "answers_insert_own" on public.answers;
revoke insert on public.answers from anon, authenticated;

-- ---------- 덤: 채택할 때 고칠 수 있는 칸을 is_accepted 하나로 ----------
-- 7차시 정책(answers_update_by_question_author)은 "질문 작성자만 update"를 막지만
-- "어느 칸을" 바꿀 수 있는지는 정하지 않았다.
-- 그래서 질문 작성자가 남의 답변 본문이나 contrib_type, ai_reason 까지 고칠 수 있었다.
-- 열(column) 단위 권한으로 is_accepted 만 남긴다.
-- (앱의 acceptAnswer()는 원래 is_accepted 하나만 바꾸므로 코드는 그대로 동작한다)
revoke update on public.answers from anon, authenticated;
grant  update (is_accepted) on public.answers to authenticated;

-- ---------- 덤 2: 한 번 채택하면 되돌릴 수 없다 ----------
-- 9차시 작업 중 시험용 DB에서 직접 확인한 구멍:
--   질문 작성자가 채택을 풀었다가(true → false) 다시 채택하면(false → true)
--   트리거 ②가 "방금 채택됨"으로 보고 +5를 또 기록한다.
--   같은 답변으로 세 번 반복하자 답변자 점수가 9점 → 29점이 됐다. 친구 점수를 무한히 올릴 수 있다.
--
-- 앱에는 "채택 취소" 버튼이 없다. 그래서 DB에서 "채택을 푸는 update" 자체를 거부한다.
--   with check: update 한 "뒤의" 행이 이 조건을 만족해야 저장된다.
--   is_accepted 가 false 가 되는 update는 조건(is_accepted)을 만족하지 못해 거부된다.
--   (with check를 따로 쓰면 using의 조건이 자동으로 적용되지 않으므로 작성자 확인도 다시 적는다)
--
-- 채택된 답변이 하나 있으면 부분 유니크 인덱스 때문에 다른 답변을 채택할 수도 없으므로,
-- 결과적으로 "질문 하나당 채택은 평생 한 번"이 된다.
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
  )
  with check (
    is_accepted
    and exists (
      select 1 from public.questions q
       where q.id = answers.question_id
         and q.author_id = auth.uid()
    )
  );


-- ============================================================
-- 확인
--   1) 칸이 생겼는지
--      select column_name from information_schema.columns
--       where table_name = 'answers' order by ordinal_position;
--
--   2) 학생 계정 권한이 select, update(is_accepted) 만 남았는지
--      select grantee, privilege_type from information_schema.role_table_grants
--       where table_name = 'answers' and grantee in ('anon', 'authenticated');
--      (update는 열 단위라 여기엔 안 나온다. 아래로 확인)
--      select grantee, column_name, privilege_type from information_schema.column_privileges
--       where table_name = 'answers' and grantee = 'authenticated' and privilege_type = 'UPDATE';
--
--   3) answers 정책에 answers_insert_own 이 없는지
--      select policyname from pg_policies where tablename = 'answers';
-- ============================================================
