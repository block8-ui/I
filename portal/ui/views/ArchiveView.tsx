"use client";

import { useState } from "react";
import { GLOSSARY, SOURCES } from "../../lib/content";
import { Kicker, Panel, Title } from "../primitives";

const TABS = ["Glossary", "Sources", "About"] as const;

export default function ArchiveView() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Glossary");
  const [q, setQ] = useState("");
  const terms = GLOSSARY.filter((g) => (g.term + g.def).toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Panel accent="#9fb8e0" wide>
      <Kicker>The archive</Kicker>
      <Title>Glossary, sources and about</Title>

      <div role="tablist" aria-label="Archive sections" className="mt-5 inline-flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            aria-controls="archive-panel"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm ${tab === t ? "bg-white text-[#05070d]" : "text-white/70 hover:text-white"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div id="archive-panel" role="tabpanel" className="mt-5">
        {tab === "Glossary" && (
          <>
            <label className="block">
              <span className="sr-only">Search terms</span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${GLOSSARY.length} terms…`}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none"
              />
            </label>
            <dl className="mt-4 divide-y divide-white/10">
              {terms.map((g) => (
                <div key={g.term} className="py-3">
                  <dt className="font-semibold text-white">{g.term}</dt>
                  <dd className="mt-0.5 text-sm text-white/70">{g.def}</dd>
                </div>
              ))}
              {terms.length === 0 && <p className="py-3 text-sm text-white/50">No terms match &ldquo;{q}&rdquo;.</p>}
            </dl>
          </>
        )}

        {tab === "Sources" && (
          <>
            <p className="text-sm text-white/70">
              Lesson facts were checked against these sources. Follow the links to go deeper.
            </p>
            <ol className="mt-4 space-y-3">
              {SOURCES.map((s, i) => (
                <li key={s.url} className="flex gap-3 text-sm">
                  <span className="font-mono text-white/40">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-[#9fdcff] hover:underline">
                      {s.title}
                    </a>
                    <span className="block text-white/55">{s.by}</span>
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}

        {tab === "About" && (
          <div className="space-y-5 text-sm leading-relaxed text-white/75">
            <section>
              <h3 className="text-base font-semibold text-white">What is NeuralCore?</h3>
              <p className="mt-1">
                An interactive AI learning portal for high school students. It explains how AI works, how to use AI tools
                well, and how to use them ethically, through three modules, twelve hands-on 3D challenges, XP, levels and
                badges.
              </p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-white">How we used AI to build this site</h3>
              <p className="mt-1">
                We practise what Module 3 teaches. AI tools were used to help brainstorm lesson ideas, draft and review
                code, and suggest wording. Every fact in the lessons was checked by people against the sources listed in
                the Sources tab, and all final decisions were made by the team.
              </p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-white">Your privacy</h3>
              <p className="mt-1">
                There are no accounts. Your progress, XP and name are saved only in this browser (local storage) and are
                never sent anywhere. Use &ldquo;Reset progress&rdquo; on the dashboard to erase them.
              </p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-white">Accessibility</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Every 3D challenge has matching buttons, checkboxes and sliders, so it can be done by keyboard or screen reader.</li>
                <li>All lesson text is real, readable page text, not drawn inside the 3D scene.</li>
                <li>If your device asks for reduced motion, camera flights become instant cuts and XP orbs are switched off.</li>
                <li>Colour is never the only signal: right and wrong answers are also spelled out in words.</li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </Panel>
  );
}
