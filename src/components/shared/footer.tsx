import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-light-gray bg-white mt-auto">
      <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-text">
                &copy; {new Date().getFullYear()} {APP_NAME}. Alle rechten voorbehouden.
              </p>
              <p className="text-xs text-gray-text/70 mt-1">
                KVK: 98442945 • Rietbaan 2, 2908LP Capelle aan den IJssel
              </p>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
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
                href="/refund"
                className="text-sm text-gray-text hover:text-navy transition-colors"
              >
                Restitutie
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-text hover:text-navy transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>
          <div className="text-center text-xs text-gray-text/60">
            <a href="tel:+31620890316" className="hover:text-navy">+31 6 20 89 03 16</a>
            {' • '}
            <a href="mailto:info@bookedwell.app" className="hover:text-navy">info@bookedwell.app</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
