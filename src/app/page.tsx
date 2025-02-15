import { VerseDisplay } from "@/components/modules/verse-detection/VerseDisplay";
import { RecordingControls } from "@/components/modules/verse-detection/RecordingControls";
import { ErrorBoundary } from "@/components/common/error/ErrorBoundary";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="py-8">
        <h1 className="text-2xl font-bold text-center">VerseCatch</h1>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-4 max-w-4xl mx-auto w-full">
        {/* Verse Display - centered vertically when no verses */}
        <div className="flex-1 flex items-center mb-8">
          <ErrorBoundary>
            <VerseDisplay />
          </ErrorBoundary>
        </div>

        {/* Recording Controls - fixed at bottom */}
        <div className="mb-8">
          <RecordingControls />
        </div>

        {/* Warning Label */}
        <div className="text-center text-sm text-gray-500 mb-4">
          <p>
            ⚠️ This is an experimental application. Verse detection accuracy may
            vary based on audio quality and speech clarity.
          </p>
        </div>
      </div>
    </main>
  );
}
