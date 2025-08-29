import {
  getCachedTodaysQuote,
  generateTodayQuoteCacheKey,
  removeCachedData,
} from '@/lib/utils/cache';
import { Quote } from '@/lib/types/types';
import Navigation from '@/components/layout/Navigation';
import HeroSection from '@/components/sections/HeroSection';

async function TodaysMotivation() {
  try {
    // Clear any stale cache to ensure we get fresh data for today
    const todayCacheKey = generateTodayQuoteCacheKey();
    removeCachedData(todayCacheKey, { storage: 'sessionStorage' });

    const quote: Quote | null = await getCachedTodaysQuote();
    console.log(
      '📅 Today (PST):',
      new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Los_Angeles',
      })
    );
    console.log('💬 Quote found:', quote ? `${quote.date_created}` : 'null');

    return <HeroSection quote={quote} />;
  } catch (error) {
    console.error("Error fetching today's quote:", error);
    return <HeroSection quote={null} hasError={true} />;
  }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <Navigation />
      <div className="critical-render">
        <TodaysMotivation />
      </div>
    </div>
  );
}
