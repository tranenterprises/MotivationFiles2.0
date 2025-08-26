import { getCachedTodaysQuote } from '@/lib/utils/cache'
import { Quote } from '@/lib/types/types'
import Navigation from '@/components/layout/Navigation'
import HeroSection from '@/components/sections/HeroSection'

async function TodaysMotivation() {
  try {
    const quote: Quote | null = await getCachedTodaysQuote()
    return <HeroSection quote={quote} />
  } catch (error) {
    console.error('Error fetching today\'s quote:', error)
    return <HeroSection quote={null} hasError={true} />
  }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <Navigation />
      <TodaysMotivation />
    </div>
  )
}
