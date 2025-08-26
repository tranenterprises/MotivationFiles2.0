export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-800/30 py-8 px-4 mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">
            <span className="text-accent">DAILY</span> MOTIVATION
          </h3>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            Fueling greatness one quote at a time. Every word is designed to push you beyond your limits.
          </p>
        </div>
        
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 Daily Motivation Voice App. Powered by determination.
            </p>
            
            <div className="flex items-center space-x-6">
              <span className="text-gray-500 text-xs">
                Built with 💪 and Next.js
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}