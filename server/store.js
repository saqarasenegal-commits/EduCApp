// Storage for learners, pending quizzes and results.
// - Online (Vercel): Supabase, when SUPABASE_URL and SUPABASE_SECRET_KEY are set.
// - Local: a JSON file in ./data (no setup needed).
// Every method is async so both backends share one interface.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const id = () => crypto.randomUUID();

const QUIZ_TTL_MS = 24 * 60 * 60 * 1000; // unsubmitted quizzes expire after a day

// ---------------------------------------------------------------- JSON file
function jsonStore() {
  const DB_FILE = path.resolve("data", "db.json");
  let db;
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    db = { students: [], quizzes: {}, results: [] };
  }
  const save = () => {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE + ".tmp", JSON.stringify(db, null, 2));
    fs.renameSync(DB_FILE + ".tmp", DB_FILE);
  };

  return {
    kind: "json",
    students: {
      list: async () => db.students,
      get: async (sid) => db.students.find((s) => s.id === sid) || null,
      async create(data) {
        const s = { id: id(), createdAt: new Date().toISOString(), ...data };
        db.students.push(s);
        save();
        return s;
      },
      async remove(sid) {
        db.students = db.students.filter((s) => s.id !== sid);
        db.results = db.results.filter((r) => r.studentId !== sid);
        save();
      },
    },
    quizzes: {
      async put(quiz) {
        const cutoff = new Date(Date.now() - QUIZ_TTL_MS).toISOString();
        for (const [k, q] of Object.entries(db.quizzes)) if (q.createdAt < cutoff) delete db.quizzes[k];
        db.quizzes[quiz.id] = quiz;
        save();
      },
      get: async (qid) => db.quizzes[qid] || null,
      async remove(qid) {
        delete db.quizzes[qid];
        save();
      },
    },
    results: {
      async add(r) {
        db.results.push(r);
        save();
        return r;
      },
      forStudent: async (sid) => db.results.filter((r) => r.studentId === sid),
    },
  };
}

// ---------------------------------------------------------------- Supabase
// Tables (see supabase/schema.sql): edu_students, edu_results, edu_quizzes.
// RLS is on with no policies, so only this server (secret key) can access them.
function supabaseStore(url, key) {
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const check = ({ data, error }) => {
    if (error) throw new Error(`Database error: ${error.message}`);
    return data;
  };
  const toStudent = (row) => row && { id: row.id, createdAt: row.created_at, name: row.name, level: row.level, grade: row.grade, lang: row.lang };

  return {
    kind: "supabase",
    students: {
      list: async () => check(await sb.from("edu_students").select("*").order("created_at")).map(toStudent),
      get: async (sid) => toStudent(check(await sb.from("edu_students").select("*").eq("id", sid).maybeSingle())),
      async create({ name, level, grade, lang }) {
        return toStudent(check(await sb.from("edu_students").insert({ id: id(), name, level, grade, lang }).select().single()));
      },
      async remove(sid) {
        check(await sb.from("edu_students").delete().eq("id", sid)); // results cascade
      },
    },
    quizzes: {
      async put(quiz) {
        check(await sb.from("edu_quizzes").delete().lt("created_at", new Date(Date.now() - QUIZ_TTL_MS).toISOString()));
        check(await sb.from("edu_quizzes").insert({ id: quiz.id, created_at: quiz.createdAt, data: quiz }));
      },
      async get(qid) {
        return check(await sb.from("edu_quizzes").select("data").eq("id", qid).maybeSingle())?.data || null;
      },
      async remove(qid) {
        check(await sb.from("edu_quizzes").delete().eq("id", qid));
      },
    },
    results: {
      async add(r) {
        check(await sb.from("edu_results").insert({ id: r.id, student_id: r.studentId, date: r.date, data: r }));
        return r;
      },
      async forStudent(sid) {
        return check(await sb.from("edu_results").select("data").eq("student_id", sid).order("date")).map((row) => row.data);
      },
    },
  };
}

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
const store = SUPABASE_URL && SUPABASE_SECRET_KEY ? supabaseStore(SUPABASE_URL, SUPABASE_SECRET_KEY) : jsonStore();

export const { kind, students, quizzes, results } = store;
