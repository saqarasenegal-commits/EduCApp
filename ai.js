// All Claude API calls live here: lessons, tutor chat, quiz generation,
// grading and progress reports.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

// new Anthropic() reads ANTHROPIC_API_KEY (or an `ant auth login` profile).
export const client = new Anthropic();

export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

// Server-side refusal fallback: if the main model declines a request, the API
// re-runs it on a suitable fallback model inside the same call.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };

const LANG_NAME = { en: "English", fr: "French (français)" };

function learnerProfile({ levelLabel, gradeLabel, subjectLabel, topic, difficulty, lang, studentName }) {
  return [
    `Learner: ${studentName || "a student"}`,
    `School level: ${levelLabel}, class ${gradeLabel}`,
    `Subject: ${subjectLabel}`,
    `Topic: ${topic}`,
    `Difficulty: ${difficulty === "advanced" ? "ADVANCED (deeper reasoning, harder examples, extensions beyond the basics)" : "BASIC (core ideas, gentle pace, lots of concrete examples)"}`,
    `Language for ALL of your output: ${LANG_NAME[lang] || "English"}`,
  ].join("\n");
}

const TUTOR_SYSTEM = `You are "Prof. Ada", a warm, patient and rigorous home tutor for primary and secondary school pupils (roughly ages 6 to 18), teaching in English or French.

How you teach:
- Match vocabulary, sentence length and examples to the learner's class. For young primary pupils use short sentences, everyday examples (fruit, money, animals, games) and an encouraging tone. For upper secondary use precise terminology and exam-style reasoning.
- Explain *why*, not only *how*. Build from what the learner already knows, one step at a time.
- Use culturally inclusive examples, including African and Francophone contexts where natural (e.g. CFA francs, local markets, African geography) alongside international ones.
- Be factually careful. If something is debated or simplified for the learner's age, say so briefly.
- Content must always be age-appropriate and on educational topics. If asked about something off-topic or inappropriate, kindly steer back to learning.
- Write ALL output in the language requested in the learner profile, including headings.
- Address the learner directly ("you" / "tu"). Never guess the learner's gender from their name: when you must refer to them in the third person (e.g. to parents), use their name or gender-neutral wording.

Formatting (the app renders Markdown):
- Use Markdown headings, short paragraphs, bullet lists, bold for key terms and tables when useful.
- Do NOT use LaTeX. Write maths in plain text with Unicode (×, ÷, ², √, π, ≤, ≥, ½) and put longer calculations in fenced code blocks so alignment is kept.
- Use a few emojis sparingly for younger pupils only.`;

function lessonPrompt(profile) {
  return `${profile}

Teach a complete lesson on this topic. Structure it with these sections (translate the headings into the output language):
1. 🎯 Learning objectives — 2 to 4 bullet points.
2. Introduction — connect the topic to everyday life or a prior concept.
3. Explanation — the core concepts, step by step.
4. Worked examples — at least 2, solved step by step and getting slightly harder.
5. Common mistakes — 2 or 3 pitfalls and how to avoid them.
6. Summary — the key points to remember.
7. Try it yourself — 3 short practice questions (no answers shown; the learner can ask the tutor afterwards).

Keep the length appropriate to the class level: concise for primary, more thorough for secondary.`;
}

/** Writes a Server-Sent Event. */
function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Streams a Claude response to the browser as SSE (`delta`, `done`, `error`).
 * Returns the full text, or null if the stream failed.
 */
export async function streamToClient(res, { system, messages, effort = "medium", maxTokens = 32000 }) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  sse(res, "status", { state: "thinking" });

  let aborted = false;
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages,
    output_config: { effort },
    ...FALLBACK,
  });
  res.on("close", () => {
    if (!res.writableFinished) {
      aborted = true;
      stream.abort();
    }
  });

  let text = "";
  try {
    stream.on("text", (delta) => {
      text += delta;
      sse(res, "delta", { text: delta });
    });
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      sse(res, "error", { message: "The tutor could not answer this request. Please rephrase or choose another topic." });
    } else {
      sse(res, "done", { stopReason: final.stop_reason });
    }
    res.end();
    return text;
  } catch (err) {
    if (!aborted) {
      sse(res, "error", { message: friendlyError(err) });
      res.end();
    }
    return null;
  }
}

export function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "Invalid or missing Anthropic API key. Set ANTHROPIC_API_KEY in the .env file and restart the server.";
  if (err instanceof Anthropic.RateLimitError) return "The AI service is busy (rate limited). Please wait a moment and try again.";
  if (err instanceof Anthropic.BadRequestError) {
    // Billing problems arrive as a plain 400 with no dedicated error type.
    if (/credit balance/i.test(err.message)) return "The Anthropic account has no API credits left. Add credits in the Anthropic Console (Plans & Billing), then try again.";
    return `Bad request to the AI service: ${err.message}`;
  }
  if (err instanceof Anthropic.APIConnectionError) return "Could not reach the AI service. Check your internet connection.";
  if (err instanceof Anthropic.APIError) return `AI service error (${err.status}): ${err.message}`;
  if (err?.message?.includes("Could not resolve authentication")) return "No Anthropic API key found. Set ANTHROPIC_API_KEY in the .env file and restart the server.";
  return err?.message || "Unexpected error";
}

// ---------- Lessons & tutor chat ----------

export function streamLesson(res, ctx) {
  return streamToClient(res, {
    system: TUTOR_SYSTEM,
    messages: [{ role: "user", content: lessonPrompt(learnerProfile(ctx)) }],
    effort: ctx.difficulty === "advanced" ? "high" : "medium",
  });
}

/** history: [{role:"user"|"assistant", content:string}] — follow-up chat after a lesson */
export function streamTutorChat(res, ctx, lessonText, history) {
  const messages = [
    { role: "user", content: `${lessonPrompt(learnerProfile(ctx))}` },
    { role: "assistant", content: lessonText || "(lesson not yet delivered)" },
    ...history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) })),
  ];
  // Messages must end with a user turn.
  if (messages.at(-1).role !== "user") throw new Error("Last chat message must come from the learner");
  return streamToClient(res, {
    system:
      TUTOR_SYSTEM +
      `\n\nYou are now answering the learner's follow-up questions about the lesson above. Be concise and Socratic: when the learner asks for an answer to a practice question, first give a hint and ask them to try; give the full solution if they ask again or are clearly stuck.`,
    messages,
    effort: "medium",
    maxTokens: 16000,
  });
}

// ---------- Quizzes ----------

const QuizSchema = z.object({
  title: z.string(),
  questions: z.array(
    z.object({
      type: z.enum(["mcq", "short"]),
      prompt: z.string(),
      options: z.array(z.string()).describe("4 options for mcq, empty array for short"),
      correctIndex: z.number().describe("index of the correct option for mcq, -1 for short"),
      expectedAnswer: z.string().describe("the model answer"),
      explanation: z.string().describe("why this is the right answer, shown after submission"),
      skill: z.string().describe("the precise sub-skill this question tests, 2-5 words"),
    }),
  ),
});

export async function generateQuiz(ctx, { count = 8 } = {}) {
  const n = Math.max(3, Math.min(15, Number(count) || 8));
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: TUTOR_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${learnerProfile(ctx)}

Create an assessment (épreuve) of exactly ${n} questions to measure the learner's mastery of this topic.
- Mix: about 70% multiple-choice ("mcq", exactly 4 options, one correct answer, plausible distractors based on common mistakes) and 30% short-answer ("short", answer in a word, number or 1–2 sentences).
- Order the questions from easier to harder. Cover different sub-skills of the topic.
- For short-answer questions, set options to [] and correctIndex to -1.
- Shuffle the position of the correct option across mcq questions.
- Every question must be solvable without images.
- Write everything in the requested output language.`,
      },
    ],
    output_config: { effort: "medium", format: betaZodOutputFormat(QuizSchema) },
    ...FALLBACK,
  });
  if (response.stop_reason === "refusal") throw new Error("The tutor could not create a quiz on this topic.");
  const quiz = response.parsed_output;
  if (!quiz?.questions?.length) throw new Error("Quiz generation failed, please try again.");
  // Sanitize: make sure every mcq has a valid answer index.
  quiz.questions = quiz.questions.filter((q) =>
    q.type === "short" ? true : q.options.length >= 2 && q.correctIndex >= 0 && q.correctIndex < q.options.length,
  );
  return quiz;
}

const GradingSchema = z.object({
  shortAnswers: z.array(
    z.object({
      questionNumber: z.number(),
      score: z.number().describe("0, 0.5 or 1"),
      feedback: z.string().describe("one or two sentences addressed to the learner"),
    }),
  ),
  overallFeedback: z.string().describe("3-5 encouraging, specific sentences addressed to the learner"),
  strengths: z.array(z.string()),
  toReview: z.array(z.string()).describe("sub-skills to revise, empty if none"),
});

export async function gradeQuiz(ctx, quiz, answers) {
  const lines = quiz.questions.map((q, i) => {
    const given = answers[i];
    if (q.type === "mcq") {
      const chosen = Number.isInteger(given) && q.options[given] !== undefined ? q.options[given] : "(no answer)";
      return `Q${i + 1} [mcq, skill: ${q.skill}] ${q.prompt}\nCorrect: ${q.options[q.correctIndex]}\nLearner chose: ${chosen} → ${given === q.correctIndex ? "CORRECT" : "WRONG"}`;
    }
    return `Q${i + 1} [short, skill: ${q.skill}] ${q.prompt}\nModel answer: ${q.expectedAnswer}\nLearner answered: ${typeof given === "string" && given.trim() ? given.trim() : "(no answer)"}\n→ GRADE THIS`;
  });

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: TUTOR_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${learnerProfile(ctx)}

The learner has just finished this assessment. Multiple-choice questions are already marked.
1. Grade each short-answer question marked "GRADE THIS": 1 = correct (accept equivalent wording, minor spelling mistakes and equivalent numeric forms), 0.5 = partially correct, 0 = wrong or blank. Return one entry per short-answer question using its question number.
2. Write overall feedback for the learner, list their strengths and the sub-skills they should review.
Write all feedback in the requested output language, addressed directly to the learner.

${lines.join("\n\n")}`,
      },
    ],
    output_config: { effort: "low", format: betaZodOutputFormat(GradingSchema) },
    ...FALLBACK,
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("Grading failed, please try again.");
  }
  return response.parsed_output;
}

// ---------- Progress report ----------

export function streamProgressReport(res, { student, lang, results }) {
  const rows = results
    .slice(-30)
    .map((r) => `- ${r.date.slice(0, 10)} | ${r.subjectLabel} | ${r.topic} | ${r.difficulty} | ${Math.round(r.percent)}% | to review: ${(r.toReview || []).join(", ") || "-"}`)
    .join("\n");
  return streamToClient(res, {
    system: TUTOR_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Write a progress report for ${student.name} (${student.levelLabel}, class ${student.gradeLabel}) in ${LANG_NAME[lang] || "English"}, addressed to the learner and their parents. Do not assume the learner's gender; refer to them by name or speak to them directly.

Assessment history (most recent last):
${rows || "(no assessments yet)"}

Include: an overall summary, progress trend per subject, strengths, the 3 most important things to work on next with a concrete study plan for the coming week (which topics, basic or advanced), and a short encouraging closing line. Be honest but encouraging. Keep it under 400 words.`,
      },
    ],
    effort: "low",
    maxTokens: 16000,
  });
}
