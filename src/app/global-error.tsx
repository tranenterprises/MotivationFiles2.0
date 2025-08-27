'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error boundary:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <div className="bg-gray-800 border border-red-500 rounded-lg p-8">
            {/* Error Icon */}
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>

            <h1 className="text-4xl font-bold text-white mb-4">
              CRITICAL <span className="text-red-500">ERROR</span>
            </h1>

            <p className="text-xl text-gray-300 mb-8">
              The app encountered a critical error. Even champions need a
              restart sometimes.
            </p>

            {/* Error Details */}
            {error.message && (
              <details className="mb-8 text-left">
                <summary className="text-gray-400 cursor-pointer hover:text-gray-300 mb-4 text-center">
                  Technical Details
                </summary>
                <div className="bg-gray-900 border border-gray-600 rounded p-4 text-sm text-gray-400 font-mono">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.digest && (
                    <div>
                      <strong>Digest:</strong> {error.digest}
                    </div>
                  )}
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Stack Trace</summary>
                      <pre className="mt-2 text-xs overflow-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={reset}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors duration-300 text-lg"
              >
                RESTART APP
              </button>

              <button
                onClick={() => window.location.reload()}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-8 py-4 rounded-lg transition-colors duration-300 text-lg"
              >
                RELOAD PAGE
              </button>
            </div>

            {/* Motivational Message */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <p className="text-gray-400 italic text-sm">
                "The strongest people are not those who show strength in front
                of us, but those who win battles we know nothing about."
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
