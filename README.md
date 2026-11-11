# EduCApp — AI Classroom Home Tutor (EN / FR)

An AI home tutor for primary and secondary pupils (CP → Terminale / Grade 1 → 12). It uses Claude (`claude-opus-5-5`).

- **Lessons (Cours):** structured lessons on a topic at a **basic** or **advanced** level, in **French or English**: objectives, explanations, worked examples, common mistakes, a summary and practice questions. The lesson streams in as it is written. Afterwards the learner can ask "Prof. Ada" follow-up questions.
- **Tests (Épreuves):** AI-generated tests with multiple-choice and short-answer questions. Answers stay on the server until the learner submits. Short answers are graded by the AI, and every question gets an explanation, along with overall feedback, strengths and skills to review.
- **Progress (Progrès):** a profile for each learner with their test history, average by subject, a score-trend chart and an AI progress report for the learner and their parents.

## Run

```bash
npm install
cp .env.example .env   # then put your ANTHROPIC_API_KEY in .env
npm start              # http://localhost:3000
```

Data (learners and results) is saved to `data/db.json`.

## Structure

| File | Role |
|---|---|
| `server/app.js` | Express API (lessons and chat over SSE, tests, learners, progress) |
| `server/index.js` | Local server (frontend + API) |
| `api/index.js`, `vercel.json` | Vercel entry point and configuration |
| `server/auth.js` | Access code (`ACCESS_CODE`) |
| `server/ai.js` | Claude calls: prompts, streaming, structured outputs (Zod), grading |
| `server/curriculum.js` | Levels, classes, subjects and suggested topics (FR/EN) |
| `server/store.js` | Storage: JSON file locally, Supabase online (`supabase/schema.sql`) |

Putting the app online: see [DEPLOY.md](DEPLOY.md).
| `public/` | Frontend (vanilla JS, bilingual interface) |

If Claude declines a request, it is retried automatically on a fallback model through the server-side fallback (`fallbacks: "default"`).
