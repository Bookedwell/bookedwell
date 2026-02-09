'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Phone, ArrowRight } from 'lucide-react';

type LoginMethod = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [method, setMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Onjuist e-mailadres of wachtwoord'
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedPhone = phone.startsWith('+') ? phone : `+31${phone.replace(/^0/, '')}`;

    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    console.log('OTP send result:', { data, error });

    if (error) {
      console.error('OTP send error:', error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setPhone(formattedPhone);
    setOtpSent(true);
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    console.log('OTP verify result:', { data, error });

    if (error) {
      console.error('OTP verify error:', error);
      setError(
        error.message === 'Token has expired or is invalid'
          ? 'Code is verlopen of ongeldig'
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

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

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy">Welkom terug</h1>
            <p className="text-gray-text mt-1">Log in op je dashboard</p>
          </div>

          {/* Method tabs */}
          <div className="flex bg-bg-gray rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMethod('email'); setError(''); setOtpSent(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                method === 'email'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-gray-text hover:text-navy'
              }`}
            >
              <Mail className="w-4 h-4" />
              E-mail
            </button>
            <button
              type="button"
              onClick={() => { setMethod('phone'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                method === 'phone'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-gray-text hover:text-navy'
              }`}
            >
              <Phone className="w-4 h-4" />
              Telefoon
            </button>
          </div>

          {/* Email login */}
          {method === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-navy">
                    Wachtwoord
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Vergeten?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Je wachtwoord"
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
                Inloggen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* Phone OTP login */}
          {method === 'phone' && !otpSent && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Telefoonnummer
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-text" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+31612345678"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-text mt-1.5">
                  We sturen een SMS met een verificatiecode
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Verstuur code
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* OTP verification */}
          {method === 'phone' && otpSent && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-text">
                  Code verstuurd naar <span className="font-medium text-navy">{phone}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Verificatiecode
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-light-gray rounded-lg text-sm text-center tracking-[0.3em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Verifiëren
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                className="w-full text-center text-sm text-gray-text hover:text-primary transition-colors"
              >
                Ander nummer gebruiken
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-text mt-6">
            Nog geen account?{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Gratis aanmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
