interface LoadingSkeletonProps {
  variant?: 'quote-card' | 'quote-grid' | 'text' | 'button';
  size?: 'small' | 'medium' | 'large';
  count?: number;
}

function QuoteCardSkeleton({
  size = 'medium',
}: {
  size: 'small' | 'medium' | 'large';
}) {
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  return (
    <div className="fade-in">
      <div
        className={`bg-gray-800 border border-gray-600 rounded-lg ${sizeClasses[size]} animate-pulse`}
      >
        {/* Category and Date */}
        <div className="mb-6">
          <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-32"></div>
        </div>

        {/* Quote Text */}
        <div className="mb-8 space-y-3">
          <div className="h-6 bg-gray-700 rounded w-full"></div>
          <div className="h-6 bg-gray-700 rounded w-5/6"></div>
          <div className="h-6 bg-gray-700 rounded w-4/6"></div>
        </div>

        {/* Bottom section */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
          <div className="h-3 bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

function TextSkeleton({ width = 'full' }: { width?: string }) {
  return (
    <div className={`h-4 bg-gray-700 rounded animate-pulse w-${width}`}></div>
  );
}

function ButtonSkeleton() {
  return <div className="h-10 bg-gray-700 rounded-lg animate-pulse w-24"></div>;
}

export default function LoadingSkeleton({
  variant = 'text',
  size = 'medium',
  count = 1,
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, index) => {
    switch (variant) {
      case 'quote-card':
        return <QuoteCardSkeleton key={index} size={size} />;
      case 'quote-grid':
        return (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <QuoteCardSkeleton key={i} size="medium" />
            ))}
          </div>
        );
      case 'text':
        return <TextSkeleton key={index} />;
      case 'button':
        return <ButtonSkeleton key={index} />;
      default:
        return <TextSkeleton key={index} />;
    }
  });

  return <>{skeletons}</>;
}
