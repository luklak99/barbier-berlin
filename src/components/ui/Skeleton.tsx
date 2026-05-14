/**
 * Wiederverwendbare Skeleton-Komponenten fuer Loading-States.
 * Zeigen die Form des finalen Contents als Platzhalter.
 */

interface SkeletonProps {
  className?: string;
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return (
    <div className={`h-4 bg-[var(--glass-strong)] rounded animate-pulse ${className}`} />
  );
}

export function SkeletonCircle({ className = '' }: SkeletonProps) {
  return (
    <div className={`w-10 h-10 bg-[var(--glass-strong)] rounded-full animate-pulse ${className}`} />
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)] animate-pulse ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2.5 flex-1">
          <div className="h-4 bg-[var(--glass-strong)] rounded w-2/3" />
          <div className="h-3 bg-[var(--glass-strong)] rounded w-1/3" />
        </div>
        <div className="h-6 w-16 bg-[var(--glass-strong)] rounded ml-4" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className = '' }: SkeletonProps & { count?: number }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Skeleton fuer den Booking-Flow Auth-Check (Service-Auswahl-Form) */
export function SkeletonBookingFlow() {
  return (
    <div className="animate-pulse">
      {/* Progress Steps Skeleton */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--glass-strong)]" />
            <div className="h-3 w-12 bg-[var(--glass-strong)] rounded hidden sm:block" />
            {i < 3 && <div className="w-12 h-px bg-[var(--glass-strong)] mx-2" />}
          </div>
        ))}
      </div>
      {/* Category Tabs Skeleton */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 bg-[var(--glass-strong)] rounded-full" />
        ))}
      </div>
      {/* Service List Skeleton */}
      <SkeletonList count={4} />
    </div>
  );
}

/** Skeleton fuer das Customer Dashboard (Termine + Stats) */
export function SkeletonDashboard() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[var(--glass-strong)] rounded" />
          <div className="h-4 w-32 bg-[var(--glass-strong)] rounded" />
        </div>
        <div className="h-10 w-32 bg-[var(--glass-strong)] rounded-full" />
      </div>
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)]">
            <div className="h-3 w-24 bg-[var(--glass-strong)] rounded mb-3" />
            <div className="h-7 w-12 bg-[var(--glass-strong)] rounded" />
          </div>
        ))}
      </div>
      {/* Tabs Skeleton */}
      <div className="flex gap-1 bg-[var(--glass)] rounded-xl p-1 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 bg-[var(--glass-strong)] rounded-lg" />
        ))}
      </div>
      {/* Content Skeleton */}
      <SkeletonList count={3} />
    </div>
  );
}

/** Skeleton fuer das Admin Portal (Termine + Stats) */
export function SkeletonAdminPortal() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-[var(--glass-strong)] rounded" />
          <div className="h-4 w-56 bg-[var(--glass-strong)] rounded" />
        </div>
        <div className="h-10 w-28 bg-[var(--glass-strong)] rounded-full" />
      </div>
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)]">
            <div className="h-3 w-24 bg-[var(--glass-strong)] rounded mb-3" />
            <div className="h-7 w-12 bg-[var(--glass-strong)] rounded" />
          </div>
        ))}
      </div>
      {/* Tabs Skeleton */}
      <div className="flex gap-1 bg-[var(--glass)] rounded-xl p-1 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 bg-[var(--glass-strong)] rounded-lg" />
        ))}
      </div>
      {/* Appointments Skeleton */}
      <SkeletonList count={4} />
    </div>
  );
}

/** Skeleton fuer Zeitslots im Buchungskalender */
export function SkeletonTimeSlots() {
  return (
    <div className="animate-pulse grid grid-cols-4 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-11 bg-[var(--glass-strong)] rounded-lg" />
      ))}
    </div>
  );
}

/** Skeleton fuer den Punkte-Tab */
export function SkeletonPoints() {
  return (
    <div className="animate-pulse">
      {/* Points Card Skeleton */}
      <div className="bg-[var(--glass)] rounded-2xl p-8 border border-[var(--border)] mb-6">
        <div className="h-3 w-24 bg-[var(--glass-strong)] rounded mb-3" />
        <div className="h-12 w-32 bg-[var(--glass-strong)] rounded mb-2" />
        <div className="h-3 w-20 bg-[var(--glass-strong)] rounded" />
      </div>
      {/* Transactions Skeleton */}
      <div className="h-5 w-28 bg-[var(--glass-strong)] rounded mb-3" />
      <SkeletonList count={3} />
    </div>
  );
}
