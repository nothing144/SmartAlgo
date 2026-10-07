import './globals.css'
import { ThemeProvider } from '../components/ThemeProvider'
import { AuthProvider } from '../contexts/AuthContext'

export const metadata = {
  title: 'Smart Evaluator – AI-powered rubric assessment',
  description: 'Submit flowcharts, algorithms, and pseudocode. Get detailed, rubric-based AI evaluation in seconds.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}