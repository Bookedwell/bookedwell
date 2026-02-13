import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { PWARegister } from '@/components/shared/pwa-register';
import {
  Calendar,
  MessageSquare,
  Shield,
  TrendingUp,
  Clock,
  Users,
  ArrowRight,
  Check,
  X,
  CreditCard,
  Smartphone,
  UserPlus,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PWARegister />
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-bg-gray to-white py-16 sm:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight">
              Minder no-shows,{' '}
              <span className="text-primary">vollere agenda</span>
            </h1>
            <p className="mt-6 text-lg text-gray-text max-w-2xl mx-auto">
              Professionele boekingspagina met automatische WhatsApp reminders en
              optionele aanbetaling. Zodat je minder no-shows hebt en je agenda
              voller blijft.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shadow-md"
              >
                Gratis starten
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg border-2 border-primary text-primary hover:bg-primary-light transition-colors"
              >
                Bekijk features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy">
              Alles wat je nodig hebt
            </h2>
            <p className="mt-3 text-gray-text max-w-xl mx-auto">
              Van online boeken tot automatische herinneringen. BookedWell regelt het.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Online boeken',
                desc: 'Klanten boeken 24/7 via jouw eigen pagina. Geen heen-en-weer appen meer.',
              },
              {
                icon: MessageSquare,
                title: 'WhatsApp reminders',
                desc: 'Automatische herinneringen 24 uur en 2 uur voor de afspraak.',
              },
              {
                icon: Shield,
                title: 'No-show preventie',
                desc: 'Optionele aanbetaling of kaartvalidatie. Bescherm je omzet.',
              },
              {
                icon: TrendingUp,
                title: 'Inzichten & analytics',
                desc: 'Zie je no-show rate, populaire diensten en piekuren in real-time.',
              },
              {
                icon: Clock,
                title: 'Slimme planning',
                desc: 'Automatische beschikbaarheid op basis van werktijden en bestaande afspraken.',
              },
              {
                icon: Users,
                title: 'Klantbeheer',
                desc: 'Betrouwbaarheidsscores en geschiedenis per klant. Weet wie er komt.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-light-gray hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-navy mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-text">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-24 bg-bg-gray">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy">
              Simpele, eerlijke prijzen
            </h2>
            <p className="mt-3 text-gray-text">
              14 dagen gratis proberen. Geen betaling nodig. Transactiekosten Stripe apart.*
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Solo',
                price: '19,95',
                serviceFee: '€1,25 service fee per boeking',
                desc: 'De Starter',
                features: [
                  'Tot 100 boekingen per maand',
                  'Onbeperkt teamleden',
                  'E-mail reminders inbegrepen',
                  'WhatsApp inbegrepen',
                ],
                cta: '14 dagen gratis proberen',
                highlight: false,
              },
              {
                name: 'Growth',
                price: '49',
                serviceFee: '€1,20 service fee per boeking',
                desc: 'De Medium Salon',
                features: [
                  'Tot 500 boekingen per maand',
                  'Onbeperkt teamleden',
                  'E-mail reminders inbegrepen',
                  'WhatsApp inbegrepen',
                ],
                cta: '14 dagen gratis proberen',
                highlight: true,
              },
              {
                name: 'Unlimited',
                price: '89',
                serviceFee: '€1,10 service fee per boeking',
                desc: 'De Grote Salon',
                features: [
                  'Onbeperkt boekingen',
                  'Onbeperkt teamleden',
                  'E-mail reminders inbegrepen',
                  'WhatsApp inbegrepen',
                ],
                cta: '14 dagen gratis proberen',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl border ${
                  plan.highlight
                    ? 'border-primary ring-2 ring-primary bg-white shadow-lg'
                    : 'border-light-gray bg-white'
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full mb-4">
                    Meest gekozen
                  </span>
                )}
                <h3 className="text-lg font-bold text-navy">{plan.name}</h3>
                <p className="text-sm text-gray-text">{plan.desc}</p>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold text-navy">
                    &euro;{plan.price}
                  </span>
                  <span className="text-gray-text">/maand</span>
                </div>
                <p className="text-sm font-medium text-primary mb-4">
                  {plan.serviceFee}
                </p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    plan.highlight
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'border-2 border-primary text-primary hover:bg-primary-light'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-text mt-8">
            14 dagen gratis proefperiode bij elk pakket. * Stripe transactiekosten: 1,5% + €0,25 per transactie (iDEAL/kaart). Prijzen excl. BTW.
          </p>
        </div>
      </section>

      {/* Waarom Bookedwell */}
      <section className="py-16 sm:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy">
              Waarom Bookedwell?
            </h2>
            <p className="mt-3 text-gray-text max-w-xl mx-auto">
              Vergelijk ons met traditionele salonsoftware en ontdek het verschil.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Comparison table */}
            <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
              <div className="grid grid-cols-3 text-center text-sm font-semibold">
                <div className="p-4 bg-bg-gray" />
                <div className="p-4 bg-primary/5 text-primary border-x border-light-gray">Bookedwell</div>
                <div className="p-4 bg-bg-gray text-gray-text">Traditionele platforms</div>
              </div>
              {[
                { label: 'Vanaf', ours: '€19,95/mnd', theirs: '€30+/mnd', icon: CreditCard },
                { label: 'Online betalingen', ours: true, theirs: false, icon: Shield },
                { label: 'WhatsApp reminders', ours: 'Inbegrepen', theirs: 'Niet beschikbaar', icon: Smartphone },
                { label: 'SMS credits', ours: 'Niet nodig', theirs: '€0,07-0,15 per SMS', icon: Smartphone },
                { label: 'Teamleden', ours: 'Onbeperkt gratis', theirs: '€5-15 per medewerker', icon: UserPlus },
                { label: 'No-show bescherming', ours: true, theirs: false, icon: Shield },
                { label: 'Volume korting', ours: 'Ja, lagere fee bij meer boekingen', theirs: false, icon: CreditCard },
                { label: 'Eigen boekingspagina', ours: true, theirs: true, icon: Calendar },
              ].map((row, i) => (
                <div key={row.label} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-bg-gray/50'}`}>
                  <div className="p-4 flex items-center gap-2 font-medium text-navy">
                    <row.icon className="w-4 h-4 text-gray-text flex-shrink-0" />
                    {row.label}
                  </div>
                  <div className="p-4 flex items-center justify-center border-x border-light-gray">
                    {typeof row.ours === 'boolean' ? (
                      row.ours ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-400" />
                    ) : (
                      <span className="font-semibold text-navy">{row.ours}</span>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    {typeof row.theirs === 'boolean' ? (
                      row.theirs ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-400" />
                    ) : (
                      <span className="text-gray-text">{row.theirs}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Savings example */}
            <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
              <h3 className="text-lg font-bold text-navy mb-4 text-center">Rekenvoorbeeld: Salon met 4 medewerkers en 200 boekingen/maand</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-light-gray">
                  <p className="text-sm font-semibold text-gray-text mb-3">Traditioneel platform</p>
                  <ul className="space-y-2 text-sm text-slate">
                    <li className="flex justify-between"><span>Basissoftware</span><span className="font-medium">€30/mnd</span></li>
                    <li className="flex justify-between"><span>4 extra teamleden (á €10)</span><span className="font-medium">€40/mnd</span></li>
                    <li className="flex justify-between"><span>200 SMS reminders (á €0,10)</span><span className="font-medium">€20/mnd</span></li>
                    <li className="flex justify-between border-t pt-2 mt-2 font-bold text-navy"><span>Totaal</span><span>€90/mnd</span></li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-primary">
                  <p className="text-sm font-semibold text-primary mb-3">Bookedwell Growth</p>
                  <ul className="space-y-2 text-sm text-slate">
                    <li className="flex justify-between"><span>Growth pakket (500 boekingen)</span><span className="font-medium">€49/mnd</span></li>
                    <li className="flex justify-between"><span>Onbeperkt teamleden</span><span className="font-medium text-green-600">€0</span></li>
                    <li className="flex justify-between"><span>WhatsApp reminders</span><span className="font-medium text-green-600">Inbegrepen</span></li>
                    <li className="flex justify-between border-t pt-2 mt-2 font-bold text-navy"><span>Totaal</span><span>€49/mnd</span></li>
                  </ul>
                </div>
              </div>
              <p className="text-center mt-4 text-lg font-bold text-primary">
                Bespaar €41/maand = €492/jaar
              </p>
            </div>

            <p className="text-center text-xs text-gray-text mt-4">
              Vergelijking op basis van standaard functies. Prijzen kunnen variëren per aanbieder.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-navy">
            Klaar om je no-shows te halveren?
          </h2>
          <p className="mt-3 text-gray-text max-w-xl mx-auto">
            In 5 minuten live. Geen technische kennis nodig.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center mt-8 px-8 py-3.5 text-base font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shadow-md"
          >
            Gratis starten
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
