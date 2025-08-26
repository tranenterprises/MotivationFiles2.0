import LoadingSpinner from './LoadingSpinner'

interface LoadingStateProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function LoadingState({ 
  message = "Loading inspiring content...", 
  size = 'medium',
  className = '' 
}: LoadingStateProps) {
  const sizeClasses = {
    small: {
      container: 'p-4',
      spinner: 'medium',
      text: 'text-sm'
    },
    medium: {
      container: 'p-8',
      spinner: 'large',
      text: 'text-base'
    },
    large: {
      container: 'p-12',
      spinner: 'large',
      text: 'text-lg'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={`text-center fade-in ${className}`}>
      <div className={`bg-gray-800 border border-gray-600 rounded-lg ${classes.container} max-w-2xl mx-auto`}>
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size={classes.spinner as 'small' | 'medium' | 'large'} />
          <p className={`text-gray-300 ${classes.text}`}>{message}</p>
        </div>
      </div>
    </div>
  )
}