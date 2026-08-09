# AI Usage Log

## Project

AI Technical Interview Platform

## AI Tools Used

- ChatGPT
- Claude / Claude Code

## How AI Was Used

AI assistance was used during the development of this project for planning, coding, debugging, testing, and improving the application.

## 1. Project Architecture

**Prompt / Task:**

> Help design an AI-powered technical interview platform using Next.js, an LLM API, candidate curriculum data, memory, dynamic question generation, and Vercel deployment.

**AI assistance was used to:**

- Plan the interview flow
- Structure the frontend and backend
- Identify the required components
- Plan the LLM and memory integration

## 2. Interview API

**Prompt / Task:**

> Create a Next.js API route for an AI technical interview that starts an interview session, loads the candidate's completed curriculum topics, accepts answers, evaluates them using an LLM, and generates final feedback.

**AI assistance was used to implement:**

- Interview session management
- Candidate lookup
- Curriculum topic selection
- Answer processing
- AI evaluation
- Final interview feedback

## 3. LLM Integration

**Prompt / Task:**

> Integrate an OpenAI-compatible LLM API into the interview system and use it to evaluate candidate answers.

**AI assistance was used to:**

- Configure the LLM client
- Create evaluation prompts
- Generate scores
- Generate strengths and improvement areas
- Generate final interview assessments

## 4. Breeth Memory Integration

**Prompt / Task:**

> Add memory to the interview system so candidate answers can be stored and previous relevant interview context can be retrieved.

**AI assistance was used to implement:**

- Saving candidate answers to Breeth
- Searching previous candidate context
- Passing relevant memory to the LLM
- Memory-aware evaluation

## 5. Dynamic Interview Questions

**Problem:**

The initial implementation used fixed question templates, which caused the same questions to repeat for different interviews.

**Prompt / Task:**

> Replace the fixed interview questions with dynamically generated AI questions. Track previously asked questions and instruct the AI not to repeat or paraphrase them.

**AI assistance was used to implement:**

- Dynamic question generation
- Question history tracking
- Non-repeating question prompts
- Conceptual questions
- Deeper real-world questions
- Practical engineering questions

## 6. AI Answer Evaluation

**Prompt / Task:**

> Evaluate each candidate answer from 1 to 10 and provide strengths, areas for improvement, and a memory-aware observation.

**AI assistance was used to create structured interview feedback after each answer.**

## 7. Frontend Development

**Prompt / Task:**

> Build a professional AI technical interview interface using Next.js with candidate ID input, interview questions, answer submission, AI evaluation, loading states, and an interview completion screen.

**AI assistance was used to implement and improve:**

- Candidate input
- Start interview flow
- Question display
- Answer textarea
- Submit button
- AI evaluation section
- Interview completion state
- Error handling
- Loading states

## 8. Debugging and Optimization

**Prompt / Task:**

> Help debug repeated interview questions, API errors, rate-limit issues, and deployment problems.

AI assistance was used to:

- Analyze errors
- Improve API flow
- Reduce unnecessary API calls
- Fix interview state handling
- Improve dynamic question generation
- Prepare the application for production deployment

## 9. Deployment

**Prompt / Task:**

> Help deploy the Next.js AI interview application to GitHub and Vercel and configure the required environment variables.

AI assistance was used to configure:

- `GROQ_API_KEY`
- `BREETH_API_KEY`
- Vercel deployment
- Production environment testing

## 10. Testing

The application was tested locally using:

```bash
npm run build
```

The production application was also tested after deployment.

Testing confirmed:

- The application builds successfully
- The interview can be started
- Candidate questions are generated
- Candidate answers are evaluated
- Memory integration works
- Questions are dynamically generated
- Questions are no longer fixed/repeated
- Final interview feedback is generated

## Human Review

AI-generated code and suggestions were reviewed, modified, tested, and integrated by the developer.

The final implementation was validated through local testing and live Vercel deployment.

## Final AI-Assisted Workflow

```text
Candidate
   ↓
Candidate ID
   ↓
Completed Curriculum Topics
   ↓
AI-generated Interview Question
   ↓
Candidate Answer
   ↓
Breeth Memory
   ↓
AI Evaluation
   ↓
New Non-Repeating Question
   ↓
Next Topic
   ↓
Final AI Interview Feedback
```
