// Express application (shared by the local server and the Vercel function).
import express from "express";
import { LEVELS, SUBJECTS, gradeLabel } from "./curriculum.js";
import * as store from "./store.js";
import * as ai from "./ai.js";
import * as auth from "./auth.js";

if (process.env.VERCEL && store.kind !== "supabase") {
  throw new Error("On Vercel, set SUPABASE_URL and SUPABASE_SECRET_KEY: the local JSON file store cannot persist there.");
}

export const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "1mb" }));

// ---------- helpers ----------

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

/** Validates and expands a lesson/quiz request body into a full context object. */
async function buildContext(body) {
  const { level, grade, subject, topic, difficulty, lang, studentId } = body || {};
  if (!LEVELS[level]) throw httpError(400, "Unknown level");
  if (!LEVELS[level].grades.some((g) => g.id === grade)) throw httpError(400, "Unknown grade");
  if (!SUBJECTS[subject]) throw httpError(400, "Unknown subject");
  const cleanTopic = String(topic || "").trim().slice(0, 200);
  if (!cleanTopic) throw httpError(400, "Topic is required");
  const l = lang === "fr" ? "fr" : "en";
  const student = studentId ? await store.students.get(studentId) : null;
  return {
    level,
    grade,
    subject,
    topic: cleanTopic,
    difficulty: difficulty === "advanced" ? "advanced" : "basic",
    lang: l,
    studentId: student?.id || null,
    studentName: student?.name,
    levelLabel: LEVELS[level].label[l],
    gradeLabel: gradeLabel(level, grade, l),
    subjectLabel: SUBJECTS[subject].label[l],
  };
}

// ---------- access ----------

app.get("/api/session", (req, res) => res.json({ authRequired: auth.authEnabled(), authed: auth.isAuthed(req) }));
app.post("/api/login", auth.login);
app.post("/api/logout", auth.logout);
app.use("/api", auth.requireAccess);

// ---------- catalogue ----------

app.get("/api/curriculum", (req, res) => {
  res.json({ levels: LEVELS, subjects: SUBJECTS, model: ai.MODEL });
});

// ---------- learners ----------

app.get("/api/students", async (req, res) => res.json(await store.students.list()));

app.post("/api/students", async (req, res) => {
  const { name, level, grade, lang } = req.body || {};
  const cleanName = String(name || "").trim().slice(0, 60);
  if (!cleanName) throw httpError(400, "Name is required");
  if (!LEVELS[level] || !LEVELS[level].grades.some((g) => g.id === grade)) throw httpError(400, "Invalid class");
  res.status(201).json(await store.students.create({ name: cleanName, level, grade, lang: lang === "fr" ? "fr" : "en" }));
});

app.delete("/api/students/:id", async (req, res) => {
  await store.students.remove(req.params.id);
  res.status(204).end();
});

// ---------- lessons ----------

app.post("/api/lesson", async (req, res) => {
  await ai.streamLesson(res, await buildContext(req.body));
});

app.post("/api/tutor/chat", async (req, res) => {
  const ctx = await buildContext(req.body);
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-20) : [];
  if (!history.length) throw httpError(400, "Empty question");
  await ai.streamTutorChat(res, ctx, String(req.body.lessonText || "").slice(0, 60000), history);
});

// ---------- quizzes ----------

app.post("/api/quiz", async (req, res) => {
  const ctx = await buildContext(req.body);
  const quiz = await ai.generateQuiz(ctx, { count: req.body.count });
  const stored = { id: store.id(), createdAt: new Date().toISOString(), ctx, ...quiz };
  await store.quizzes.put(stored);
  // Never send answers to the browser before submission.
  res.json({
    id: stored.id,
    title: quiz.title,
    questions: quiz.questions.map((q) => ({ type: q.type, prompt: q.prompt, options: q.options })),
  });
});

app.post("/api/quiz/:id/submit", async (req, res) => {
  const quiz = await store.quizzes.get(req.params.id);
  if (!quiz) throw httpError(404, "Quiz not found or already submitted");
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];

  const grading = await ai.gradeQuiz(quiz.ctx, quiz, answers);
  const shortGrades = new Map(grading.shortAnswers.map((g) => [g.questionNumber, g]));

  const corrections = quiz.questions.map((q, i) => {
    const given = answers[i] ?? null;
    if (q.type === "mcq") return { ...q, given, score: given === q.correctIndex ? 1 : 0 };
    const g = shortGrades.get(i + 1);
    const score = g ? Math.max(0, Math.min(1, Number(g.score) || 0)) : 0;
    return { ...q, given, score, feedback: g?.feedback };
  });

  const total = corrections.reduce((s, c) => s + c.score, 0);
  const percent = corrections.length ? (100 * total) / corrections.length : 0;

  const result = {
    id: store.id(),
    quizId: quiz.id,
    studentId: quiz.ctx.studentId,
    date: new Date().toISOString(),
    level: quiz.ctx.level,
    grade: quiz.ctx.grade,
    subject: quiz.ctx.subject,
    subjectLabel: quiz.ctx.subjectLabel,
    topic: quiz.ctx.topic,
    difficulty: quiz.ctx.difficulty,
    lang: quiz.ctx.lang,
    score: total,
    outOf: corrections.length,
    percent,
    strengths: grading.strengths,
    toReview: grading.toReview,
    overallFeedback: grading.overallFeedback,
  };
  // The learner may have been deleted while taking the test.
  if (result.studentId && (await store.students.get(result.studentId))) await store.results.add(result);
  await store.quizzes.remove(quiz.id);

  res.json({ ...result, corrections });
});

// ---------- progress ----------

app.get("/api/students/:id/progress", async (req, res) => {
  const student = await store.students.get(req.params.id);
  if (!student) throw httpError(404, "Learner not found");
  const results = await store.results.forStudent(student.id);
  const bySubject = {};
  for (const r of results) {
    const s = (bySubject[r.subject] ??= { subject: r.subject, count: 0, sum: 0, last: null });
    s.count++;
    s.sum += r.percent;
    s.last = r.percent;
  }
  const subjects = Object.values(bySubject).map((s) => ({ subject: s.subject, count: s.count, average: s.sum / s.count, last: s.last }));
  const average = results.length ? results.reduce((s, r) => s + r.percent, 0) / results.length : null;
  res.json({ student, results, subjects, average });
});

app.post("/api/students/:id/report", async (req, res) => {
  const student = await store.students.get(req.params.id);
  if (!student) throw httpError(404, "Learner not found");
  const lang = req.body?.lang === "fr" ? "fr" : "en";
  await ai.streamProgressReport(res, {
    student: { ...student, levelLabel: LEVELS[student.level].label[lang], gradeLabel: gradeLabel(student.level, student.grade, lang) },
    lang,
    results: await store.results.forStudent(student.id),
  });
});

// ---------- errors ----------

app.use((err, req, res, next) => {
  const status = err.status && err.status < 500 ? err.status : 500;
  if (status === 500) console.error(err);
  if (res.headersSent) return res.end();
  res.status(status).json({ error: err.status ? err.message : ai.friendlyError(err) });
});

export default app;
