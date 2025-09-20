'use client'

import { motion } from 'framer-motion'
import { 
  Sparkles, 
  ArrowLeft,
  X
} from 'lucide-react'
import UnifiedVideoGenerator from '@/components/UnifiedVideoGenerator'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Back Button */}
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">AI Avatar Video Generator</span>
            </div>

            {/* Close Button */}
            <button
              onClick={handleGoBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Close Dashboard"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <UnifiedVideoGenerator />
          </motion.div>
        </div>
      </div>
    </main>
  )
}
