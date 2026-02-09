import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-gray px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-light-gray/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-8 h-8 text-gray-text" />
        </div>
        <h1 className="text-2xl font-bold text-navy mb-2">Geen internetverbinding</h1>
        <p className="text-gray-text max-w-sm">
          Controleer je internetverbinding en probeer het opnieuw.
        </p>
      </div>
    </div>
  );
}
