"use client";

import { useState } from "react";

export default function InterviewPage() {
  const [sessionId, setSessionId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  const startInterview = async () => {
    if (!candidateId) {
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
          candidate: {
            id: candidateId,
          },
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
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
      <h1>AI Technical Interview</h1>

      {!started && (
        <div>
          <h2>Start Interview</h2>

          <input
            type="text"
            placeholder="Enter Candidate ID"
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
            }}
          />

          <button onClick={startInterview} disabled={loading}>
            {loading ? "Starting..." : "Start Interview"}
          </button>
        </div>
      )}

      {started && (
        <div>
          <h2>Interview Question</h2>

          <p>{question}</p>

          {!done && (
            <>
              <textarea
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "15px",
                }}
              />

              <br />

              <button
                onClick={submitAnswer}
                disabled={loading}
                style={{ marginTop: "15px" }}
              >
                {loading ? "AI is evaluating..." : "Submit Answer"}
              </button>
            </>
          )}

          {evaluation && (
            <div style={{ marginTop: "30px" }}>
              <h2>AI Evaluation</h2>

              <pre style={{ whiteSpace: "pre-wrap" }}>{evaluation}</pre>
            </div>
          )}

          {done && (
            <h2 style={{ marginTop: "30px" }}>🎉 Interview Completed!</h2>
          )}
        </div>
      )}
    </main>
  );
}
