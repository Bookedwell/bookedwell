import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Boek een afspraak | BookedWell',
  description: 'Boek online je afspraak. Snel, simpel en bevestigd via WhatsApp.',
};

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
