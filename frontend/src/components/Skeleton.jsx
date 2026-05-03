export const Skeleton = ({ className = '', variant = 'text', ...props }) => {
  const baseClasses = 'animate-pulse bg-neutral-200 dark:bg-neutral-700';
  const variantClasses = {
    text: 'h-4 rounded',
    title: 'h-6 w-3/4 rounded',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-32 rounded-xl',
    button: 'h-10 w-24 rounded-lg',
    image: 'h-48 w-full rounded-xl',
    input: 'h-10 rounded-lg',
    avatarLg: 'w-20 h-20 rounded-full',
    badge: 'h-6 w-16 rounded-full',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
    <div className="flex items-center gap-4">
      <Skeleton variant="avatarLg" />
      <div className="flex-1 space-y-3">
        <Skeleton variant="title" />
        <Skeleton className="w-1/2" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton />
      <Skeleton className="w-2/3" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
    <div className="grid gap-4 p-4 border-b border-neutral-200 dark:border-neutral-700">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="title" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="grid gap-4 p-4 border-b border-neutral-100 dark:border-neutral-700"
      >
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonProfile = () => (
  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
    <div className="flex items-center gap-6">
      <Skeleton variant="avatar" className="w-24 h-24 rounded-full" />
      <div className="flex-1 space-y-3">
        <Skeleton variant="title" className="w-1/3" />
        <Skeleton className="w-1/2" />
        <div className="flex gap-2">
          <Skeleton variant="badge" />
          <Skeleton variant="badge" />
          <Skeleton variant="badge" />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonTutorCard = () => (
  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
    <div className="flex gap-4">
      <Skeleton variant="avatarLg" />
      <div className="flex-1">
        <Skeleton variant="title" />
        <Skeleton className="w-1/4 mt-2" />
        <div className="flex items-center gap-2 mt-3">
          <Skeleton variant="badge" />
          <Skeleton variant="badge" />
        </div>
        <Skeleton className="mt-4" />
        <Skeleton className="mt-2 w-2/3" />
      </div>
    </div>
    <div className="flex gap-3 mt-4">
      <Skeleton variant="button" className="flex-1" />
      <Skeleton variant="button" className="flex-1" />
    </div>
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
    <div className="flex justify-between items-center mb-6">
      <Skeleton variant="title" className="w-1/4" />
      <Skeleton variant="badge" />
    </div>
    <div className="h-64 flex items-end gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
      ))}
    </div>
  </div>
);

export default Skeleton;