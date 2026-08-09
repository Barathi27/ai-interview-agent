"use client";

import { useState } from "react";

type Feedback = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
};

export default function InterviewPage() {
  const [sessionId, setSessionId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  const startInterview = async () => {
    if (!candidateId.trim()) {
      alert("Please enter candidate ID");
      return;
    }

    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setLoading(true);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: newSessionId,
          candidate: { id: candidateId },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to start interview");
        return;
      }

      setQuestion(data.reply);
      setStarted(true);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert("Please enter your answer");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to submit answer");
        return;
      }

      setEvaluation(data.evaluation || "");
      setQuestion(data.reply);
      setAnswer("");
      setDone(data.done);

      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #09090b 0%, #111827 50%, #0f172a 100%)",
        color: "#f8fafc",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                marginBottom: "6px",
              }}
            >
              AI INTERVIEW PLATFORM
            </div>

            <h1 style={{ margin: 0, fontSize: "32px" }}>
              AI Technical Interview
            </h1>
          </div>

          <div
            style={{
              padding: "8px 14px",
              borderRadius: "999px",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#4ade80",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            ● AI ONLINE
          </div>
        </header>

        {!started && (
          <section
            style={{
              background: "rgba(15,23,42,0.85)",
              border: "1px solid #334155",
              borderRadius: "20px",
              padding: "40px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "18px",
                background: "#1e293b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                marginBottom: "20px",
              }}
            >
              🤖
            </div>

            <h2 style={{ fontSize: "26px", marginBottom: "10px" }}>
              Start your technical interview
            </h2>

            <p
              style={{
                color: "#94a3b8",
                lineHeight: 1.6,
                marginBottom: "30px",
              }}
            >
              The AI interviewer will ask questions based on your completed
              curriculum and evaluate your answers in real time.
            </p>

            <label
              style={{
                display: "block",
                fontSize: "14px",
                color: "#cbd5e1",
                marginBottom: "8px",
              }}
            >
              Candidate ID
            </label>

            <input
              type="text"
              placeholder="Example: CAND-001"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "15px",
                borderRadius: "12px",
                border: "1px solid #475569",
                background: "#020617",
                color: "#f8fafc",
                outline: "none",
                fontSize: "15px",
                marginBottom: "18px",
              }}
            />

            <button
              onClick={startInterview}
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "12px",
                border: "none",
                background: loading ? "#475569" : "#2563eb",
                color: "white",
                fontSize: "16px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Starting Interview..." : "Start Interview →"}
            </button>
          </section>
        )}

        {started && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "6px",
                  background: "#1e293b",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: done ? "100%" : "50%",
                    height: "100%",
                    background: "#2563eb",
                    borderRadius: "999px",
                  }}
                />
              </div>

              <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                {done ? "Completed" : "In Progress"}
              </span>
            </div>

            <section
              style={{
                background: "rgba(15,23,42,0.88)",
                border: "1px solid #334155",
                borderRadius: "20px",
                padding: "30px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: "#1d4ed8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                  }}
                >
                  🤖
                </div>

                <div>
                  <div style={{ fontWeight: 700 }}>AI Interviewer</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Technical Interview
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: "14px",
                  padding: "22px",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {question}
              </div>
            </section>

            {!done && (
              <section
                style={{
                  background: "rgba(15,23,42,0.88)",
                  border: "1px solid #334155",
                  borderRadius: "20px",
                  padding: "25px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "12px" }}>
                  👤 Your Answer
                </div>

                <textarea
                  placeholder="Explain your answer clearly. Include examples where possible..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={7}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "16px",
                    borderRadius: "14px",
                    border: "1px solid #475569",
                    background: "#020617",
                    color: "#f8fafc",
                    fontSize: "15px",
                    lineHeight: 1.6,
                    resize: "vertical",
                    outline: "none",
                  }}
                />

                <button
                  onClick={submitAnswer}
                  disabled={loading}
                  style={{
                    marginTop: "15px",
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "none",
                    background: loading ? "#475569" : "#2563eb",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "15px",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "🧠 AI is evaluating..." : "Submit Answer →"}
                </button>
              </section>
            )}

            {evaluation && (
              <section
                style={{
                  background: "rgba(15,23,42,0.88)",
                  border: "1px solid #334155",
                  borderRadius: "20px",
                  padding: "25px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>🧠</span>

                  <h2 style={{ margin: 0, fontSize: "20px" }}>AI Evaluation</h2>
                </div>

                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    margin: 0,
                    color: "#cbd5e1",
                    lineHeight: 1.7,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {evaluation}
                </pre>
              </section>
            )}

            {done && feedback && (
              <section
                style={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid #334155",
                  borderRadius: "20px",
                  padding: "30px",
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: "25px",
                    fontSize: "24px",
                  }}
                >
                  📊 Final Interview Feedback
                </h2>

                <div
                  style={{
                    background: "#020617",
                    border: "1px solid #1e293b",
                    borderRadius: "14px",
                    padding: "20px",
                    marginBottom: "18px",
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>📝 Summary</h3>

                  <p
                    style={{
                      color: "#cbd5e1",
                      lineHeight: 1.7,
                      marginBottom: 0,
                    }}
                  >
                    {feedback.summary}
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "18px",
                    marginBottom: "18px",
                  }}
                >
                  <div
                    style={{
                      background: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: "14px",
                      padding: "20px",
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>💪 Strengths</h3>

                    <ul
                      style={{
                        color: "#cbd5e1",
                        lineHeight: 1.8,
                        paddingLeft: "20px",
                        marginBottom: 0,
                      }}
                    >
                      {feedback.strengths.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      background: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: "14px",
                      padding: "20px",
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>🎯 Gaps</h3>

                    <ul
                      style={{
                        color: "#cbd5e1",
                        lineHeight: 1.8,
                        paddingLeft: "20px",
                        marginBottom: 0,
                      }}
                    >
                      {feedback.gaps.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div
                  style={{
                    background: "#020617",
                    border: "1px solid #1e293b",
                    borderRadius: "14px",
                    padding: "20px",
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>🚀 Next Steps</h3>

                  <ul
                    style={{
                      color: "#cbd5e1",
                      lineHeight: 1.8,
                      paddingLeft: "20px",
                      marginBottom: 0,
                    }}
                  >
                    {feedback.next.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {done && !feedback && (
              <section
                style={{
                  textAlign: "center",
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid #334155",
                  borderRadius: "20px",
                  padding: "40px 25px",
                }}
              >
                <div style={{ fontSize: "52px", marginBottom: "15px" }}>🎉</div>

                <h2 style={{ fontSize: "28px", marginBottom: "10px" }}>
                  Interview Completed!
                </h2>

                <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
                  Your technical interview has been evaluated successfully.
                </p>
              </section>
            )}

            {done && feedback && (
              <section
                style={{
                  textAlign: "center",
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid #334155",
                  borderRadius: "20px",
                  padding: "35px 25px",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "10px" }}>🎉</div>

                <h2 style={{ fontSize: "28px", marginBottom: "8px" }}>
                  Interview Completed!
                </h2>

                <p style={{ color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                  Your personalized technical interview feedback is ready.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
