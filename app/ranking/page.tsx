// app/ranking/page.tsx  →  주소: /ranking
//
// 전체 랭킹과 과목별 랭킹.
// 과목 선택은 주소의 ?subject=물리 로 한다 — useState 대신 searchParams를 쓰면
// 링크를 공유할 수 있고, 새로고침해도 선택이 유지된다.

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getOverallRanking,
  getSubjectRanking,
  SUBJECTS,
} from "@/lib/data/ranking";
import type { RankRow } from "@/lib/data/ranking";

export const dynamic = "force-dynamic";

function RankTable({ rows }: { rows: RankRow[] }) {
  if (rows.length === 0) {
    return <p className="empty">아직 점수를 받은 사람이 없습니다.</p>;
  }

  return (
    <ol className="rank-list">
      {rows.map((r, i) => (
        <li key={r.userId} className="rank-row">
          <span className={i < 3 ? "rank-no top" : "rank-no"}>{i + 1}</span>
          <span className="rank-who">
            {r.cohort}기 {r.name}
          </span>
          <span className="rank-pts">{r.points}점</span>
        </li>
      ))}
    </ol>
  );
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  // 랭킹은 로그인한 사람만 본다
  await requireUser();

  const { subject } = await searchParams;
  const picked = subject && SUBJECTS.includes(subject as never) ? subject : null;

  const rows = picked
    ? await getSubjectRanking(picked)
    : await getOverallRanking();

  return (
    <>
      <h1>랭킹</h1>
      <p className="hint">
        답변의 기여 유형에 따라 점수가 쌓입니다. 자료 제보 1점 · 방향 제시 3점 ·
        전체 답변 8점 · 채택 5점.
      </p>

      <div className="tag-filter">
        <Link
          href="/ranking"
          className={picked === null ? "tag-btn on" : "tag-btn"}
        >
          전체
        </Link>
        {SUBJECTS.map((s) => (
          <Link
            key={s}
            href={`/ranking?subject=${encodeURIComponent(s)}`}
            className={picked === s ? "tag-btn on" : "tag-btn"}
          >
            {s}
          </Link>
        ))}
      </div>

      <RankTable rows={rows} />
    </>
  );
}
