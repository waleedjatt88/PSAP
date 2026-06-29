import { useRef, useState } from "react";
import { useUser } from "../store/user";
import { SUBJECTS, findSubject } from "../data/curriculum";
import { getLesson } from "../data/lessons/index.js";

// Homework marking page. Student picks the subject, snaps a photo of
// their paper, the AI marks it (via /api/grade) and optionally emails
// the report to the parent (via /api/report).
export default function Homework() {
  const { user } = useUser();
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id);
  const [image, setImage] = useState(null); // data URL
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState(null);
  const [parentEmail, setParentEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState(null);
  const fileRef = useRef(null);

  const subject = findSubject(subjectId);
  const topic = subject.topics[0];
  const lesson = getLesson(topic?.lessonId);

  function pickFile() {
    fileRef.current?.click();
  }

  function onFileChosen(e) {
    setError(null);
    setResult(null);
    setEmailStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setImage(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function mark() {
    if (!image) return;
    setMarking(true);
    setError(null);
    setResult(null);
    setEmailStatus(null);
    try {
      const r = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          subject: subject.name,
          topic: topic?.title,
          classLevel: lesson?.classLevel || user?.classLevel || "JSS 1",
          studentName: user?.name,
          lessonContent: lessonToText(lesson),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Marking failed");
      setResult(data);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setMarking(false);
    }
  }

  async function sendReport() {
    if (!result || !parentEmail) return;
    setEmailStatus({ state: "sending" });
    try {
      const r = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentEmail,
          studentName: user?.name || "Student",
          subject: subject.name,
          topic: topic?.title,
          classLevel: lesson?.classLevel || user?.classLevel || "JSS 1",
          ...result,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Report failed");
      setEmailStatus({ state: "done", ...data });
    } catch (e) {
      setEmailStatus({ state: "error", error: String(e?.message || e) });
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">Homework Marking</h1>
        <p className="text-ink-500 text-sm">
          Snap a photo of your completed work and the AI tutor will mark it,
          point out mistakes, and send the report to your parent.
        </p>
      </div>

      {/* Step 1: pick subject + image */}
      <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <div className="text-xs font-semibold text-ink-700 mb-1.5">Subject</div>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full border border-ink-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.topics[0]?.title}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="text-xs font-semibold text-ink-700 mb-1.5">
              Photo of your work
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFileChosen}
              className="hidden"
            />
            <button
              onClick={pickFile}
              className="w-full border-2 border-dashed border-ink-300 hover:border-brand-blue rounded-lg px-3 py-2 text-sm text-ink-700 hover:text-brand-blue text-left"
            >
              📷 {fileName || "Take photo or upload image"}
            </button>
          </div>
        </div>

        {image && (
          <div className="flex items-start gap-4 flex-wrap">
            <img
              src={image}
              alt="Homework preview"
              className="max-h-60 rounded-lg border border-ink-100 shadow-card"
            />
            <button
              onClick={mark}
              disabled={marking}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
            >
              {marking ? "AI is marking…" : "✨ Mark with AI"}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 text-sm rounded-xl p-3">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Step 2: results */}
      {result && (
        <div className="bg-white rounded-2xl shadow-card p-5 space-y-5">
          <div className="grid sm:grid-cols-3 gap-3">
            <ScoreCard
              label="Score"
              value={`${result.score ?? 0} / ${result.total ?? 0}`}
              hint={`${result.percentage ?? 0}%`}
              color="text-brand-blue"
            />
            <ScoreCard
              label="Grade"
              value={result.grade || "—"}
              hint=""
              color="text-emerald-600"
            />
            <ScoreCard
              label="Questions marked"
              value={String(result.questions?.length || 0)}
              hint=""
              color="text-ink-900"
            />
          </div>

          {result.overallFeedback && (
            <div>
              <div className="text-xs font-semibold text-ink-700 mb-1.5">
                Teacher's note
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-ink-700">
                {result.overallFeedback}
              </div>
            </div>
          )}

          {result.questions?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-ink-700 mb-2">
                Question by question
              </div>
              <ul className="space-y-2">
                {result.questions.map((q, i) => (
                  <li
                    key={i}
                    className={[
                      "border rounded-xl p-3 text-sm",
                      q.isCorrect
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-rose-200 bg-rose-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-ink-900">
                        Q{q.number}. {q.question}
                      </div>
                      <div
                        className={[
                          "shrink-0 text-xs font-bold rounded-full px-2 py-0.5",
                          q.isCorrect
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500 text-white",
                        ].join(" ")}
                      >
                        {q.isCorrect ? "✓" : "✗"} {q.marksAwarded}/{q.marksAvailable}
                      </div>
                    </div>
                    <div className="text-xs text-ink-700 mt-1.5 grid sm:grid-cols-2 gap-1">
                      <div>
                        <strong>Your answer:</strong> {q.studentAnswer}
                      </div>
                      <div>
                        <strong>Correct:</strong> {q.correctAnswer}
                      </div>
                    </div>
                    {q.feedback && (
                      <div className="text-xs text-ink-700 mt-1.5">
                        💡 {q.feedback}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.suggestions?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-ink-700 mb-1.5">
                What to practise next
              </div>
              <ul className="space-y-1 text-sm text-ink-700">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand-orange">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 3: email the parent */}
          <div className="border-t border-ink-100 pt-4">
            <div className="text-xs font-semibold text-ink-700 mb-1.5">
              📧 Send this report to your parent
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@email.com"
                className="flex-1 border border-ink-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
              <button
                onClick={sendReport}
                disabled={
                  !parentEmail || emailStatus?.state === "sending"
                }
                className="bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
              >
                {emailStatus?.state === "sending"
                  ? "Sending…"
                  : "Send report"}
              </button>
            </div>
            {emailStatus?.state === "done" && emailStatus.sent && (
              <div className="mt-2 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg p-2">
                ✓ Email sent to <strong>{parentEmail}</strong>.
              </div>
            )}
            {emailStatus?.state === "done" && !emailStatus.sent && (
              <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg p-2 space-y-1">
                <div>
                  ⚠️ Email provider not configured. {emailStatus.reason}
                </div>
                {emailStatus.previewHtml && (
                  <details className="mt-1">
                    <summary className="cursor-pointer font-semibold">
                      Show the email preview
                    </summary>
                    <iframe
                      title="Email preview"
                      srcDoc={emailStatus.previewHtml}
                      className="w-full h-80 mt-2 rounded border border-ink-200 bg-white"
                    />
                  </details>
                )}
              </div>
            )}
            {emailStatus?.state === "error" && (
              <div className="mt-2 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-lg p-2">
                ⚠️ {emailStatus.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, value, hint, color }) {
  return (
    <div className="bg-ink-100/40 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wide text-ink-500 font-bold">
        {label}
      </div>
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      {hint && <div className="text-xs text-ink-500">{hint}</div>}
    </div>
  );
}

function lessonToText(lesson) {
  if (!lesson?.sections) return "";
  return lesson.sections
    .map((s) => `## ${s.heading}\n${(s.sentences || []).join(" ")}`)
    .join("\n\n");
}
