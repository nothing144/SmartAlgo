# 🎓 Smart Evaluator - AI-Powered Rubrics-Based Assessment

An intelligent evaluation system for flowcharts, algorithms, and pseudocode using Machine Learning (Google Gemini AI).

## 🚀 Live Demo

**Production:** [smartalgo.netlify.app](https://smartalgo.netlify.app)

---

## ✨ Features

- 📝 **Multi-Format Support** - Flowcharts (images), algorithms, and pseudocode
- 🤖 **AI-Powered Evaluation** - Google Gemini 2.0 Flash (Text + Vision APIs)
- 📊 **Rubric-Based Scoring** - Consistent evaluation criteria
- ⚡ **Instant Feedback** - Detailed analysis and suggestions in 6-8 seconds
- 💾 **Cloud Storage** - Supabase (database) + Cloudinary (images)
- 🎨 **Modern UI** - Next.js + Tailwind CSS + Shadcn

---

## 🛠️ Tech Stack

### **Frontend**
- Next.js 14.2 (React)
- Tailwind CSS
- Shadcn/ui Components
- React Hooks

### **Backend**
- Next.js API Routes (Serverless)
- Node.js

### **Database & Storage**
- Supabase (PostgreSQL)
- Cloudinary (Image CDN)

### **AI/ML**
- Google Gemini AI (`gemini-2.0-flash-exp`)
- Vision API for flowchart analysis
- LLM for code evaluation

---

## 📁 Project Structure

```
/app/
├── app/
│   ├── api/[[...path]]/route.js  # 🔥 All backend logic (720 lines)
│   ├── page.js                    # Main frontend page
│   ├── layout.js                  # App layout
│   └── globals.css                # Global styles
├── components/
│   ├── SubmissionForm.js          # Submission interface
│   ├── SubmissionResults.js       # Results display
│   ├── FileUpload.js              # Image upload
│   └── CodeEditor.js              # Code editor
├── lib/
│   └── utils.js                   # Utility functions
├── CODE_EXPLANATION.md            # 📖 Line-by-line code walkthrough
├── SYSTEM_ARCHITECTURE.md         # 📖 Architecture & ML concepts
├── supabase_schema.sql            # Database schema
├── package.json                   # Dependencies
└── .env                           # Environment variables
```

---

## 🔧 Setup & Installation

### **1. Clone Repository**
```bash
git clone <your-repo-url>
cd app
```

### **2. Install Dependencies**
```bash
yarn install
```

### **3. Environment Variables**

Create `.env` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Other
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CORS_ORIGINS=*
```

### **4. Database Setup**

Run SQL schema in Supabase:
```bash
# Use supabase_schema.sql in Supabase SQL Editor
```

Tables created:
- `submissions` - Student submissions
- `rubrics` - Evaluation criteria
- `evaluations` - AI evaluation results

### **5. Run Development Server**
```bash
yarn dev
```

Visit: `http://localhost:3000`

---

## 🎯 How It Works

### **Submission Flow**

```
1. Student submits (algorithm/pseudocode/flowchart)
   ↓
2. If flowchart → Upload image to Cloudinary
   ↓
3. Save submission to Supabase (status: "submitted")
   ↓
4. Call Gemini AI for evaluation
   • Text: Gemini LLM analyzes code
   • Image: Gemini Vision analyzes flowchart
   ↓
5. AI returns scores + feedback (6-8 seconds)
   ↓
6. Save evaluation to database (status: "completed")
   ↓
7. Display results to student
```

### **AI Evaluation Process**

**For Algorithms/Pseudocode:**
```javascript
Gemini LLM:
→ Analyzes syntax
→ Checks logical correctness
→ Evaluates structure
→ Identifies errors
→ Generates feedback
→ Assigns scores per rubric criterion
```

**For Flowcharts:**
```javascript
Gemini Vision API:
→ Recognizes shapes (rectangles, diamonds, ovals)
→ Reads text (OCR)
→ Understands flow direction
→ Analyzes logic structure
→ Evaluates against rubric
→ Generates detailed feedback
```

---

## 📊 Rubric Structure

Default rubric has 3 criteria:

| Criterion | Points | Description |
|-----------|--------|-------------|
| **Logic Correctness** | 5 | Accuracy of logical flow and problem-solving |
| **Structure & Organization** | 3 | Clear structure and organization |
| **Syntax & Clarity** | 2 | Proper syntax and readability |

**Total:** 10 points

---

## 🔌 API Endpoints

### **Submissions**

```bash
# Create submission
POST /api/submissions
Body: {
  studentName: "John Doe",
  assignmentTitle: "Bubble Sort",
  submissionType: "algorithm|pseudocode|flowchart",
  textContent: "code here" (for algorithm/pseudocode),
  imageData: "base64..." (for flowchart),
  rubricId: "uuid"
}

# List submissions
GET /api/submissions

# Get specific submission
GET /api/submissions/{id}
```

### **Rubrics**

```bash
# List rubrics
GET /api/rubrics

# Create default rubric
POST /api/rubrics/default
```

---

## 🚀 Deployment (Netlify)

### **1. Connect to Netlify**
```bash
# Connect your GitHub repo to Netlify
```

### **2. Configure Build Settings**
- **Build command:** `yarn build`
- **Publish directory:** `.next`

### **3. Environment Variables**

Add all variables from `.env` to Netlify:
- Go to: Site Settings → Environment Variables
- Add each variable

### **4. Deploy**
```bash
git push origin main
# Netlify auto-deploys
```

---

## 📖 Documentation

- **`CODE_EXPLANATION.md`** - Detailed code walkthrough (6000+ words)
- **`SYSTEM_ARCHITECTURE.md`** - Architecture & ML concepts (4000+ words)
- **`NETLIFY_DEPLOYMENT.md`** - Deployment guide

---

## 🤖 Machine Learning Details

### **Model Used**
- **Google Gemini 2.0 Flash Experimental**
- Latest multimodal LLM (text + vision)
- Trained on billions of parameters

### **Capabilities**
1. **Natural Language Processing (NLP)**
   - Code syntax understanding
   - Logic flow analysis
   - Error detection

2. **Computer Vision (CV)**
   - Shape recognition in flowcharts
   - OCR (text extraction)
   - Spatial relationship understanding

3. **Generative AI**
   - Personalized feedback
   - Actionable suggestions
   - Context-aware analysis

---

## 🔒 Security Notes

**Current (Prototype):**
- No authentication required
- Public access to all submissions
- API keys in environment variables

**Production Recommendations:**
- Add Supabase Auth (email/password or OAuth)
- Implement Row Level Security (RLS) policies
- Add rate limiting
- Enable HTTPS only
- User-specific submission access

---

## 📈 Performance

**Typical Response Times:**
- Algorithm evaluation: ~6-7 seconds
- Pseudocode evaluation: ~7-8 seconds
- Flowchart evaluation: ~4-5 seconds

**Optimization:**
- Serverless architecture (auto-scaling)
- Database connection pooling
- CDN image delivery
- Synchronous evaluation (Netlify compatible)

---

## 🐛 Troubleshooting

### **Evaluation Fails**
- Check Gemini API key is valid
- Verify API has not hit rate limits
- Check Cloudinary credentials (for flowcharts)

### **Image Upload Fails**
- Verify Cloudinary configuration
- Check image size (< 10MB recommended)
- Ensure valid base64 format

### **Database Errors**
- Verify Supabase credentials
- Check table structure matches schema
- Ensure RLS policies allow access (if enabled)

---

## 🤝 Contributing

This is a prototype system. Future enhancements:
- [ ] User authentication
- [ ] Instructor dashboard
- [ ] Custom rubric creation
- [ ] Batch evaluation
- [ ] Export reports (PDF)
- [ ] LMS integration

---

## 📝 License

MIT License - Educational purposes

---

## 👨‍💻 Author

Built with ❤️ using Next.js, Supabase, Cloudinary, and Google Gemini AI

---

## 📞 Support

For questions about the code:
- Read `CODE_EXPLANATION.md` for detailed explanations
- Read `SYSTEM_ARCHITECTURE.md` for architecture overview
- Check `.env` for configuration

---

**Last Updated:** January 2025
