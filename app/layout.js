import './globals.css'

export const metadata = {
  title: 'Smart Evaluator - AI-Powered Rubrics-Based Assessment',
  description: 'Intelligent evaluation system for flowcharts, algorithms, and pseudocode using Gemini AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}