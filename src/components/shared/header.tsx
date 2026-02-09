import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  showNav?: boolean;
}

export function Header({ showNav = true }: HeaderProps) {
  return (
    <header className="border-b border-light-gray bg-white">
      <div className="max-w-container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="BookedWell"
            width={160}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {showNav && (
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-text hover:text-navy transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              Inloggen
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
