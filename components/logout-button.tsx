'use client';

import { SignOutButton } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <SignOutButton redirectUrl="/">
      <button
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 btn-secondary"
        title="Sign out of your account"
      >
        <LogOut size={18} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </SignOutButton>
  );
}
