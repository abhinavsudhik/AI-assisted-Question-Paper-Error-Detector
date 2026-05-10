'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          PaperCheck AI
        </Link>
        {pathname === '/report' ? (
          <Link
            href="/"
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
          >
            New Analysis
          </Link>
        ) : (
          <Link
            href="/report"
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
          >
            View Report
          </Link>
        )}
      </div>
    </nav>
  );
}
