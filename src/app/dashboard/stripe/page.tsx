import { redirect } from 'next/navigation';

// Legacy route - redirects to new betalingen page
export default function StripePage() {
  redirect('/dashboard/betalingen');
}
