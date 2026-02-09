import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-light-gray bg-white mt-auto">
      <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-text">
            &copy; {new Date().getFullYear()} {APP_NAME}. Alle rechten voorbehouden.
          </p>
          <nav className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-text hover:text-navy transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-text hover:text-navy transition-colors"
            >
              Voorwaarden
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-text hover:text-navy transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
