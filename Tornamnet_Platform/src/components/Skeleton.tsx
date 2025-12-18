// simple skeleton/pulse placeholder

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-slate-800 animate-pulse rounded ${className}`} />
  );
}
