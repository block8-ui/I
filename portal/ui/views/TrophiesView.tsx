"use client";

import { BADGES } from "../../lib/content";
import { useProgress } from "../../lib/progress";
import { useSession } from "../../lib/session";
import BadgeIcon from "../BadgeIcon";
import { Kicker, Panel, Title } from "../primitives";

export default function TrophiesView() {
  const badges = useProgress((s) => s.badges);
  const selected = useSession((s) => s.selectedBadge);
  const set = useSession((s) => s.set);
  const earned = BADGES.filter((b) => badges[b.id]).length;
  const sel = BADGES.find((b) => b.id === selected);

  return (
    <Panel accent="#ffd27a">
      <Kicker>Trophy hall</Kicker>
      <Title>Badges</Title>
      <p className="mt-3 text-[15px] text-white/75">
        {earned} of {BADGES.length} earned. Earned medals shine on their pedestals. Click one in 3D or below to see how
        to unlock it. Each badge is worth +50 XP.
      </p>

      {sel && (
        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.04] p-4" aria-live="polite">
          <BadgeIcon shape={sel.shape} color={sel.color} earned={!!badges[sel.id]} size={56} />
          <div>
            <div className="font-semibold text-white">{sel.name}</div>
            <div className="text-sm text-white/70">{sel.description}</div>
            <div className={`mt-1 font-mono text-[11px] uppercase tracking-[0.16em] ${badges[sel.id] ? "text-[#7dffc4]" : "text-white/40"}`}>
              {badges[sel.id] ? `Earned ${new Date(badges[sel.id]).toLocaleDateString()}` : "Locked"}
            </div>
          </div>
        </div>
      )}

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {BADGES.map((b) => {
          const has = !!badges[b.id];
          return (
            <li key={b.id}>
              <button
                onClick={() => set({ selectedBadge: b.id })}
                aria-pressed={selected === b.id}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  selected === b.id ? "border-[#ffd27a]/60 bg-white/[0.07]" : "border-white/10 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                <BadgeIcon shape={b.shape} color={b.color} earned={has} size={36} />
                <span>
                  <span className={`block text-sm font-semibold ${has ? "text-white" : "text-white/55"}`}>{b.name}</span>
                  <span className="block text-xs text-white/50">{b.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
