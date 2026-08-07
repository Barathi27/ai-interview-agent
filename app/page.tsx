export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-cyan-400">
          AI Interview Agent
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Your learning journey.
          <br />
          Your technical interview.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Practice realistic AI engineering interviews based on the topics
          you've actually learned throughout the 31-day AI Cohort.
        </p>

        <button className="mt-10 rounded-xl bg-cyan-400 px-7 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300">
          Start Interview
        </button>

        <div className="mt-12 flex gap-8 text-sm text-slate-400">
          <span>31-Day Curriculum</span>
          <span>•</span>
          <span>Adaptive Questions</span>
          <span>•</span>
          <span>Personalized Feedback</span>
        </div>
      </div>
    </main>
  );
}
