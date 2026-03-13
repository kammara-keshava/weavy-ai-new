'use client';

import { useUser } from '@clerk/nextjs';
import { LogoutButton } from './logout-button';

export function Header() {
  const { user, isLoaded } = useUser();

  // Only render if user is signed in
  if (!isLoaded || !user) {
    return null;
  }

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b flex-shrink-0" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--panel-border)' }}>
      <div className="flex items-center gap-2 sm:gap-3">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Weavy AI
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
        <div className="hidden sm:flex flex-col items-end text-sm">
          <p className="font-semibold truncate max-w-[150px] md:max-w-none" style={{ color: 'var(--foreground)' }}>
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs truncate max-w-[150px] md:max-w-none" style={{ color: 'var(--muted)' }}>
            {user.emailAddresses[0]?.emailAddress}
          </p>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
