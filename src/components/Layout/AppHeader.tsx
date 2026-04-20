import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';
import { PreferencesMenu } from '../PreferencesMenu';

interface AppHeaderProps {
  /** Optional back-navigation link rendered before the branding. */
  backLink?: { to: string; label: string };
  /** Optional subtitle shown after the KAI Security branding. */
  subtitle?: string;
  /** Page-specific action buttons rendered after ThemeToggle / PreferencesMenu. */
  actions?: ReactNode;
}

export function AppHeader({ backLink, subtitle, actions }: AppHeaderProps) {
  return (
    <header className="w-full sticky top-0 bg-gray-50/95 backdrop-blur-sm z-30 border-b border-gray-200 dark:border-gray-800 dark:bg-gray-950/95">
      <div className="max-w-screen-2xl mx-auto w-full min-w-0 px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          {backLink && (
            <>
              <Link
                to={backLink.to}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm shrink-0 dark:text-gray-500 dark:hover:text-white"
              >
                {backLink.label}
              </Link>
              <span className="text-gray-400 text-sm shrink-0 dark:text-gray-600">|</span>
            </>
          )}
          <span className="text-xl font-bold tracking-tight truncate">
            KAI <span className="text-red-600 dark:text-red-500">Security</span>
          </span>
          {subtitle && (
            <>
              <span className="text-gray-400 text-sm hidden sm:inline dark:text-gray-600">|</span>
              <span className="text-gray-600 text-sm hidden sm:inline dark:text-gray-400">{subtitle}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <PreferencesMenu />
          {actions}
        </div>
      </div>
    </header>
  );
}
