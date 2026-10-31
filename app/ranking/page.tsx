// app/ranking/page.tsx  →  주소: /ranking

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getOverallRanking,
  getSubjectRanking,
  SUBJECTS,
} from "@/lib/data/ranking";
import type { RankRow } from "@/lib/data/ranking";
import { IconInbox } from "@/app/_components/icons";

export const dynamic = "force-dynamic";

function RankTable({ rows, meId }: { rows: RankRow[]; meId: string }) {
  if (rows.length === 0) {
    return (
      <div className="empty-box">
        <IconInbox size={32} />
        <p>아직 이 과목에서 점수를 받은 사람이 없습니다.</p>
      </div>
    );
  }

  return (
    <ol className="rank-list">
      {rows.map((r, i) => (
        <li
          key={r.userId}
          className="rank-row"
          style={
            r.userId === meId
              ? { borderColor: "var(--primary)", background: "var(--primary-soft)" }
              : undefined
          }
        >
          <span className={i < 3 ? "rank-no top" : "rank-no"}>{i + 1}</span>
          <span className="rank-who">
            {r.cohort}기 {r.name}
            {r.userId === meId && " (나)"}
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
  const me = await requireUser();

  const { subject } = await searchParams;
  const picked = subject && SUBJECTS.includes(subject as never) ? subject : null;

  const rows = picked
    ? await getSubjectRanking(picked)
    : await getOverallRanking();

  return (
    <>
      <div className="page-head">
        <h1>랭킹</h1>
      </div>

      <p className="lead">
        자료 제보 1점 · 방향 제시 3점 · 전체 답변 8점 · 채택되면 5점이 더해집니다.
      </p>

      {/* 과목 선택은 주소(?subject=물리)로 한다.
          링크를 공유할 수 있고, 새로고침해도 선택이 유지된다. */}
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

      <RankTable rows={rows} meId={me.id} />
    </>
  );
}
