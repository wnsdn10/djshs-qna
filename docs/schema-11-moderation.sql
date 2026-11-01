-- ============================================================
-- 11차시: 관리자가 질문·답변을 지울 수 있게 + 지우면 점수도 정리
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전하다.
--
-- 삭제 자체는 관리자 화면(서버, secret 키)이 한다. 이 파일은 "지웠을 때 따라와야 하는 일"을 맡는다.
--
-- ★ 행만 지우면 생기는 문제
--   score_logs.answer_id 는 "on delete set null" 이다 (7차시).
--   그래서 답변을 지워도 그 답변으로 받은 점수 기록은 남고, total_score도 그대로다.
--   → 스팸 답변을 지워도 스팸으로 번 점수는 남는다. 삭제한 의미가 반쯤 없다.
--   질문의 answer_count, status("해결됨")도 지운 답변을 센 채로 남는다.
--
-- 해결: 답변이 지워지기 "직전"에 트리거가
--   1) 그 답변으로 받은 점수를 모두 더해서, 같은 크기의 음수 점수를 기록한다 (reason = 'removed')
--   2) 질문의 답변 수를 하나 줄이고, 채택된 답변이었으면 "해결됨"을 푼다
--
-- 왜 기존 기록을 지우지 않고 음수를 "더하는가"
--   7차시 원칙: 점수의 진실은 score_logs 한 곳에 있고, 기록은 쌓기만 한다.
--   기록을 지워버리면 "이 학생이 왜 점수가 줄었지?"를 나중에 설명할 수 없다.
--   은행 통장처럼 취소도 한 줄로 남긴다. total_score는 지금처럼 트리거 ③이 더한다(음수를 더하면 빠진다).
-- ============================================================


-- ---------- 1) 'removed' 라는 점수 사유를 허용 ----------
-- 7차시 표의 check 제약은 info/direction/full/accepted 넷만 허용한다.
-- (이름은 Postgres가 자동으로 붙인 score_logs_reason_check)
alter table public.score_logs drop constraint if exists score_logs_reason_check;
alter table public.score_logs add  constraint score_logs_reason_check
  check (reason in ('info', 'direction', 'full', 'accepted', 'removed'));


-- ---------- 2) 답변이 지워지기 직전에 정리하는 트리거 ----------
create or replace function public.on_answer_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  earned int;
begin
  -- 이 답변으로 받은 점수 합계 (유형 점수 + 채택 점수)
  select coalesce(sum(points), 0)
    into earned
    from public.score_logs
   where answer_id = old.id;

  if earned <> 0 then
    -- answer_id는 비워 둔다. 곧 지워질 답변을 가리키게 해봐야 set null 될 뿐이다.
    insert into public.score_logs (user_id, answer_id, reason, points)
    values (old.author_id, null, 'removed', -earned);
    -- ↑ 이 insert가 트리거 ③(on_score_logged)을 불러서 total_score에서 빠진다
  end if;

  -- 질문 쪽 숫자와 상태 정리
  --   - 답변 수 하나 감소 (혹시 모를 음수 방지로 greatest)
  --   - 채택된 답변이 지워졌으면 "해결됨"이 아니다 → 남은 답변이 있으면 '답변 있음', 없으면 '대기'
  --   - 채택 안 된 답변이 지워져서 0개가 됐으면 '대기'
  -- 질문이 통째로 지워지는 중이면(질문 삭제 → 답변이 연쇄 삭제) 이 update는 0줄에 적용되어 아무 일도 없다
  update public.questions
     set answer_count = greatest(answer_count - 1, 0),
         status = case
           when answer_count - 1 <= 0 then 'unanswered'
           when old.is_accepted        then 'answered'
           else status
         end
   where id = old.question_id;

  return old;   -- before 트리거에서 old를 돌려줘야 삭제가 진행된다 (null을 돌려주면 삭제가 취소된다)
end;
$$;

-- ★ 왜 after가 아니라 before 인가
--   on delete set null 은 Postgres 안에서 "RI_ConstraintTrigger_..." 라는 after 트리거로 동작하고,
--   같은 시점의 트리거는 이름 순서(대문자 R이 소문자보다 앞)로 실행된다.
--   그래서 after 트리거가 돌 때는 score_logs.answer_id 가 이미 null 이다.
--   시험용 DB에서 after 트리거로 바꿔 보니 8점 받은 답변의 "받은 점수 합계"가 0으로 나왔다.
--   지워지기 전(before)에 세야 정확하다.
drop trigger if exists answers_before_delete on public.answers;
create trigger answers_before_delete
  before delete on public.answers
  for each row execute function public.on_answer_deleted();
-- 질문을 지우면 answers가 on delete cascade로 같이 지워지고, 그 답변 하나하나에 위 트리거가 돈다.
-- 그래서 질문 삭제에는 따로 트리거가 필요 없다.


-- ---------- 3) 삭제는 관리자(서버)만 ----------
-- 지금도 questions·answers에 delete 정책이 없어서 RLS가 학생의 삭제를 막는다.
-- 테이블 권한까지 빼서 두 겹으로 둔다 (schema-9의 insert와 같은 방식).
-- 관리자 화면은 secret 키(service_role)로 지우므로 영향이 없다.
revoke delete on public.questions from anon, authenticated;
revoke delete on public.answers   from anon, authenticated;


-- ============================================================
-- 확인
--   select tgname from pg_trigger where tgrelid = 'public.answers'::regclass and not tgisinternal;
--   → answers_after_insert, answers_after_update, answers_before_delete
-- ============================================================
