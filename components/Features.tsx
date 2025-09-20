'use client'

import { motion } from 'framer-motion'
import { 
  Zap, 
  Brain, 
  Users, 
  Palette, 
  Download, 
  Shield, 
  Clock, 
  Sparkles,
  Video,
  Globe,
  Smartphone
} from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: Zap,
      title: 'Real-time Generation',
      description: 'Create videos instantly with our lightning-fast AI processing. See your ideas come to life in seconds, not hours.',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Brain,
      title: 'Advanced AI Models',
      description: 'Powered by cutting-edge AI models trained on millions of videos. Generate high-quality content with unprecedented realism.',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: Users,
      title: 'Collaborative Studio',
      description: 'Work together with your team in real-time. Share projects, leave comments, and collaborate seamlessly.',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Palette,
      title: 'Creative Tools',
      description: 'Access a full suite of creative tools including templates, effects, transitions, and custom styling options.',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: Download,
      title: 'Export Options',
      description: 'Export your videos in multiple formats and resolutions. From social media to 4K, we have you covered.',
      color: 'from-red-400 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with end-to-end encryption. Your content and data are always protected.',
      color: 'from-indigo-400 to-purple-500'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Our platform runs 24/7 with 99.9% uptime. Create videos whenever inspiration strikes.',
      color: 'from-teal-400 to-blue-500'
    },
    {
      icon: Sparkles,
      title: 'Smart Templates',
      description: 'AI-powered templates that adapt to your content. Get professional results with minimal effort.',
      color: 'from-rose-400 to-pink-500'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  return (
    <section id="features" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to create professional videos with AI. From real-time generation 
            to collaborative editing, we've got you covered.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="card p-6 text-center group hover:shadow-2xl transition-all duration-300"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold gradient-text mb-6">
                  More Than Just Video Generation
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Our platform is a complete creative ecosystem. From AI-powered content creation 
                  to professional editing tools, everything you need is in one place.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Video, text: 'Multi-format video generation' },
                    { icon: Globe, text: 'Global content distribution' },
                    { icon: Smartphone, text: 'Mobile-optimized interface' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-gray-600 font-medium">Feature Demo</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary-500 rounded-full animate-pulse" />
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-secondary-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}




