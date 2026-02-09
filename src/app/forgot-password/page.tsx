'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, Check } from 'lucide-react';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-gray flex flex-col">
      <div className="p-4 sm:p-6">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="BookedWell"
            width={160}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-navy">Check je inbox</h1>
              <p className="text-gray-text mt-3">
                We hebben een link gestuurd naar{' '}
                <span className="font-medium text-navy">{email}</span> waarmee
                je je wachtwoord kunt resetten.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-6 text-primary font-medium hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug naar inloggen
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-navy">
                  Wachtwoord vergeten?
                </h1>
                <p className="text-gray-text mt-1">
                  Vul je e-mailadres in en we sturen je een reset link
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">
                    E-mailadres
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jouw@email.nl"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  Verstuur reset link
                </Button>
              </form>

              <div className="text-center mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-text hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Terug naar inloggen
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
