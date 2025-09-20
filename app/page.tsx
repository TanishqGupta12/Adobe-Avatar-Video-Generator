'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
import Footer from '@/components/Footer'

export default function Home() {
  const router = useRouter()

  const handleStartCreating = () => {
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      <Header />
      <Hero onStartCreating={handleStartCreating} />
      <Features />
      <Pricing />
      <Footer />
    </main>
  )
}
