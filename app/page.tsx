import { getDeputadosNormalizados, getSenadoresNormalizados, getRealFeedEvents } from '@/lib/api';
import FeedClient from './feed-client';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  // Fetch from both APIs
  const [deputados, senadores] = await Promise.all([
    getDeputadosNormalizados(1, 200),
    getSenadoresNormalizados()
  ]);
  
  // Combine and normalize
  const allPoliticians = [...deputados, ...senadores];
  
  // Generate feed events using the unified list
  const feedEvents = await getRealFeedEvents(allPoliticians);

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex justify-between items-center max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-heading text-xl">
            F
          </div>
          <h1 className="text-2xl font-heading tracking-wider neon-text-orange">Feed Político</h1>
        </div>
        <div className="flex gap-4 items-center">
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <FeedClient initialPoliticians={allPoliticians} initialEvents={feedEvents} />
      </div>
    </main>
  );
}
