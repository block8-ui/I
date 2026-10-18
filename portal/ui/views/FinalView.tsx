"use client";

import { useEffect } from "react";
import { ALL_LESSONS, BADGES, FINAL_PASS_MARK, FINAL_QUESTIONS, MODULES } from "../../lib/content";
import { levelFor } from "../../lib/levels";
import { completedCount, isModuleComplete, useProgress } from "../../lib/progress";
import { useSession } from "../../lib/session";
import { Kicker, Panel, Title, btn } from "../primitives";
import QuizPanel from "./QuizPanel";

/** Draws a shareable certificate image and downloads it */
function downloadCertificate(name: string, xp: number, badges: number) {
  const W = 1600;
  const H = 1000;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  const bg = ctx.createRadialGradient(W * 0.7, H * 0.45, 50, W * 0.7, H * 0.45, 900);
  bg.addColorStop(0, "#0d2238");
  bg.addColorStop(1, "#04060c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // A powered-up core: glowing network on the right
  const cx = W * 0.74;
  const cy = H * 0.48;
  const pts: [number, number, string][] = [];
  const colors = MODULES.map((m) => m.color);
  for (let i = 0; i < 90; i++) {
    const a = i * 2.39996;
    const r = 60 + Math.sqrt(i / 90) * 250;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, colors[i % 3]]);
  }
  ctx.lineWidth = 1;
  pts.forEach(([x, y, col], i) => {
    const [nx, ny] = pts[(i * 7 + 3) % pts.length];
    ctx.strokeStyle = col + "55";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
  });
  pts.forEach(([x, y, col]) => {
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  const heart = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
  heart.addColorStop(0, "#ffffff");
  heart.addColorStop(0.3, "#9fefff");
  heart.addColorStop(1, "rgba(94,231,255,0)");
  ctx.shadowBlur = 0;
  ctx.fillStyle = heart;
  ctx.beginPath();
  ctx.arc(cx, cy, 90, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#5ee7ff";
  ctx.font = "600 26px ui-monospace, monospace";
  ctx.fillText("NEURALCORE  ·  CERTIFICATE OF COMPLETION", 110, 170);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 88px system-ui, sans-serif";
  ctx.fillText(name || "AI Explorer", 110, 340);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "36px system-ui, sans-serif";
  ["has completed all three modules of the", "AI learning portal and powered up", "the Neural Core."].forEach((line, i) =>
    ctx.fillText(line, 110, 430 + i * 52)
  );
  ctx.fillStyle = "#ffd27a";
  ctx.font = "600 30px ui-monospace, monospace";
  ctx.fillText(`${levelFor(xp).name.toUpperCase()}  ·  ${xp} XP  ·  ${badges} BADGES`, 110, 700);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), 110, 860);

  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `neuralcore-certificate${name ? `-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : ""}.png`;
  a.click();
}

export default function FinalView() {
  const p = useProgress();
  const allModules = MODULES.every((m) => isModuleComplete(p.lessons, m.id));
  const done = completedCount(p.lessons);

  useEffect(() => {
    useSession.getState().begin("final", FINAL_QUESTIONS.length);
  }, []);

  return (
    <Panel accent="#ffffff">
      <Kicker>Final challenge</Kicker>
      <Title>Power up the core</Title>
      <p className="mt-3 text-[15px] text-white/75">
        Ten questions from all three modules. Score {FINAL_PASS_MARK} or more to bring the core fully online, earn{" "}
        <strong className="text-white">Core Online</strong>, and unlock your certificate.
      </p>
      {!allModules && (
        <p className="mt-3 rounded-xl border border-[#ffd27a]/30 bg-[#ffd27a]/[0.06] p-3 text-sm text-[#ffe3a8]">
          You&apos;ve completed {done} of {ALL_LESSONS.length} lessons. We recommend finishing all three modules first,
          but you can try now.
        </p>
      )}

      <div className="mt-6">
        <QuizPanel
          key="final"
          questions={FINAL_QUESTIONS}
          onFinish={(correct) => useProgress.getState().submitFinal(correct, FINAL_QUESTIONS.length, FINAL_PASS_MARK)}
          renderResult={(correct, retake) => {
            const passed = correct >= FINAL_PASS_MARK;
            return (
              <div className="text-center">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Final score</p>
                <p className="mt-2 text-6xl font-semibold tabular-nums">
                  {correct}/{FINAL_QUESTIONS.length}
                </p>
                <p className={`mt-3 text-lg ${passed ? "text-[#7dffc4]" : "text-[#ffd27a]"}`}>
                  {passed ? "Core online! Look at it glow." : `So close. You need ${FINAL_PASS_MARK} to power the core.`}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button className={btn.ghost} onClick={retake}>
                    {passed ? "Retake" : "Try again"}
                  </button>
                </div>
              </div>
            );
          }}
        />
      </div>

      {p.final.passed && (
        <section className="mt-8 rounded-2xl border border-[#5ee7ff]/30 bg-[#5ee7ff]/[0.05] p-5">
          <h2 className="text-lg font-semibold text-white">Your certificate</h2>
          <p className="mt-1 text-sm text-white/70">Add your first name, then download a certificate image to share.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="flex-1 basis-48">
              <span className="sr-only">First name</span>
              <input
                value={p.name}
                onChange={(e) => p.setName(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#5ee7ff] focus:outline-none"
              />
            </label>
            <button
              className={btn.primary}
              style={{ ["--accent" as string]: "#5ee7ff" }}
              onClick={() => downloadCertificate(p.name, p.xp, BADGES.filter((b) => p.badges[b.id]).length)}
            >
              Download certificate
            </button>
          </div>
        </section>
      )}
    </Panel>
  );
}
