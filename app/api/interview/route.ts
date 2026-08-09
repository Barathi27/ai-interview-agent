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
  questionNumber: number;
  answers: string[];
  evaluations: string[];
};

type FinalFeedback = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
};

const sessions = new Map<string, InterviewSession>();

const MODEL = "llama-3.1-8b-instant";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionId = body.sessionId;

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

      // Only use missions that were actually passed
      const completedMissions = candidateRecord.missions.filter(
        (mission) => mission.passed === true,
      );

      // Convert completed missions into curriculum topics
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

      sessions.set(sessionId, {
        candidate: candidateRecord,
        topics,
        currentTopicIndex: 0,
        questionNumber: 1,
        answers: [],
        evaluations: [],
      });

      const firstObjective =
        firstTopic.objectives?.[0] ||
        `Explain ${firstTopic.title} in your own words.`;

      return NextResponse.json({
        reply:
          `Welcome ${candidateRecord.member.name}. ` +
          `Let's begin your AI technical interview. ` +
          `We'll start with Day ${firstTopic.day}: ${firstTopic.title}. ` +
          `${firstObjective} Can you explain it in your own words?`,
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
    // STORE CANDIDATE ANSWER
    // ==========================================

    session.answers.push(body.message);

    // ==========================================
    // SAVE ANSWER TO BREETH MEMORY
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
    // SEARCH PREVIOUS BREETH MEMORY
    // ==========================================

    let previousMemory = "";

    try {
      const memoryResult = await searchMemory(
        `Previous interview answers and knowledge of ${session.candidate.member.name} about ${currentTopic.title}`,
        3,
      );

      previousMemory = JSON.stringify(memoryResult).slice(0, 1500);

      console.log("Breeth memory retrieved successfully.");
    } catch (error) {
      console.error("Breeth search error:", error);

      previousMemory = "No previous memory available.";
    }

    // ==========================================
    // AI ANSWER EVALUATION
    // ==========================================

    let aiFeedback = "AI evaluation is currently unavailable.";

    try {
      const evaluation = await openai.chat.completions.create({
        model: MODEL,

        max_tokens: 250,

        messages: [
          {
            role: "system",
            content:
              "You are an AI technical interviewer. " +
              "Evaluate the candidate's answer based on the interview topic. " +
              "Give a score from 1 to 10. " +
              "Be concise and specific. " +
              "Mention strengths and one or two areas for improvement. " +
              "Do not invent information.",
          },

          {
            role: "user",
            content: `
Topic:
${currentTopic.title}

Previous relevant memory:
${previousMemory}

Candidate answer:
${body.message}

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

    // Save AI evaluation
    session.evaluations.push(aiFeedback);

    // ==========================================
    // QUESTION 2 - GO DEEPER
    // ==========================================

    if (session.questionNumber === 1) {
      session.questionNumber = 2;

      const secondObjective =
        currentTopic.objectives?.[1] ||
        `Describe a practical use case for ${currentTopic.title}.`;

      return NextResponse.json({
        reply:
          `AI Evaluation:\n\n${aiFeedback}\n\n` +
          `Good. Let's go a little deeper into ${currentTopic.title}. ` +
          `${secondObjective} How would you approach this in a real project?`,

        done: false,

        evaluation: aiFeedback,
      });
    }

    // ==========================================
    // QUESTION 3 - PRACTICAL APPLICATION
    // ==========================================

    if (session.questionNumber === 2) {
      session.questionNumber = 3;

      return NextResponse.json({
        reply:
          `AI Evaluation:\n\n${aiFeedback}\n\n` +
          `Now let's make it practical. ` +
          `What tools or technologies from Day ${currentTopic.day} ` +
          `would you use for ${currentTopic.title}, and why?`,

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

      const objective =
        nextTopic.objectives?.[0] ||
        `Explain ${nextTopic.title} in your own words.`;

      return NextResponse.json({
        reply:
          `AI Evaluation:\n\n${aiFeedback}\n\n` +
          `Great. Let's move to another topic from your learning journey. ` +
          `Day ${nextTopic.day}: ${nextTopic.title}. ` +
          `${objective} Can you explain this concept?`,

        done: false,

        evaluation: aiFeedback,
      });
    }

    // ==========================================
    // END INTERVIEW
    // ==========================================

    let finalFeedback: FinalFeedback = {
      summary:
        `The candidate completed an interview based on ` +
        `${session.topics.length} completed curriculum topics.`,

      strengths: [
        "Demonstrated understanding of technical concepts.",
        "Attempted practical application of the concepts.",
      ],

      gaps: [
        "Some answers may require deeper technical detail.",
        "More real-world implementation examples could strengthen responses.",
      ],

      next: [
        "Practice explaining technical concepts with concrete examples.",
        "Build small projects using the completed curriculum topics.",
        "Review areas where interview answers were less detailed.",
      ],
    };

    // ==========================================
    // GENERATE FINAL AI FEEDBACK
    // ==========================================

    try {
      const finalEvaluation = await openai.chat.completions.create({
        model: MODEL,

        max_tokens: 350,

        messages: [
          {
            role: "system",
            content:
              "You are a senior technical interviewer. " +
              "Generate a concise final assessment based only on the candidate's answers. " +
              "Be specific and evidence-based. " +
              "Do not invent achievements.",
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

      const generatedFeedback = finalEvaluation.choices[0]?.message?.content;

      if (generatedFeedback) {
        finalFeedback = {
          summary: generatedFeedback,
          strengths: ["See the detailed AI-generated assessment above."],
          gaps: ["See the detailed AI-generated assessment above."],
          next: ["Follow the recommendations in the AI-generated assessment."],
        };
      }

      console.log("Final AI feedback generated successfully.");
    } catch (error) {
      console.error("Final feedback generation error:", error);
    }

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
