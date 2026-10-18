# NeuralCore: AI learning portal

An interactive 3D learning portal that teaches high school students (grades 9–12) how AI works, how to use AI tools well, and how to use them ethically.

The whole site is one 3D world built with React Three Fiber. A neural-network **core** floats in space, surrounded by three **islands**, one per module. The camera flies between them as you navigate. Every lesson has a hands-on 3D challenge, and finishing lessons lights up the core.

## What's inside

| Module | Island | Lessons |
| --- | --- | --- |
| 1. How AI Works | The Lab | What is AI? · How machines learn · Neural networks · How chatbots work |
| 2. AI Tools & Techniques | The Workshop | The AI toolbox · Prompt engineering · AI as a study partner · Fact-checking AI |
| 3. Using AI Ethically | The Council | Academic integrity · Bias in AI · Privacy and your data · Deepfakes and misinformation |

Each lesson has three steps:

- **Learn**: a short reading.
- **Try**: a 3D challenge: sort, fact-check scanner, next-word prediction, train a classifier, tune a neuron, balance biased data, build a prompt, or inspect tools.
- **Check**: a quiz you can answer by clicking 3D crystals.

**Gamification:**
- XP and 5 levels, shown as rings around the core.
- 12 badges displayed as 3D medals in the Trophy Hall.
- Streaks and a progress dashboard.
- Light bridges that build from each island to the core.
- A final challenge that unlocks a downloadable certificate.

Progress is saved only in the browser (local storage). There are no accounts and no server.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## Where things live

```
app/(portal)/        Routes: /, /dashboard, /modules/[module]/[lesson], /trophies, /archive, /final
app/igloo/           The separate "Floe" igloo scroll demo
portal/lib/          content.ts (all lessons, quizzes, badges, glossary, sources), progress (XP/badges),
                     engines (challenge maths), world (layout + camera views), session/nav state
portal/three/        The 3D world: Core, Islands, Bridges, Trophies, Backdrop, CameraDirector, Orbs, Stage
portal/three/interactives/  One 3D component per challenge type, plus the 3D quiz
portal/ui/           Overlay UI: shell, top bar, XP meter, toasts, loader, and one view per page
```

To edit lesson text, quiz questions or badges, change `portal/lib/content.ts`. Everything else updates automatically.

## Accessibility

- Every 3D challenge has matching buttons, checkboxes and sliders in the panel, so it can be completed by keyboard or screen reader.
- Lesson text is real HTML.
- Reduced-motion settings turn camera flights into cuts and switch off XP orbs.
- Right and wrong answers are always spelled out in text, never shown by colour alone.
