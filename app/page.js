'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Users, Bot, Star, Clock, FileText, ArrowRight, CheckCircle, Plus, LogIn, Code, ImageIcon, Send, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AuthNavigation } from '../components/AuthNavigation'
import SubmissionForm from '../components/SubmissionForm'
import SubmissionResults from '../components/SubmissionResults'
import MySubmissions from '../components/MySubmissions'
import AllSubmissions from '../components/AllSubmissions'
import PublicCodeSubmit from '../components/PublicCodeSubmit'
import PublicCodeView from '../components/PublicCodeView'
import PublicOutputSubmit from '../components/PublicOutputSubmit'
import PublicOutputView from '../components/PublicOutputView'
import { ThemeToggle } from '../components/ThemeToggle'
import { CodeBackground } from '../components/CodeBackground'
import { motion } from 'framer-motion'

const HomePage = () => {
  const { user, loading: authLoading } = useAuth()
  const [currentView, setCurrentView] = useState('home') // 'home', 'submit', 'results', 'my-submissions', 'all-submissions', 'public-submit', 'public-view', 'public-output-submit', 'public-output-view'
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null)

  useEffect(() => {
    if (!authLoading) {
      fetchRecentSubmissions()
    }
  }, [authLoading])

  const fetchRecentSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions')
      if (response.ok) {
        const data = await response.json()
        
        // Group combined submissions together
        const combinedGroups = {}
        const standaloneSubmissions = []
        
        data.forEach(submission => {
          if (submission.combinedSubmissionId) {
            // This is part of a combined submission
            if (!combinedGroups[submission.combinedSubmissionId]) {
              combinedGroups[submission.combinedSubmissionId] = {
                submissionId: submission.combinedSubmissionId,
                isCombined: true,
                assignmentTitle: submission.assignmentTitle,
                studentName: submission.studentName,
                createdAt: submission.createdAt,
                parts: [],
                // Overall status: completed only if all parts are completed
                status: 'completed'
              }
            }
            combinedGroups[submission.combinedSubmissionId].parts.push(submission)
            // Update overall status - if any part is not completed, update the status
            if (submission.status === 'evaluating' && combinedGroups[submission.combinedSubmissionId].status !== 'error') {
              combinedGroups[submission.combinedSubmissionId].status = 'evaluating'
            } else if (submission.status === 'error') {
              combinedGroups[submission.combinedSubmissionId].status = 'error'
            } else if (submission.status === 'submitted' && combinedGroups[submission.combinedSubmissionId].status === 'completed') {
              combinedGroups[submission.combinedSubmissionId].status = 'submitted'
            }
          } else {
            // Standalone submission
            standaloneSubmissions.push(submission)
          }
        })
        
        // Combine and sort by date
        const allSubmissions = [...Object.values(combinedGroups), ...standaloneSubmissions]
        allSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        setRecentSubmissions(allSubmissions.slice(0, 5)) // Show latest 5
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }

  const handleSubmissionSuccess = () => {
    fetchRecentSubmissions()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Show different views based on currentView
  if (currentView === 'submit') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <SubmissionForm 
          setCurrentView={setCurrentView} 
          setCurrentSubmissionId={setCurrentSubmissionId}
          onSubmissionSuccess={handleSubmissionSuccess}
        />
      </div>
    )
  }

  if (currentView === 'results') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <SubmissionResults 
          submissionId={currentSubmissionId} 
          setCurrentView={setCurrentView} 
        />
      </div>
    )
  }

  if (currentView === 'my-submissions') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <MySubmissions 
          setCurrentView={setCurrentView} 
          setCurrentSubmissionId={setCurrentSubmissionId}
        />
      </div>
    )
  }

  if (currentView === 'all-submissions') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <AllSubmissions 
          setCurrentView={setCurrentView} 
          setCurrentSubmissionId={setCurrentSubmissionId}
        />
      </div>
    )
  }

  if (currentView === 'public-submit') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicCodeSubmit setCurrentView={setCurrentView} />
      </div>
    )
  }

  if (currentView === 'public-view') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicCodeView setCurrentView={setCurrentView} />
      </div>
    )
  }

  if (currentView === 'public-output-submit') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicOutputSubmit setCurrentView={setCurrentView} />
      </div>
    )
  }

  if (currentView === 'public-output-view') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicOutputView setCurrentView={setCurrentView} />
      </div>
    )
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  // Home/Dashboard view
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] relative selection:bg-teal-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>
      
      <CodeBackground />
      <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Welcome Section */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md mb-8">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">AI-Powered Evaluation Engine</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
            Elevate Your Code with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500">
              Smart Evaluator
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Instant, intelligent feedback for flowcharts, algorithms, and pseudocode. 
            Level up your programming skills through comprehensive rubric-based assessment.
          </p>
          
          {user ? (
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" whileHover={{ scale: 1.02 }}>
              <button
                onClick={() => setCurrentView('submit')}
                className="group relative px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-xl text-lg font-semibold transition-all shadow-[0_0_40px_rgba(20,184,166,0.3)] hover:shadow-[0_0_60px_rgba(20,184,166,0.5)] flex items-center justify-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <Plus className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Create New Submission</span>
              </button>
              <button
                onClick={() => setCurrentView('my-submissions')}
                className="px-8 py-4 border border-gray-300 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-400 text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2 hover:bg-white/80 dark:hover:bg-white/10"
              >
                <FileText className="w-5 h-5" />
                View My Submissions
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/sign-up"
                className="group relative px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-xl text-lg font-semibold transition-all shadow-[0_0_40px_rgba(20,184,166,0.3)] hover:shadow-[0_0_60px_rgba(20,184,166,0.5)] flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/auth/sign-in"
                className="px-8 py-4 border border-gray-300 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-400 text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2 hover:bg-white/80 dark:hover:bg-white/10"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </a>
            </div>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="group bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all hover:-translate-y-1 shadow-lg hover:shadow-teal-500/10">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-400/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Bot className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">AI-Powered Evaluation</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Advanced Gemini AI analyzes your submissions with intelligent feedback, providing deep insights beyond simple syntax checking.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="group bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-fuchsia-500/50 dark:hover:border-fuchsia-500/50 transition-all hover:-translate-y-1 shadow-lg hover:shadow-fuchsia-500/10">
            <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-400/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-7 h-7 text-fuchsia-600 dark:text-fuchsia-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Multiple Formats</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Submit flowcharts, algorithms, and pseudocode seamlessly. Vision AI effortlessly extracts and understands diagram logic.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="group bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Star className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Rubric-Based Scoring</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Comprehensive evaluation using strict, customizable rubrics covering logic accuracy, structural flow, and syntax clarity.
            </p>
          </motion.div>
        </motion.div>

        {/* Community Features Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 relative overflow-hidden rounded-3xl p-1"
        >
          {/* Animated border gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-indigo-500 to-fuchsia-500 animate-[spin_4s_linear_infinite] opacity-50" />
          
          <div className="relative bg-white dark:bg-gray-900 rounded-[22px] p-8 md:p-12 h-full">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Community Driven Learning
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Explore public submissions, share your own code and flowchart outputs, and learn from a growing developer community—without even needing to log in.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Public Codes Card */}
              <div 
                onClick={() => setCurrentView('public-view')}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-indigo-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-5 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:-rotate-6 transition-transform shadow-lg shadow-indigo-500/30">
                    <Code className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Public Codes</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Share solutions and browse through diverse algorithms implemented by others.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentView('public-submit')
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Code
                  </button>
                  <button
                    onClick={() => setCurrentView('public-view')}
                    className="flex-1 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-4 py-3 rounded-xl font-semibold transition-all"
                  >
                    Browse Directory
                  </button>
                </div>
              </div>

              {/* Public Output Photos Card */}
              <div 
                onClick={() => setCurrentView('public-output-view')}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-fuchsia-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-5 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform shadow-lg shadow-fuchsia-500/30">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Visual Outputs</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Post screenshots of your program's execution or browse visual results.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentView('public-output-submit')
                    }}
                    className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Output
                  </button>
                  <button
                    onClick={() => setCurrentView('public-output-view')}
                    className="flex-1 border border-fuchsia-200 dark:border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10 px-4 py-3 rounded-xl font-semibold transition-all"
                  >
                    Browse Gallery
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Submissions */}
        {user && recentSubmissions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              <button
                onClick={() => setCurrentView('my-submissions')}
                className="text-teal-600 dark:text-teal-400 hover:text-teal-500 font-medium flex items-center gap-2 transition-colors"
              >
                View History
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid gap-4">
              {recentSubmissions.map((submission, idx) => (
                <motion.div
                  key={submission.submissionId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:border-teal-500/50 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => {
                    setCurrentSubmissionId(submission.submissionId)
                    setCurrentView('results')
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        submission.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                        submission.status === 'evaluating' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                        'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        {submission.status === 'completed' && <CheckCircle className="w-5 h-5" />}
                        {submission.status === 'evaluating' && <Clock className="w-5 h-5 animate-spin" />}
                        {submission.status === 'error' && <Clock className="w-5 h-5" />}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-teal-500 transition-colors">
                          {submission.assignmentTitle}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {submission.isCombined ? 'Combined Submission' : submission.submissionType} • {' '}
                          {new Date(submission.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                      submission.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                        : submission.status === 'evaluating'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                    }`}>
                      {submission.status === 'completed' ? 'Completed' : 
                       submission.status === 'evaluating' ? 'Evaluating' : 'Error'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center relative rounded-3xl overflow-hidden p-12 md:p-16"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-indigo-600 opacity-90 z-0" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
              {user ? 'Ready to Submit Your Next Project?' : 'Start Evaluating Today.'}
            </h2>
            <p className="text-xl mb-10 text-teal-50 max-w-2xl mx-auto font-medium">
              {user 
                ? 'Upload your algorithms, pseudocode, or flowcharts and get instant AI-powered feedback.'
                : 'Join thousands of students improving their programming skills with intelligent AI insights.'
              }
            </p>
            {user ? (
              <button
                onClick={() => setCurrentView('submit')}
                className="bg-white text-teal-700 hover:bg-gray-50 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Submit New Assignment
              </button>
            ) : (
              <a
                href="/auth/sign-up"
                className="bg-white text-teal-700 hover:bg-gray-50 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 inline-block"
              >
                Create Free Account
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default HomePage