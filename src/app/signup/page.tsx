'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react';

export default function SignupPage() {
  const supabase = createClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard/onboarding`,
      },
    });

    if (error) {
      setError(
        error.message === 'User already registered'
          ? 'Dit e-mailadres is al in gebruik'
          : error.message
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
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
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-navy">Check je inbox</h1>
            <p className="text-gray-text mt-3">
              We hebben een bevestigingslink gestuurd naar{' '}
              <span className="font-medium text-navy">{email}</span>. Klik op de link
              om je account te activeren.
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 text-primary font-medium hover:underline"
            >
              Terug naar inloggen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-gray flex flex-col">
      {/* Header */}
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

      {/* Signup form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy">Maak je account aan</h1>
            <p className="text-gray-text mt-1">
              Start gratis. Geen creditcard nodig.
            </p>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Naam</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Je volledige naam"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">E-mailadres</label>
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

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Wachtwoord</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimaal 6 tekens"
                    required
                    minLength={6}
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
                Account aanmaken
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

          <p className="text-xs text-center text-gray-text mt-4">
            Door je aan te melden ga je akkoord met onze{' '}
            <Link href="/terms" className="text-primary hover:underline">
              voorwaarden
            </Link>{' '}
            en{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              privacybeleid
            </Link>
            .
          </p>

          <p className="text-center text-sm text-gray-text mt-4">
            Al een account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
