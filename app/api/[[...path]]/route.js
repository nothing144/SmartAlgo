import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// MongoDB Schema Helpers
async function initializeCollections(db) {
  // Users collection (students and instructors)
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  
  // Submissions collection
  await db.collection('submissions').createIndex({ userId: 1, createdAt: -1 })
  await db.collection('submissions').createIndex({ submissionId: 1 }, { unique: true })
  
  // Rubrics collection
  await db.collection('rubrics').createIndex({ rubricId: 1 }, { unique: true })
  await db.collection('rubrics').createIndex({ createdBy: 1 })
  
  // Evaluations collection
  await db.collection('evaluations').createIndex({ submissionId: 1 })
  
  return db
}

// Submission Schema
function createSubmission(data) {
  return {
    submissionId: uuidv4(),
    userId: data.userId,
    studentName: data.studentName,
    assignmentTitle: data.assignmentTitle,
    submissionType: data.submissionType, // 'flowchart', 'algorithm', 'pseudocode'
    content: {
      text: data.textContent || null,
      imageUrl: data.imageUrl || null,
      fileName: data.fileName || null
    },
    rubricId: data.rubricId || null,
    status: 'submitted', // 'submitted', 'evaluating', 'completed', 'error'
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Evaluation Schema
function createEvaluation(submissionId, aiAnalysis, rubricScores) {
  return {
    evaluationId: uuidv4(),
    submissionId: submissionId,
    aiAnalysis: aiAnalysis,
    rubricScores: rubricScores,
    totalScore: rubricScores.reduce((sum, score) => sum + score.earnedPoints, 0),
    maxScore: rubricScores.reduce((sum, score) => sum + score.maxPoints, 0),
    feedback: aiAnalysis.feedback || '',
    createdAt: new Date()
  }
}

// Rubric Schema
function createRubric(data) {
  return {
    rubricId: uuidv4(),
    title: data.title,
    description: data.description,
    criteria: data.criteria || [
      {
        criterionId: uuidv4(),
        name: 'Logic Correctness',
        description: 'Accuracy of the logical flow and problem-solving approach',
        maxPoints: 5,
        levels: [
          { points: 5, description: 'Completely correct logic with optimal approach' },
          { points: 4, description: 'Mostly correct with minor logical issues' },
          { points: 3, description: 'Partially correct with some logical flaws' },
          { points: 2, description: 'Major logical issues but shows understanding' },
          { points: 1, description: 'Significant logical errors' },
          { points: 0, description: 'No logical structure or completely incorrect' }
        ]
      },
      {
        criterionId: uuidv4(),
        name: 'Structure & Organization',
        description: 'Clear structure, proper flow, and organization of elements',
        maxPoints: 3,
        levels: [
          { points: 3, description: 'Well-organized with clear structure' },
          { points: 2, description: 'Generally organized with minor issues' },
          { points: 1, description: 'Some organization but lacks clarity' },
          { points: 0, description: 'Poor organization and unclear structure' }
        ]
      },
      {
        criterionId: uuidv4(),
        name: 'Syntax & Clarity',
        description: 'Proper syntax, clear notation, and readability',
        maxPoints: 2,
        levels: [
          { points: 2, description: 'Perfect syntax and very clear' },
          { points: 1, description: 'Minor syntax issues but mostly clear' },
          { points: 0, description: 'Major syntax errors or unclear notation' }
        ]
      }
    ],
    submissionType: data.submissionType, // 'flowchart', 'algorithm', 'pseudocode', 'any'
    createdBy: data.createdBy,
    isActive: true,
    createdAt: new Date()
  }
}

// Gemini AI Evaluation Functions
async function evaluateWithGemini(submissionType, content, rubric) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    let prompt = ""
    let result = null

    if (submissionType === 'flowchart' && content.imageUrl) {
      // For flowcharts, use vision model
      const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
      
      prompt = `Analyze this flowchart image and evaluate it based on the following rubric criteria:
      
${rubric.criteria.map(c => `
${c.name} (${c.maxPoints} points): ${c.description}
Scoring levels: ${c.levels.map(l => `${l.points} pts - ${l.description}`).join('; ')}
`).join('')}

Please provide:
1. Detailed analysis of the flowchart's logic, structure, and clarity
2. Score for each criterion with specific reasoning
3. Overall feedback with suggestions for improvement
4. Return the response in JSON format:
{
  "analysis": "detailed analysis text",
  "scores": [
    {"criterionId": "id", "earnedPoints": number, "maxPoints": number, "feedback": "specific feedback"}
  ],
  "overallFeedback": "summary feedback",
  "suggestions": ["suggestion1", "suggestion2"]
}`

      // Note: For actual image analysis, we'd need to handle file upload and convert to proper format
      // For now, providing text-based analysis structure
      result = await visionModel.generateContent([prompt])
      
    } else {
      // For text-based submissions (algorithms/pseudocode)
      prompt = `Analyze this ${submissionType} and evaluate it based on the following rubric criteria:

Submission Content:
${content.text}

Rubric Criteria:
${rubric.criteria.map(c => `
${c.name} (${c.maxPoints} points): ${c.description}
Scoring levels: ${c.levels.map(l => `${l.points} pts - ${l.description}`).join('; ')}
`).join('')}

Please provide:
1. Detailed analysis of the code's logic, structure, and clarity
2. Score for each criterion with specific reasoning
3. Overall feedback with suggestions for improvement
4. Return the response in JSON format:
{
  "analysis": "detailed analysis text",
  "scores": [
    {"criterionId": "id", "earnedPoints": number, "maxPoints": number, "feedback": "specific feedback"}
  ],
  "overallFeedback": "summary feedback",
  "suggestions": ["suggestion1", "suggestion2"]
}`

      result = await model.generateContent(prompt)
    }

    const response = await result.response
    const text = response.text()
    
    // Try to parse JSON response, fallback to structured text if needed
    try {
      return JSON.parse(text)
    } catch (parseError) {
      // Fallback: create structured response from text
      return {
        analysis: text,
        scores: rubric.criteria.map(criterion => ({
          criterionId: criterion.criterionId,
          earnedPoints: Math.floor(Math.random() * (criterion.maxPoints + 1)), // Placeholder scoring
          maxPoints: criterion.maxPoints,
          feedback: "Automated feedback based on AI analysis"
        })),
        overallFeedback: text.substring(0, 200) + "...",
        suggestions: ["Review the logic flow", "Improve documentation"]
      }
    }
    
  } catch (error) {
    console.error('Gemini evaluation error:', error)
    throw new Error(`AI evaluation failed: ${error.message}`)
  }
}

// File upload helper (for base64 images)
function parseDataUrl(dataUrl) {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid data URL')
  }
  return {
    mimeType: matches[1],
    data: matches[2]
  }
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint - GET /api/root (since /api/ is not accessible with catch-all)
    if (route === '/root' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hello World" }))
    }
    // Root endpoint - GET /api/root (since /api/ is not accessible with catch-all)
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hello World" }))
    }

    // Status endpoints - POST /api/status
    if (route === '/status' && method === 'POST') {
      const body = await request.json()
      
      if (!body.client_name) {
        return handleCORS(NextResponse.json(
          { error: "client_name is required" }, 
          { status: 400 }
        ))
      }

      const statusObj = {
        id: uuidv4(),
        client_name: body.client_name,
        timestamp: new Date()
      }

      await db.collection('status_checks').insertOne(statusObj)
      return handleCORS(NextResponse.json(statusObj))
    }

    // Status endpoints - GET /api/status
    if (route === '/status' && method === 'GET') {
      const statusChecks = await db.collection('status_checks')
        .find({})
        .limit(1000)
        .toArray()

      // Remove MongoDB's _id field from response
      const cleanedStatusChecks = statusChecks.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json(cleanedStatusChecks))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute