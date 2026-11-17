-- ============================================================
-- 12차시: 답변 점수를 AI가 처음부터 0~8점으로 매긴다
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전하다.
--
-- ★ 왜 바꾸나 (친구 피드백)
--   9차시 방식: 학생이 유형(1·3·8점)을 고르고, AI는 "낮추기만" 한다.
--   → "깎이기만 하고 손해는 없으니 모두 최고 점수(전체 답변)를 고르지 않을까?
--      자료 제보·방향 제시 선택지가 의미가 없다."
--   맞는 지적이다. 고르는 단계가 사실상 "항상 8점 고르기"가 된다.
--
--   12차시 방식: 학생은 답변만 쓴다. Gemini가 답변을 읽고 0~8점 사이 정수로 점수를 매긴다.
--     0점      질문과 상관없음 · 성의 없음 · 장난
--     1~2점    자료 제보   (자료·링크·검색어를 알려줌)
--     3~5점    방향 제시   (어떤 개념·방법을 쓰면 되는지 짚어줌)
--     6~8점    전체 답변   (결론까지 해결)
--   구간 끝 숫자(1·3·8)는 예전 점수표와 같게 두어서, 옛 답변의 점수와 새 답변의 점수가 같은 눈금이 되게 했다.
--   유형 이름(자료 제보 등)은 이제 학생이 고르는 게 아니라 "점수에서 계산되는 이름표"다.
--
-- ★ AI가 실패하면?
--   예전에는 1점으로 기록했다(학생이 고른 걸 믿을 수 없으니 가장 낮게).
--   이제는 고른 값이 없으므로, 점수를 비워 두고(ai_score = null) "판정 대기"로 저장한다. 0점이 아니라 "아직 모름"이다.
--   관리자가 /admin 에서 "다시 판정"을 누르면 그때 점수가 정해지고, 아래 트리거가 그 점수를 적립한다.
--   Gemini가 잠깐 멈췄다는 이유로 좋은 답변이 1점으로 굳어 버리지 않게 하려는 것이다.
-- ============================================================


-- ---------- 1) 점수 칸 ----------
alter table public.answers
  add column if not exists ai_score int;

alter table public.answers drop constraint if exists answers_ai_score_range;
alter table public.answers add  constraint answers_ai_score_range
  check (ai_score is null or ai_score between 0 and 8);

-- "판정 대기" 답변은 유형도 아직 없다 (0점 답변도 유형이 없다). 그래서 비어 있어도 되게 바꾼다.
-- 기존 check (contrib_type in (...)) 는 null이면 통과하므로 그대로 둔다.
alter table public.answers alter column contrib_type drop not null;


-- ---------- 2) 점수 → 유형 이름표 ----------
-- 구간을 바꾸고 싶으면 이 함수 하나만 고친다 (7차시 contrib_points()와 같은 생각)
create or replace function public.score_band(score int)
returns text
language sql
immutable
as $$
  select case
    when score is null then null
    when score >= 6 then 'full'
    when score >= 3 then 'direction'
    when score >= 1 then 'info'
    else null            -- 0점: 어느 유형에도 해당하지 않는다
  end;
$$;


-- ---------- 3) 저장 직전: 유형을 점수에서 계산 + 점수 바꿔치기 금지 ----------
create or replace function public.on_answer_scoring()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    -- 한 번 정해진 점수는 바꿀 수 없다. 바꾸게 두면 "다시 판정"을 여러 번 눌러 점수를 고르는 꼴이 된다.
    if old.ai_score is not null and new.ai_score is distinct from old.ai_score then
      raise exception '이미 점수가 매겨진 답변입니다 (%점)', old.ai_score;
    end if;
    -- 12차시 전 답변(유형으로 점수를 받은 답변)에 새로 점수를 붙이면 점수를 두 번 받게 된다
    if old.ai_score is null and old.contrib_type is not null and new.ai_score is not null then
      raise exception '12차시 전 답변에는 AI 점수를 매길 수 없습니다';
    end if;
  end if;

  -- 점수가 있으면 유형 이름표는 점수에서 계산한다. 앱이 보낸 값은 무시한다 — 기준은 DB 한 곳.
  if new.ai_score is not null then
    new.contrib_type := public.score_band(new.ai_score);
  end if;

  return new;
end;
$$;

drop trigger if exists answers_before_scoring on public.answers;
create trigger answers_before_scoring
  before insert or update of ai_score on public.answers
  for each row execute function public.on_answer_scoring();


-- ---------- 4) 트리거 ① 고치기: 답변이 등록되면 ----------
-- 7차시 버전은 contrib_points(유형)으로 점수를 정했다. 이제는 AI 점수를 그대로 쓴다.
-- 질문의 답변 수·상태를 바꾸는 부분은 7차시와 같다.
create or replace function public.on_answer_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ai_score is not null then
    -- 12차시 방식: AI가 매긴 점수. 0점이면 기록할 것이 없다.
    if new.ai_score > 0 then
      insert into public.score_logs (user_id, answer_id, reason, points)
      values (new.author_id, new.id, new.contrib_type, new.ai_score);
    end if;
  elsif new.contrib_type is not null then
    -- 12차시 전 방식 (유형 → 점수표). 지금 앱은 이 길로 저장하지 않지만, 남겨 둔다.
    insert into public.score_logs (user_id, answer_id, reason, points)
    values (new.author_id, new.id, new.contrib_type, public.contrib_points(new.contrib_type));
  end if;
  -- 둘 다 없으면 "판정 대기" — 점수는 나중에 아래 ⑤번 트리거가 기록한다.

  update public.questions
     set answer_count = answer_count + 1,
         status = case when status = 'resolved' then 'resolved' else 'answered' end
   where id = new.question_id;

  return new;
end;
$$;


-- ---------- 5) 판정 대기였던 답변이 나중에 점수를 받으면 ----------
create or replace function public.on_answer_scored_later()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- "비어 있다가 → 처음 채워진" 경우에만. (트리거 ②의 "방금 채택된 경우에만"과 같은 생각)
  if old.ai_score is null and new.ai_score is not null and new.ai_score > 0 then
    insert into public.score_logs (user_id, answer_id, reason, points)
    values (new.author_id, new.id, new.contrib_type, new.ai_score);
  end if;
  return new;
end;
$$;

drop trigger if exists answers_after_scored on public.answers;
create trigger answers_after_scored
  after update of ai_score on public.answers
  for each row execute function public.on_answer_scored_later();


-- 9차시에 만든 claimed_type / ai_type 칸과 제약(answers_final_le_* 등)은 그대로 둔다.
-- 12차시부터 저장하는 답변은 두 칸이 비어 있어서 그 제약에 걸리지 않고,
-- 9~11차시 답변의 판정 기록은 그대로 남는다.

-- ============================================================
-- 확인
--   select tgname from pg_trigger where tgrelid = 'public.answers'::regclass and not tgisinternal order by 1;
--   → answers_after_insert, answers_after_scored, answers_after_update,
--     answers_before_delete, answers_before_scoring
-- ============================================================
