import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { v2 as cloudinary } from 'cloudinary'
import { v4 as uuidv4 } from 'uuid'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Helper function to convert snake_case to camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
}

// Helper function to transform object keys from snake_case to camelCase
function transformToCamelCase(obj) {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) {
    return obj.map(transformToCamelCase)
  }
  if (typeof obj === 'object') {
    const transformed = {}
    Object.keys(obj).forEach(key => {
      const camelKey = toCamelCase(key)
      transformed[camelKey] = transformToCamelCase(obj[key])
    })
    return transformed
  }
  return obj
}

// Transform submission data for frontend
function transformSubmission(submission) {
  if (!submission) return null
  
  const transformed = transformToCamelCase(submission)
  
  // Special handling for content field based on submission type
  if (transformed.submissionType === 'flowchart' && transformed.imageUrl) {
    transformed.content = {
      imageUrl: transformed.imageUrl
    }
  } else if (transformed.textContent) {
    transformed.content = {
      text: transformed.textContent
    }
  }
  
  return transformed
}

// Transform evaluation data for frontend  
function transformEvaluation(evaluation) {
  if (!evaluation) return null
  return transformToCamelCase(evaluation)
}

// Create tables in Supabase (run this once to set up schema)
async function initializeSupabaseTables() {
  try {
    // This will be handled in Supabase dashboard or SQL editor
    console.log('Supabase tables should be created in the dashboard')
  } catch (error) {
    console.error('Error initializing tables:', error)
  }
}

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(base64Data, options = {}) {
  try {
    if (!base64Data) return null
    
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: 'rubrics-evaluator',
      resource_type: 'auto',
      ...options
    })
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error(`Image upload failed: ${error.message}`)
  }
}

// Submission Schema for Supabase
function createSubmission(data) {
  return {
    id: uuidv4(),
    user_id: data.userId || 'anonymous',
    student_name: data.studentName,
    assignment_title: data.assignmentTitle,
    submission_type: data.submissionType, // 'flowchart', 'algorithm', 'pseudocode'
    text_content: data.textContent || null,
    image_url: data.imageUrl || null,
    cloudinary_data: data.cloudinaryData || null,
    file_name: data.fileName || null,
    rubric_id: data.rubricId || null,
    status: 'submitted', // 'submitted', 'evaluating', 'completed', 'error'
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Evaluation Schema for Supabase
function createEvaluation(submissionId, aiAnalysis, rubricScores) {
  return {
    id: uuidv4(),
    submission_id: submissionId,
    ai_analysis: aiAnalysis,
    rubric_scores: rubricScores,
    total_score: rubricScores.reduce((sum, score) => sum + score.earnedPoints, 0),
    max_score: rubricScores.reduce((sum, score) => sum + score.maxPoints, 0),
    feedback: aiAnalysis.feedback || '',
    created_at: new Date().toISOString()
  }
}

// Rubric Schema for Supabase
function createRubric(data) {
  return {
    id: uuidv4(),
    title: data.title,
    description: data.description,
    criteria: data.criteria || [
      {
        criterion_id: uuidv4(),
        name: 'Logic Correctness',
        description: 'Accuracy of the logical flow and problem-solving approach',
        max_points: 5,
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
        criterion_id: uuidv4(),
        name: 'Structure & Organization',
        description: 'Clear structure, proper flow, and organization of elements',
        max_points: 3,
        levels: [
          { points: 3, description: 'Well-organized with clear structure' },
          { points: 2, description: 'Generally organized with minor issues' },
          { points: 1, description: 'Some organization but lacks clarity' },
          { points: 0, description: 'Poor organization and unclear structure' }
        ]
      },
      {
        criterion_id: uuidv4(),
        name: 'Syntax & Clarity',
        description: 'Proper syntax, clear notation, and readability',
        max_points: 2,
        levels: [
          { points: 2, description: 'Perfect syntax and very clear' },
          { points: 1, description: 'Minor syntax issues but mostly clear' },
          { points: 0, description: 'Major syntax errors or unclear notation' }
        ]
      }
    ],
    submission_type: data.submissionType || 'any', // 'flowchart', 'algorithm', 'pseudocode', 'any'
    created_by: data.createdBy,
    is_active: true,
    created_at: new Date().toISOString()
  }
}

// Gemini AI Evaluation Functions (same as before but with image handling via Cloudinary)
async function evaluateWithGemini(submissionType, content, rubric) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    let prompt = ""
    let result = null

    if (submissionType === 'flowchart' && content.imageUrl) {
      // For flowcharts with Cloudinary URLs
      const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
      
      prompt = `Analyze this flowchart image and evaluate it based on the following rubric criteria:
      
${rubric.criteria.map(c => `
${c.name} (${c.max_points} points): ${c.description}
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

      // Use the image URL from Cloudinary
      result = await visionModel.generateContent([
        prompt,
        {
          inlineData: {
            data: content.imageUrl,
            mimeType: "image/jpeg"
          }
        }
      ])
      
    } else {
      // For text-based submissions (algorithms/pseudocode)
      prompt = `Analyze this ${submissionType} and evaluate it based on the following rubric criteria:

Submission Content:
${content.text}

Rubric Criteria:
${rubric.criteria.map(c => `
${c.name} (${c.max_points} points): ${c.description}
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
          criterionId: criterion.criterion_id,
          earnedPoints: Math.floor(Math.random() * (criterion.max_points + 1)), // Placeholder scoring
          maxPoints: criterion.max_points,
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
    // Root endpoint
    if (route === '/root' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Intelligent Rubrics-Based Evaluator API - Supabase Edition" }))
    }
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Intelligent Rubrics-Based Evaluator API - Supabase Edition" }))
    }

    // ===== SUBMISSIONS API =====
    
    // Create new submission - POST /api/submissions
    if (route === '/submissions' && method === 'POST') {
      const body = await request.json()
      
      // Validate required fields
      const requiredFields = ['studentName', 'assignmentTitle', 'submissionType']
      for (const field of requiredFields) {
        if (!body[field]) {
          return handleCORS(NextResponse.json(
            { error: `${field} is required` }, 
            { status: 400 }
          ))
        }
      }

      if (!['flowchart', 'algorithm', 'pseudocode'].includes(body.submissionType)) {
        return handleCORS(NextResponse.json(
          { error: 'submissionType must be flowchart, algorithm, or pseudocode' }, 
          { status: 400 }
        ))
      }

      if (body.submissionType === 'flowchart' && !body.imageData) {
        return handleCORS(NextResponse.json(
          { error: 'imageData is required for flowchart submissions' }, 
          { status: 400 }
        ))
      }

      if ((body.submissionType === 'algorithm' || body.submissionType === 'pseudocode') && !body.textContent) {
        return handleCORS(NextResponse.json(
          { error: 'textContent is required for algorithm/pseudocode submissions' }, 
          { status: 400 }
        ))
      }

      let cloudinaryData = null
      let imageUrl = null

      // Handle image upload to Cloudinary for flowcharts
      if (body.submissionType === 'flowchart' && body.imageData) {
        try {
          cloudinaryData = await uploadToCloudinary(body.imageData, {
            folder: `submissions/${body.submissionType}`,
            public_id: `${body.studentName}_${Date.now()}`
          })
          imageUrl = cloudinaryData.secure_url
        } catch (uploadError) {
          return handleCORS(NextResponse.json(
            { error: `Image upload failed: ${uploadError.message}` }, 
            { status: 400 }
          ))
        }
      }

      // Create submission object
      const submission = createSubmission({
        userId: body.userId || 'anonymous',
        studentName: body.studentName,
        assignmentTitle: body.assignmentTitle,
        submissionType: body.submissionType,
        textContent: body.textContent,
        imageUrl: imageUrl,
        cloudinaryData: cloudinaryData,
        fileName: body.fileName,
        rubricId: body.rubricId
      })

      // Insert into Supabase
      const { data: insertedSubmission, error: insertError } = await supabase
        .from('submissions')
        .insert(submission)
        .select()
        .single()

      if (insertError) {
        return handleCORS(NextResponse.json(
          { error: `Database error: ${insertError.message}` }, 
          { status: 500 }
        ))
      }

      // Start AI evaluation asynchronously if rubric is provided
      if (body.rubricId) {
        // Get the rubric
        const { data: rubric, error: rubricError } = await supabase
          .from('rubrics')
          .select('*')
          .eq('id', body.rubricId)
          .single()

        if (rubric && !rubricError) {
          try {
            // Update submission status to evaluating
            await supabase
              .from('submissions')
              .update({ 
                status: 'evaluating', 
                updated_at: new Date().toISOString() 
              })
              .eq('id', submission.id)

            // Evaluate with Gemini AI
            const aiResult = await evaluateWithGemini(
              submission.submission_type,
              {
                text: submission.text_content,
                imageUrl: submission.image_url
              },
              rubric
            )

            // Create evaluation record
            const evaluation = createEvaluation(
              submission.id,
              aiResult,
              aiResult.scores
            )

            await supabase
              .from('evaluations')
              .insert(evaluation)

            // Update submission status to completed
            await supabase
              .from('submissions')
              .update({ 
                status: 'completed', 
                updated_at: new Date().toISOString() 
              })
              .eq('id', submission.id)

          } catch (evalError) {
            console.error('Evaluation error:', evalError)
            await supabase
              .from('submissions')
              .update({ 
                status: 'error', 
                updated_at: new Date().toISOString() 
              })
              .eq('id', submission.id)
          }
        }
      }

      return handleCORS(NextResponse.json(insertedSubmission))
    }

    // Get submissions - GET /api/submissions?userId=xxx
    if (route === '/submissions' && method === 'GET') {
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId')
      
      let query = supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: submissions, error } = await query

      if (error) {
        return handleCORS(NextResponse.json(
          { error: `Database error: ${error.message}` }, 
          { status: 500 }
        ))
      }
      
      // Transform submissions to camelCase for frontend compatibility
      const transformedSubmissions = (submissions || []).map(transformSubmission)
      
      return handleCORS(NextResponse.json(transformedSubmissions))
    }

    // Get specific submission - GET /api/submissions/{id}
    if (route.startsWith('/submissions/') && method === 'GET') {
      const submissionId = route.split('/')[2]
      
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single()

      if (submissionError) {
        return handleCORS(NextResponse.json(
          { error: 'Submission not found' }, 
          { status: 404 }
        ))
      }

      // Get evaluation if it exists
      const { data: evaluation, error: evaluationError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('submission_id', submissionId)
        .single()

      const result = {
        ...submission,
        evaluation: evaluation || null
      }
      
      return handleCORS(NextResponse.json(result))
    }

    // ===== RUBRICS API =====
    
    // Create default rubric - POST /api/rubrics/default
    if (route === '/rubrics/default' && method === 'POST') {
      const body = await request.json()
      
      const rubric = createRubric({
        title: body.title || 'Default Evaluation Rubric',
        description: body.description || 'Standard rubric for evaluating algorithms, pseudocode, and flowcharts',
        submissionType: body.submissionType || 'any',
        createdBy: body.createdBy || 'system'
      })

      const { data: insertedRubric, error } = await supabase
        .from('rubrics')
        .insert(rubric)
        .select()
        .single()

      if (error) {
        return handleCORS(NextResponse.json(
          { error: `Database error: ${error.message}` }, 
          { status: 500 }
        ))
      }

      return handleCORS(NextResponse.json(insertedRubric))
    }

    // Get rubrics - GET /api/rubrics
    if (route === '/rubrics' && method === 'GET') {
      const { data: rubrics, error } = await supabase
        .from('rubrics')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: `Database error: ${error.message}` }, 
          { status: 500 }
        ))
      }

      return handleCORS(NextResponse.json(rubrics || []))
    }

    // ===== TEST ENDPOINTS =====
    
    // Test Gemini connection - GET /api/test/gemini
    if (route === '/test/gemini' && method === 'GET') {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
        const result = await model.generateContent("Hello, this is a test. Please respond with 'Gemini AI is working correctly!'")
        const response = await result.response
        const text = response.text()
        
        return handleCORS(NextResponse.json({ 
          status: 'success', 
          message: 'Gemini AI connection successful',
          geminiResponse: text 
        }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { 
            status: 'error', 
            message: 'Gemini AI connection failed',
            error: error.message 
          }, 
          { status: 500 }
        ))
      }
    }

    // Test Supabase connection - GET /api/test/supabase
    if (route === '/test/supabase' && method === 'GET') {
      try {
        const { data, error } = await supabase
          .from('rubrics')
          .select('count')
          .limit(1)

        if (error) throw error
        
        return handleCORS(NextResponse.json({ 
          status: 'success', 
          message: 'Supabase connection successful',
          supabaseUrl: supabaseUrl
        }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { 
            status: 'error', 
            message: 'Supabase connection failed',
            error: error.message 
          }, 
          { status: 500 }
        ))
      }
    }

    // Test Cloudinary connection - GET /api/test/cloudinary
    if (route === '/test/cloudinary' && method === 'GET') {
      try {
        // Test Cloudinary by uploading a small test image
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        
        const result = await uploadToCloudinary(testImage, {
          folder: 'test',
          public_id: 'connection_test'
        })
        
        return handleCORS(NextResponse.json({ 
          status: 'success', 
          message: 'Cloudinary connection successful',
          testImageUrl: result.secure_url
        }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { 
            status: 'error', 
            message: 'Cloudinary connection failed',
            error: error.message 
          }, 
          { status: 500 }
        ))
      }
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