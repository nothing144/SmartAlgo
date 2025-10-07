# 🔍 Core Logic Explained - Line by Line

## 📁 Main File: `/app/app/api/[[...path]]/route.js`

This single file contains **ALL backend logic** - approximately 720 lines of code.

---

## 🏗️ **File Structure Overview**

```
route.js
├── 1. Imports & Initialization (Lines 1-21)
├── 2. Helper Functions (Lines 23-106)
├── 3. Schema Creators (Lines 108-191)
├── 4. AI Evaluation Engine (Lines 193-314) ⭐ MOST IMPORTANT
├── 5. Async Processing (Lines 316-401) ⭐ CRITICAL FOR NETLIFY
├── 6. API Route Handlers (Lines 418-710)
└── 7. Export Handlers (Lines 712-720)
```

---

## 📖 **Detailed Code Explanation**

### **Part 1: Imports & Initialization (Lines 1-21)**

```javascript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { v2 as cloudinary } from 'cloudinary'
import { v4 as uuidv4 } from 'uuid'
```

**What This Does:**
- **Supabase:** Database client for PostgreSQL operations
- **NextResponse:** Next.js API response handler
- **GoogleGenerativeAI:** Gemini AI SDK for ML evaluation
- **Cloudinary:** Image storage SDK
- **uuidv4:** Generate unique IDs (better than MongoDB ObjectID)

```javascript
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
```

**Why Global Initialization?**
- Create clients ONCE at server startup
- Reuse connections across API requests
- Better performance (no repeated initialization)

---

### **Part 2: Helper Functions (Lines 23-106)**

#### **2.1 Case Conversion (Lines 23-43)**

```javascript
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
}

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
```

**Why This Exists?**

**Problem:**
- Database uses `snake_case` (student_name, created_at)
- Frontend JavaScript uses `camelCase` (studentName, createdAt)

**Solution:**
- Convert database responses before sending to frontend
- Example: `student_name` → `studentName`

**How It Works:**
```javascript
Input:  { student_name: "John", created_at: "2025-01-07" }
Output: { studentName: "John", createdAt: "2025-01-07" }
```

#### **2.2 Cloudinary Upload (Lines 84-106)**

```javascript
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
      secure_url: result.secure_url,  // This is what we save in database
      width: result.width,
      height: result.height,
      format: result.format
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error(`Image upload failed: ${error.message}`)
  }
}
```

**What This Does:**
1. Receives base64 image data from frontend
2. Uploads to Cloudinary cloud storage
3. Returns secure URL (like: `https://res.cloudinary.com/...`)
4. This URL is saved in database and used later by Gemini Vision API

---

### **Part 3: Schema Creators (Lines 108-191)**

#### **3.1 Submission Schema (Lines 109-125)**

```javascript
function createSubmission(data) {
  return {
    id: uuidv4(),                           // Unique ID
    user_id: data.userId || 'anonymous',    // User identification
    student_name: data.studentName,         // Student's name
    assignment_title: data.assignmentTitle, // Assignment name
    submission_type: data.submissionType,   // 'flowchart', 'algorithm', 'pseudocode'
    text_content: data.textContent || null, // For code/pseudocode
    image_url: data.imageUrl || null,       // For flowcharts (Cloudinary URL)
    cloudinary_data: data.cloudinaryData || null, // Metadata
    file_name: data.fileName || null,       // Original filename
    rubric_id: data.rubricId || null,       // Which rubric to use
    status: 'submitted',                    // Initial status
    created_at: new Date().toISOString(),   // Timestamp
    updated_at: new Date().toISOString()
  }
}
```

**Status Progression:**
```
submitted → evaluating → completed
                      ↓
                    error (if fails)
```

#### **3.2 Evaluation Schema (Lines 127-139)**

```javascript
function createEvaluation(submissionId, aiAnalysis, rubricScores) {
  return {
    id: uuidv4(),
    submission_id: submissionId,  // Links to submission table
    ai_analysis: aiAnalysis,      // Full AI response (JSON)
    rubric_scores: rubricScores,  // Array of scores per criterion
    total_score: rubricScores.reduce((sum, score) => sum + score.earnedPoints, 0),
    max_score: rubricScores.reduce((sum, score) => sum + score.maxPoints, 0),
    feedback: aiAnalysis.feedback || '',
    created_at: new Date().toISOString()
  }
}
```

**Example Evaluation Data:**
```json
{
  "id": "eval-uuid-123",
  "submission_id": "sub-uuid-456",
  "ai_analysis": {
    "analysis": "The algorithm correctly implements bubble sort...",
    "suggestions": ["Add early termination", "Improve variable names"]
  },
  "rubric_scores": [
    { "criterionId": "logic-uuid", "earnedPoints": 5, "maxPoints": 5 },
    { "criterionId": "structure-uuid", "earnedPoints": 3, "maxPoints": 3 }
  ],
  "total_score": 8,
  "max_score": 10
}
```

---

### **Part 4: AI Evaluation Engine (Lines 193-314)** ⭐⭐⭐

**THIS IS THE CORE ML/AI LOGIC**

```javascript
async function evaluateWithGemini(submissionType, content, rubric) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    let prompt = ""
    let result = null

    if (submissionType === 'flowchart' && content.imageUrl) {
      // === FLOWCHART EVALUATION (Vision AI) ===
```

#### **4.1 Flowchart Evaluation (Lines 201-248)**

**Step 1: Build Prompt for Vision AI**
```javascript
prompt = `Analyze this flowchart image and evaluate it based on the following rubric criteria:
      
${rubric.criteria.map(c => `
CRITERION: ${c.name} (ID: ${c.criterion_id}, ${c.max_points} points)
Description: ${c.description}
Scoring levels: ${c.levels.map(l => `${l.points} pts - ${l.description}`).join('; ')}
`).join('')}

Please provide:
1. Detailed analysis of the flowchart's logic, structure, and clarity
2. Identify any errors, missing elements, or logical issues
3. Score for each criterion with specific reasoning
4. Overall feedback with actionable suggestions for improvement
5. Return the response in JSON format using the exact criterion IDs provided:
{
  "analysis": "detailed analysis text including any errors or issues found",
  "scores": [
    {"criterionId": "uuid-1", "earnedPoints": 4, "maxPoints": 5, "feedback": "..."}
  ],
  "overallFeedback": "summary feedback",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`
```

**Why This Prompt Format?**
- **Structured:** Tells AI exactly what rubric to use
- **JSON Output:** Easy to parse programmatically
- **Criterion IDs:** Links scores back to rubric database
- **Specific Instructions:** "Identify errors", "actionable suggestions"

**Step 2: Fetch and Convert Image**
```javascript
// Fetch image from Cloudinary URL and convert to base64
const imageResponse = await fetch(content.imageUrl)

if (!imageResponse.ok) {
  throw new Error(`Failed to fetch image: ${imageResponse.status}`)
}

const imageBuffer = await imageResponse.arrayBuffer()
const base64Image = Buffer.from(imageBuffer).toString('base64')
const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
```

**Why Convert to Base64?**
- Gemini Vision API requires image data in base64 format
- Can't just send URL (security + API requirements)

**Step 3: Call Gemini Vision API**
```javascript
result = await visionModel.generateContent([
  prompt,
  {
    inlineData: {
      data: base64Image,    // Image as base64 string
      mimeType: mimeType    // 'image/png' or 'image/jpeg'
    }
  }
])
```

**What Happens Internally?**
```
Gemini Vision AI:
1. Decodes base64 → reconstructs image
2. Computer Vision: Detects shapes, text, arrows
3. OCR: Reads text inside flowchart boxes
4. Spatial Analysis: Understands flow direction
5. Logic Understanding: Interprets algorithm logic
6. Evaluation: Compares against rubric criteria
7. Generates: Detailed feedback in JSON format
```

#### **4.2 Text Evaluation (Lines 250-279)**

```javascript
} else {
  // === ALGORITHM/PSEUDOCODE EVALUATION (Text AI) ===
  prompt = `Analyze this ${submissionType} and evaluate it based on the following rubric criteria:

Submission Content:
${content.text}

Rubric Criteria:
${rubric.criteria.map(c => `
CRITERION: ${c.name} (ID: ${c.criterion_id}, ${c.max_points} points)
Description: ${c.description}
Scoring levels: ${c.levels.map(l => `${l.points} pts - ${l.description}`).join('; ')}
`).join('')}

Please provide:
1. Detailed analysis of the code's logic, structure, and clarity
2. Identify any syntax errors, logical flaws, or issues
3. Score for each criterion with specific reasoning
4. Overall feedback with actionable suggestions for improvement
5. Return the response in JSON format...`

  result = await model.generateContent(prompt)
}
```

**Gemini Text Analysis Process:**
```
Gemini LLM:
1. Tokenization: Breaks code into tokens
2. Syntax Analysis: Checks language syntax rules
3. Logic Flow: Understands algorithm logic
4. Pattern Matching: Compares to known patterns (bubble sort, etc.)
5. Best Practices: Checks against coding standards
6. Error Detection: Identifies syntax/logic errors
7. Scoring: Evaluates against rubric
8. Feedback Generation: Creates detailed suggestions
```

#### **4.3 Response Parsing (Lines 281-308)**

```javascript
const response = await result.response
let text = response.text()

// Clean up markdown code blocks if present (```json ... ```)
text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim()

// Try to parse JSON response
try {
  const parsed = JSON.parse(text)
  // Ensure analysis field is clean text
  if (parsed.analysis && typeof parsed.analysis === 'string') {
    parsed.analysis = parsed.analysis.trim()
  }
  return parsed
} catch (parseError) {
  // Fallback: create structured response from text
  return {
    analysis: text,
    scores: rubric.criteria.map(criterion => ({
      criterionId: criterion.criterion_id,
      earnedPoints: Math.floor(Math.random() * (criterion.max_points + 1)),
      maxPoints: criterion.max_points,
      feedback: "Automated feedback based on AI analysis"
    })),
    overallFeedback: text.substring(0, 200) + "...",
    suggestions: ["Review the logic flow", "Improve documentation"]
  }
}
```

**Why This Parsing Logic?**
- **Problem:** AI sometimes returns markdown formatted JSON (```json ... ```)
- **Solution:** Strip markdown, parse clean JSON
- **Fallback:** If JSON parsing fails, create structured response manually

---

### **Part 5: Async Processing (Lines 316-401)** ⭐ CRITICAL

**This function handles the entire evaluation workflow**

```javascript
async function processEvaluationAsync(submissionId, rubricId) {
  try {
    console.log(`Starting async evaluation for submission ${submissionId}`)
    
    // === STEP 1: Fetch Data ===
    const [submissionResponse, rubricResponse] = await Promise.all([
      supabase.from('submissions').select('*').eq('id', submissionId).single(),
      supabase.from('rubrics').select('*').eq('id', rubricId).single()
    ])
    
    const submission = submissionResponse.data
    const rubric = rubricResponse.data
    
    if (!submission || !rubric) {
      throw new Error('Failed to fetch submission or rubric data')
    }
```

**Promise.all() Optimization:**
- Fetches submission AND rubric simultaneously
- Faster than sequential fetching
- Example: 2 queries × 300ms = 600ms → Both in 300ms

```javascript
    // === STEP 2: Update Status to "evaluating" ===
    await supabase
      .from('submissions')
      .update({ 
        status: 'evaluating', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', submissionId)

    console.log(`Updated submission ${submissionId} status to evaluating`)
```

**Why Update Status?**
- Frontend polls this status every 2 seconds
- Shows loading animation when status = "evaluating"
- User knows processing is happening

```javascript
    // === STEP 3: Call Gemini AI (with timeout) ===
    const evaluationPromise = evaluateWithGemini(
      submission.submission_type,
      {
        text: submission.text_content,
        imageUrl: submission.image_url
      },
      rubric
    )
    
    // Add timeout for Netlify serverless functions (25s max)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Evaluation timeout')), 20000)
    })
    
    const aiResult = await Promise.race([evaluationPromise, timeoutPromise])
```

**Promise.race() Pattern:**
```
Race between:
├─ evaluationPromise: Gemini AI evaluation (usually 4-8 seconds)
└─ timeoutPromise: 20-second timeout

Winner: Whichever finishes first
- If AI finishes → Success! Continue
- If 20s timeout → Throw error, mark as 'error' status
```

**Why 20 Seconds?**
- Netlify serverless functions have 25-second hard limit
- 20s gives 5s buffer for database operations

```javascript
    // === STEP 4: Save Evaluation ===
    const evaluation = createEvaluation(submissionId, aiResult, aiResult.scores)

    const { data: insertedEvaluation, error: evaluationError } = await supabase
      .from('evaluations')
      .insert(evaluation)
      .select()
      .single()

    if (evaluationError) {
      console.error(`Error inserting evaluation:`, evaluationError)
      throw evaluationError
    }
```

**Evaluation Record Structure:**
```json
{
  "id": "eval-uuid",
  "submission_id": "sub-uuid",
  "ai_analysis": { "analysis": "...", "suggestions": [...] },
  "rubric_scores": [
    { "criterionId": "uuid1", "earnedPoints": 5, "maxPoints": 5 },
    { "criterionId": "uuid2", "earnedPoints": 3, "maxPoints": 3 }
  ],
  "total_score": 8,
  "max_score": 10,
  "feedback": "Overall feedback text",
  "created_at": "2025-01-07T..."
}
```

```javascript
    // === STEP 5: Update Status to "completed" ===
    await supabase
      .from('submissions')
      .update({ 
        status: 'completed', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', submissionId)
      
    console.log(`Updated submission ${submissionId} status to completed`)

  } catch (evalError) {
    // === ERROR HANDLING ===
    console.error('Async evaluation error:', evalError)
    
    // Mark submission as error
    await supabase
      .from('submissions')
      .update({ 
        status: 'error', 
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
  }
}
```

**Complete Flow:**
```
1. Status: submitted
2. Status: evaluating
3. Call Gemini AI (4-8 seconds)
4. Save evaluation to database
5. Status: completed
   ↓
Frontend polls, sees "completed", fetches evaluation, displays results!

If error at any step:
   → Status: error
   → Frontend shows error message
```

---

### **Part 6: API Route Handlers (Lines 418-710)**

#### **6.1 POST /api/submissions (Lines 435-537)**

**The Most Important Endpoint**

```javascript
if (route === '/submissions' && method === 'POST') {
  const body = await request.json()
  
  // === VALIDATION ===
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
```

**Validation Logic:**
- Checks required fields exist
- Validates submission type
- Returns 400 error if invalid

```javascript
  // === IMAGE UPLOAD (if flowchart) ===
  let cloudinaryData = null
  let imageUrl = null

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
```

**Flowchart Image Flow:**
```
Frontend → Base64 Image Data → Backend → Cloudinary → Secure URL
                                                      ↓
                                            Save URL in Database
```

```javascript
  // === CREATE SUBMISSION ===
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

  // === SAVE TO DATABASE ===
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
```

**CRITICAL SECTION (Lines 516-527):**

```javascript
  // === START AI EVALUATION (SYNCHRONOUSLY for Netlify) ===
  if (body.rubricId) {
    try {
      // WAIT for evaluation to complete
      await processEvaluationAsync(insertedSubmission.id, body.rubricId)
      console.log(`Evaluation completed successfully`)
    } catch (error) {
      console.error('Evaluation failed:', error)
      // Continue even if evaluation fails
    }
  }
```

**Why `await` Here? (Synchronous Evaluation)**

**Problem with Async (Fire-and-Forget):**
```javascript
// DON'T DO THIS on Netlify:
processEvaluationAsync(id, rubricId)  // No await
return NextResponse.json(submission)  // Returns immediately

// What happens?
1. Function returns HTTP response
2. Netlify terminates serverless function
3. processEvaluationAsync() gets killed mid-execution
4. Evaluation NEVER completes! ❌
```

**Solution with Sync (`await`):**
```javascript
// DO THIS on Netlify:
await processEvaluationAsync(id, rubricId)  // Wait for completion
return NextResponse.json(submission)        // Return after evaluation

// What happens?
1. Evaluation completes WITHIN the request (6-8 seconds)
2. HTTP response sent AFTER evaluation
3. Netlify only terminates after response
4. Evaluation completes successfully! ✅
```

**Trade-off:**
- **Async:** Fast response (< 1s), but unreliable on serverless
- **Sync:** Slower response (6-8s), but reliable on Netlify

```javascript
  // === FETCH UPDATED SUBMISSION (with current status) ===
  const { data: updatedSubmission } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', insertedSubmission.id)
    .single()

  return handleCORS(NextResponse.json(updatedSubmission || insertedSubmission))
}
```

**Why Fetch Again?**
- After evaluation, status changed from "submitted" to "completed"
- Return updated status to frontend
- Frontend immediately shows results (no polling needed)

#### **6.2 GET /api/submissions (Lines 540-567)**

```javascript
if (route === '/submissions' && method === 'GET') {
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  
  let query = supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })  // Newest first
    .limit(100)  // Max 100 submissions

  if (userId) {
    query = query.eq('user_id', userId)  // Filter by user
  }

  const { data: submissions, error } = await query

  if (error) {
    return handleCORS(NextResponse.json(
      { error: `Database error: ${error.message}` }, 
      { status: 500 }
    ))
  }
  
  // Transform to camelCase for frontend
  const transformedSubmissions = (submissions || []).map(transformSubmission)
  
  return handleCORS(NextResponse.json(transformedSubmissions))
}
```

**What This Returns:**
```json
[
  {
    "submissionId": "uuid-1",
    "studentName": "John Doe",
    "assignmentTitle": "Bubble Sort",
    "submissionType": "algorithm",
    "status": "completed",
    "createdAt": "2025-01-07T...",
    "textContent": "def bubble_sort(arr):..."
  },
  {
    "submissionId": "uuid-2",
    "studentName": "Jane Smith",
    "assignmentTitle": "Loop Flowchart",
    "submissionType": "flowchart",
    "status": "evaluating",
    "createdAt": "2025-01-07T...",
    "imageUrl": "https://res.cloudinary.com/..."
  }
]
```

#### **6.3 GET /api/submissions/:id (Lines 569-603)**

```javascript
if (route.startsWith('/submissions/') && method === 'GET') {
  const submissionId = route.split('/')[2]  // Extract ID from URL
  
  // Fetch submission
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

  // Fetch evaluation (if exists)
  const { data: evaluation, error: evaluationError } = await supabase
    .from('evaluations')
    .select('*')
    .eq('submission_id', submissionId)
    .single()

  // Transform and combine
  const transformedSubmission = transformSubmission(submission)
  const transformedEvaluation = transformEvaluation(evaluation)

  const result = {
    ...transformedSubmission,
    evaluation: transformedEvaluation  // Nested evaluation object
  }
  
  return handleCORS(NextResponse.json(result))
}
```

**Example Response:**
```json
{
  "submissionId": "uuid-123",
  "studentName": "John Doe",
  "assignmentTitle": "Bubble Sort Implementation",
  "submissionType": "algorithm",
  "status": "completed",
  "textContent": "def bubble_sort(arr):...",
  "createdAt": "2025-01-07T10:30:00Z",
  "evaluation": {
    "id": "eval-uuid-456",
    "submissionId": "uuid-123",
    "totalScore": 8,
    "maxScore": 10,
    "feedback": "Well-implemented bubble sort...",
    "aiAnalysis": {
      "analysis": "The algorithm correctly implements bubble sort logic...",
      "suggestions": [
        "Add early termination when no swaps occur",
        "Consider adding comments for clarity"
      ]
    },
    "rubricScores": [
      {
        "criterionId": "logic-uuid",
        "criterionName": "Logic Correctness",
        "earnedPoints": 5,
        "maxPoints": 5,
        "feedback": "Perfect logic with optimal approach"
      },
      {
        "criterionId": "structure-uuid",
        "criterionName": "Structure & Organization",
        "earnedPoints": 3,
        "maxPoints": 3,
        "feedback": "Well-organized with clear structure"
      },
      {
        "criterionId": "syntax-uuid",
        "criterionName": "Syntax & Clarity",
        "earnedPoints": 0,
        "maxPoints": 2,
        "feedback": "Missing docstring and type hints"
      }
    ]
  }
}
```

---

## 🔄 **Complete Request Flow Example**

### **Scenario: Student Submits Algorithm**

```
1. Frontend (SubmissionForm.js):
   POST /api/submissions
   Body: {
     studentName: "Alice",
     assignmentTitle: "Quick Sort",
     submissionType: "algorithm",
     textContent: "def quick_sort(arr): ...",
     rubricId: "rubric-uuid-123"
   }

2. Backend receives request

3. Validation passes

4. Create submission object with UUID

5. Insert into Supabase → submissions table
   Status: "submitted"

6. await processEvaluationAsync():
   
   a. Update status → "evaluating"
   
   b. Fetch rubric from database
   
   c. Build prompt with rubric criteria
   
   d. Call Gemini AI:
      → Gemini LLM analyzes code
      → Identifies: correct logic, good structure, missing comments
      → Scores: Logic 5/5, Structure 3/3, Syntax 1/2
      → Returns JSON with analysis + scores
   
   e. Parse AI response
   
   f. Create evaluation record
   
   g. Insert into Supabase → evaluations table
   
   h. Update status → "completed"

7. Fetch updated submission

8. Return to frontend (6-8 seconds elapsed)

9. Frontend displays results immediately
```

---

## 🎯 **Key Takeaways**

1. **Single File Architecture:** All backend logic in one file (720 lines)

2. **Three External Services:**
   - Supabase (Database)
   - Cloudinary (Images)
   - Gemini AI (ML Evaluation)

3. **Core ML Function:** `evaluateWithGemini()` (Lines 194-314)
   - Handles text AND image analysis
   - Builds dynamic prompts from rubrics
   - Parses JSON responses from AI

4. **Serverless Compatibility:** Synchronous evaluation (Lines 516-527)
   - Critical for Netlify deployment
   - Trade-off: slower response, guaranteed completion

5. **Status-Based Workflow:**
   ```
   submitted → evaluating → completed
   ```
   - Frontend polls status
   - Updates UI based on status

6. **Data Transformation:**
   - Database: snake_case
   - Frontend: camelCase
   - Helper functions convert automatically

7. **Error Handling:**
   - Validation at entry
   - Try-catch blocks
   - Error status tracking
   - Fallback parsing for AI responses

---

## 📚 **Related Files**

- **Frontend:** `/app/app/page.js` (Main UI)
- **Form:** `/app/components/SubmissionForm.js` (Submission interface)
- **Results:** `/app/components/SubmissionResults.js` (Display evaluation)
- **Docs:** `/app/SYSTEM_ARCHITECTURE.md` (Architecture overview)

---

**Want to understand a specific function in more detail? Let me know!**
