import { NextResponse } from "next/server";

import curriculum from "../../../data/curriculum.json";
import candidates from "../../../data/candidates.json";
import openai from "../../../lib/openai";
import { saveMemory, searchMemory } from "../../../lib/breeth";

type CurriculumTopic = {
  day: number;
  title: string;
  objectives?: string[];
  tools?: string[];
  attempts?: number;
  [key: string]: unknown;
};

type InterviewCandidate = {
  member: {
    id: string;
    name: string;
    jobRole: string;
    yearsExperience: number;
    education: string;
    status: string;
  };

  missions: {
    day: number;
    title: string;
    passed?: boolean;
    attempts?: number;
    skipped?: boolean;
  }[];
};

type InterviewSession = {
  candidate: InterviewCandidate;
  topics: CurriculumTopic[];

  currentTopicIndex: number;

  // 1 = conceptual
  // 2 = deeper/real-world
  // 3 = practical/tools
  questionNumber: number;

  answers: string[];
  evaluations: string[];

  // NEW:
  // Stores questions already asked in this interview.
  questionsAsked: string[];
};

type FinalFeedback = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
};

const sessions = new Map<string, InterviewSession>();

// ==========================================
// HELPER - GENERATE AI QUESTION
// ==========================================

async function generateInterviewQuestion(
  session: InterviewSession,
  topic: CurriculumTopic,
  questionNumber: number,
  previousAnswer: string = "",
): Promise<string> {
  const previousQuestions =
    session.questionsAsked.length > 0
      ? session.questionsAsked
          .map((question, index) => `${index + 1}. ${question}`)
          .join("\n")
      : "No previous questions.";

  const objectives = topic.objectives?.length
    ? topic.objectives.map((objective) => `- ${objective}`).join("\n")
    : `- Explain ${topic.title} in your own words.`;

  const tools = topic.tools?.length
    ? topic.tools.map((tool) => `- ${tool}`).join("\n")
    : "No specific tools listed.";

  let questionType = "";

  if (questionNumber === 1) {
    questionType =
      "Ask a conceptual question that checks whether the candidate genuinely understands the topic.";
  } else if (questionNumber === 2) {
    questionType =
      "Ask a deeper real-world or implementation question. Build on the candidate's previous answer, but test a different aspect of the topic.";
  } else {
    questionType =
      "Ask a practical engineering question involving tools, technologies, architecture, debugging, trade-offs, or implementation.";
  }

  try {
    const result = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content:
            "You are a senior technical interviewer. " +
            "Generate ONE interview question for the candidate. " +
            "The question must test the specified topic. " +
            "Do not repeat or paraphrase any previous question. " +
            "Do not ask the same concept in slightly different words. " +
            "Ask a different aspect of the topic. " +
            "The question should be appropriate for a technical interview. " +
            "Return ONLY the question. " +
            "Do not include labels such as Question:, Answer:, or Explanation.",
        },

        {
          role: "user",
          content: `
Candidate role:
${session.candidate.member.jobRole}

Candidate experience:
${session.candidate.member.yearsExperience} years

Current topic:
Day ${topic.day}: ${topic.title}

Learning objectives:
${objectives}

Available tools/technologies:
${tools}

Question number:
${questionNumber} of 3

Question type:
${questionType}

Previous questions from this interview:
${previousQuestions}

Candidate's previous answer for this topic:
${previousAnswer || "No previous answer available."}

IMPORTANT REQUIREMENTS:

1. Generate exactly ONE new question.
2. Do NOT repeat a previous question.
3. Do NOT paraphrase a previous question.
4. Test a different aspect of the topic.
5. Keep it clear and interview-friendly.
6. Make it specific to "${topic.title}".
7. Do not ask multiple unrelated questions.
8. Return ONLY the question.
`,
        },
      ],
    });

    const generatedQuestion = result.choices[0]?.message?.content?.trim();

    if (generatedQuestion) {
      return generatedQuestion;
    }
  } catch (error) {
    console.error("Question generation error:", error);
  }

  // ==========================================
  // FALLBACK QUESTIONS
  // ==========================================

  const fallbackQuestions: Record<number, string> = {
    1: `Can you explain ${topic.title} in your own words and describe why it is important?`,

    2: `How would you apply ${topic.title} in a real-world project? Explain your approach.`,

    3: `What tools or technologies would you use when implementing ${topic.title}, and why?`,
  };

  const fallback = fallbackQuestions[questionNumber];

  // Make sure even fallback doesn't exactly repeat.
  if (!session.questionsAsked.includes(fallback)) {
    return fallback;
  }

  return `What is one important implementation challenge you would consider when working with ${topic.title}?`;
}

// ==========================================
// HELPER - GENERATE FINAL FEEDBACK
// ==========================================

async function generateFinalFeedback(
  session: InterviewSession,
): Promise<FinalFeedback> {
  const defaultFeedback: FinalFeedback = {
    summary:
      `The candidate completed an interview based on ` +
      `${session.topics.length} completed curriculum topics.`,

    strengths: [
      "Demonstrated understanding of technical concepts.",
      "Attempted practical application of the concepts.",
      "Participated consistently throughout the interview.",
    ],

    gaps: [
      "Some answers may require deeper technical detail.",
      "More real-world implementation examples could strengthen responses.",
      "Architecture and trade-off explanations could be improved.",
    ],

    next: [
      "Practice explaining technical concepts with concrete examples.",
      "Build small projects using the completed curriculum topics.",
      "Review areas where interview answers were less detailed.",
    ],
  };

  try {
    const finalEvaluation = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content:
            "You are a senior technical interviewer. " +
            "Generate a final interview assessment based only on the provided data. " +
            "Be concise, specific, and evidence-based. " +
            "Do not invent achievements. " +
            "Return the assessment in exactly the requested format.",
        },

        {
          role: "user",
          content: `
Candidate:
${session.candidate.member.name}

Role:
${session.candidate.member.jobRole}

Experience:
${session.candidate.member.yearsExperience} years

Topics covered:
${session.topics
  .map((topic: CurriculumTopic) => `Day ${topic.day}: ${topic.title}`)
  .join("\n")}

Questions asked:
${session.questionsAsked
  .map((question: string, index: number) => `${index + 1}. ${question}`)
  .join("\n\n")}

Candidate answers:
${session.answers
  .map((answer: string, index: number) => `${index + 1}. ${answer}`)
  .join("\n\n")}

AI evaluations:
${session.evaluations
  .map((evaluation: string, index: number) => `${index + 1}. ${evaluation}`)
  .join("\n\n")}

Generate the final assessment.

Return exactly:

Summary:
...

Strengths:

- ...
- ...
- ...

Gaps:

- ...
- ...
- ...

Next Steps:

- ...
- ...
- ...
`,
        },
      ],
    });

    const generatedFeedback =
      finalEvaluation.choices[0]?.message?.content?.trim();

    if (generatedFeedback) {
      return {
        summary: generatedFeedback,
        strengths: ["See the AI-generated assessment above."],
        gaps: ["See the AI-generated assessment above."],
        next: ["Follow the recommendations in the AI-generated assessment."],
      };
    }
  } catch (error) {
    console.error("Final feedback generation error:", error);
  }

  return defaultFeedback;
}

// ==========================================
// POST
// ==========================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionId = body.sessionId;

    // ==========================================
    // VALIDATE SESSION ID
    // ==========================================

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "sessionId is required.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // START INTERVIEW
    // ==========================================

    if (body.candidate && !body.message) {
      const candidateId = body.candidate?.member?.id || body.candidate?.id;

      const candidateRecord = candidates.candidates.find(
        (item) => item.member.id === candidateId,
      );

      if (!candidateRecord) {
        return NextResponse.json(
          {
            error: `Candidate ${candidateId} not found.`,
          },
          { status: 404 },
        );
      }

      // ==========================================
      // ONLY PASSED MISSIONS
      // ==========================================

      const completedMissions = candidateRecord.missions.filter(
        (mission) => mission.passed === true,
      );

      // ==========================================
      // CONVERT MISSIONS → CURRICULUM TOPICS
      // ==========================================

      const topics: CurriculumTopic[] = completedMissions
        .map((mission): CurriculumTopic | null => {
          const curriculumDay = curriculum.days.find(
            (day) => day.day === mission.day,
          );

          if (!curriculumDay) {
            return null;
          }

          return {
            ...curriculumDay,
            attempts: mission.attempts,
          };
        })
        .filter((topic): topic is CurriculumTopic => topic !== null);

      if (topics.length === 0) {
        return NextResponse.json(
          {
            error: "No completed curriculum topics found for this candidate.",
          },
          { status: 400 },
        );
      }

      const firstTopic = topics[0];

      // ==========================================
      // CREATE SESSION
      // ==========================================

      const newSession: InterviewSession = {
        candidate: candidateRecord,
        topics,

        currentTopicIndex: 0,

        questionNumber: 1,

        answers: [],

        evaluations: [],

        // NEW
        questionsAsked: [],
      };

      sessions.set(sessionId, newSession);

      // ==========================================
      // GENERATE FIRST QUESTION WITH AI
      // ==========================================

      const firstQuestion = await generateInterviewQuestion(
        newSession,
        firstTopic,
        1,
      );

      newSession.questionsAsked.push(firstQuestion);

      return NextResponse.json({
        reply:
          `Welcome ${candidateRecord.member.name}. ` +
          `Let's begin your AI technical interview. ` +
          `We'll start with Day ${firstTopic.day}: ${firstTopic.title}.\n\n` +
          `${firstQuestion}`,

        done: false,
      });
    }

    // ==========================================
    // CONTINUE INTERVIEW
    // ==========================================

    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          error: "Interview session not found. Please start a new interview.",
        },
        { status: 404 },
      );
    }

    if (!body.message) {
      return NextResponse.json(
        {
          error: "message is required.",
        },
        { status: 400 },
      );
    }

    const currentTopic = session.topics[session.currentTopicIndex];

    if (!currentTopic) {
      return NextResponse.json(
        {
          error: "Current interview topic not found.",
        },
        { status: 500 },
      );
    }

    // ==========================================
    // STORE ANSWER
    // ==========================================

    session.answers.push(body.message);

    // ==========================================
    // SAVE ANSWER TO BREETH
    // ==========================================

    try {
      await saveMemory(
        `Candidate ${session.candidate.member.name} answered an interview question about ${currentTopic.title}: ${body.message}`,
        session.candidate.member.id,
      );

      console.log("Breeth memory saved successfully.");
    } catch (error) {
      console.error("Breeth save error:", error);
    }

    // ==========================================
    // SEARCH PREVIOUS MEMORY
    // ==========================================

    let previousMemory = "No previous memory available.";

    try {
      const memoryResult = await searchMemory(
        `Previous interview answers and knowledge of ${session.candidate.member.name} about ${currentTopic.title}`,
        5,
      );

      previousMemory = JSON.stringify(memoryResult).slice(0, 2500);

      console.log("Breeth memory retrieved successfully.");
    } catch (error) {
      console.error("Breeth search error:", error);
    }

    // ==========================================
    // AI EVALUATION
    // ==========================================

    let aiFeedback = "AI evaluation is currently unavailable.";

    try {
      const evaluation = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "system",
            content:
              "You are a senior AI technical interviewer. " +
              "Evaluate the candidate's current answer. " +
              "Give a score from 1 to 10. " +
              "Mention strengths and areas for improvement. " +
              "Use previous memory only when relevant. " +
              "Do not invent information. " +
              "Be concise and evidence-based.",
          },

          {
            role: "user",
            content: `
Topic:
Day ${currentTopic.day}: ${currentTopic.title}

Previous memory/context:
${previousMemory}

Previous questions:
${session.questionsAsked
  .map((question, index) => `${index + 1}. ${question}`)
  .join("\n")}

Candidate's current answer:
${body.message}

Evaluate the answer.

Return exactly:

Score: X/10

Strengths:

- ...

Areas for improvement:

- ...

Memory-aware observation:

- ...
`,
          },
        ],
      });

      aiFeedback =
        evaluation.choices[0]?.message?.content ||
        "Unable to evaluate the answer.";

      console.log("=================================");

      console.log("AI FEEDBACK");

      console.log(aiFeedback);

      console.log("=================================");
    } catch (error) {
      console.error("AI evaluation error:", error);

      aiFeedback =
        "AI evaluation is currently unavailable because the AI API could not be reached.";
    }

    // ==========================================
    // SAVE EVALUATION
    // ==========================================

    session.evaluations.push(aiFeedback);

    // ==========================================
    // QUESTION 2
    // ==========================================

    if (session.questionNumber === 1) {
      session.questionNumber = 2;

      const nextQuestion = await generateInterviewQuestion(
        session,
        currentTopic,
        2,
        body.message,
      );

      session.questionsAsked.push(nextQuestion);

      return NextResponse.json({
        reply:
          `AI Evaluation:\n\n${aiFeedback}\n\n` +
          `Let's go a little deeper into ${currentTopic.title}.\n\n` +
          `${nextQuestion}`,

        done: false,

        evaluation: aiFeedback,
      });
    }

    // ==========================================
    // QUESTION 3
    // ==========================================

    if (session.questionNumber === 2) {
      session.questionNumber = 3;

      const nextQuestion = await generateInterviewQuestion(
        session,
        currentTopic,
        3,
        body.message,
      );

      session.questionsAsked.push(nextQuestion);

      return NextResponse.json({
        reply:
          `AI Evaluation:\n\n${aiFeedback}\n\n` +
          `Now let's make it practical.\n\n` +
          `${nextQuestion}`,

        done: false,

        evaluation: aiFeedback,
      });
    }

    // ==========================================
    // MOVE TO NEXT TOPIC
    // ==========================================

    if (
      session.questionNumber === 3 &&
      session.currentTopicIndex < session.topics.length - 1
    ) {
      session.currentTopicIndex++;

      session.questionNumber = 1;

      const nextTopic = session.topics[session.currentTopicIndex];

      const nextQuestion = await generateInterviewQuestion(
        session,
        nextTopic,
        1,
      );

      session.questionsAsked.push(nextQuestion);

      return NextResponse.json({
        reply:
          `AI Evaluation:\n\n${aiFeedback}\n\n` +
          `Great. Let's move to another topic from your learning journey.\n\n` +
          `Day ${nextTopic.day}: ${nextTopic.title}\n\n` +
          `${nextQuestion}`,

        done: false,

        evaluation: aiFeedback,
      });
    }

    // ==========================================
    // END INTERVIEW
    // ==========================================

    const finalFeedback = await generateFinalFeedback(session);

    console.log("Final AI feedback generated successfully.");

    // ==========================================
    // DELETE SESSION
    // ==========================================

    sessions.delete(sessionId);

    // ==========================================
    // FINAL RESPONSE
    // ==========================================

    return NextResponse.json({
      reply: `AI Evaluation:\n\n${aiFeedback}\n\n` + "🎉 Interview completed.",

      done: true,

      evaluation: aiFeedback,

      feedback: finalFeedback,
    });
  } catch (error) {
    console.error("Interview API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while processing the interview.",
      },
      { status: 500 },
    );
  }
}
