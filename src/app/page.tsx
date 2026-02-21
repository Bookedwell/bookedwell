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
  Scissors,
  Sparkles,
  Star,
  Zap,
  BarChart3,
  Bell,
  Globe,
  ChevronRight,
  Quote,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PWARegister />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary/5 to-blue-50 py-20 sm:py-32">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="max-w-container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy leading-tight tracking-tight">
              Jouw persoonlijke assistent voor{' '}
              <span className="text-primary">volledige controle</span>{' '}
              over je salon
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-text max-w-2xl mx-auto leading-relaxed">
              Altijd en overal inzicht in jouw agenda en administratie.
              Voorkom no-shows dankzij automatische WhatsApp herinneringen.
              Bespaar direct op onnodige kosten en houd waardevolle tijd over.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Probeer nu gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="#hoe-werkt-het"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border-2 border-navy/20 text-navy hover:border-primary hover:text-primary transition-all"
              >
                Bekijk hoe het werkt
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-text">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Geen aansluitkosten
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Geen creditcard nodig
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                7 dagen gratis
              </span>
            </div>
          </div>

          {/* Dashboard preview mockup */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-light-gray/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-bg-gray border-b border-light-gray">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="ml-4 flex-1 h-6 bg-white rounded-md border border-light-gray flex items-center px-3">
                  <span className="text-xs text-gray-text">jouwsalon.bookedwell.app</span>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <p className="text-xs text-gray-text font-medium">Boekingen vandaag</p>
                    <p className="text-2xl font-bold text-navy mt-1">12</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +23%</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-xs text-gray-text font-medium">No-show rate</p>
                    <p className="text-2xl font-bold text-navy mt-1">2.1%</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> -68%</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs text-gray-text font-medium">Omzet deze maand</p>
                    <p className="text-2xl font-bold text-navy mt-1">&euro;4.280</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +15%</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-4 gap-3">
                  {['09:00 - Sarah K.', '10:30 - Lisa M.', '12:00 - Emma V.', '14:00 - Nina B.'].map((slot) => (
                    <div key={slot} className="bg-bg-gray rounded-lg p-3 border border-light-gray/50">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-xs font-medium text-navy">{slot}</p>
                      <p className="text-[10px] text-gray-text">Knippen + Stylen</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Maak het jezelf gemakkelijk */}
      <section id="hoe-werkt-het" className="py-20 sm:py-28">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Alles-in-één platform</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy">
              Maak het jezelf gemakkelijk
            </h2>
            <p className="mt-4 text-lg text-gray-text max-w-2xl mx-auto">
              Onze intuïtieve software is speciaal ontworpen voor salons.
              Alle functies om je werk soepel te laten verlopen, zodat jij je weer bezighoudt met wat je het liefst doet.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Online boeken 24/7',
                desc: 'Klanten boeken wanneer het hen uitkomt. Via jouw eigen professionele boekingspagina.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: MessageSquare,
                title: 'WhatsApp reminders',
                desc: 'Automatische herinneringen via WhatsApp. Geen extra kosten per bericht.',
                color: 'bg-green-50 text-green-600',
              },
              {
                icon: Shield,
                title: 'No-show bescherming',
                desc: 'Optionele aanbetaling bij het boeken. Bescherm je omzet tegen no-shows.',
                color: 'bg-red-50 text-red-600',
              },
              {
                icon: BarChart3,
                title: 'Inzichten & analytics',
                desc: 'Real-time dashboard met no-show rate, populaire diensten en piekuren.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: Clock,
                title: 'Slimme planning',
                desc: 'Automatische beschikbaarheid op basis van werktijden en bestaande afspraken.',
                color: 'bg-orange-50 text-orange-600',
              },
              {
                icon: Users,
                title: 'Klantbeheer',
                desc: 'Complete klanthistorie, notities en labels. Weet precies wie er komt.',
                color: 'bg-cyan-50 text-cyan-600',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-white border border-light-gray/70 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-5`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-text leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlight 1 - Boekingspagina */}
      <section className="py-20 sm:py-28 bg-bg-gray">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Online boekingen</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-navy leading-tight">
                Ontdek jouw eigen professionele boekingspagina
              </h2>
              <p className="mt-5 text-lg text-gray-text leading-relaxed">
                Bespaar tijd door klanten online een afspraak te laten maken, 24/7.
                Jouw eigen boekingspagina onder jouw merknaam met automatische bevestigingen.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Eigen URL: jouwsalon.bookedwell.app',
                  'Automatische bevestiging via WhatsApp & e-mail',
                  'Klant kan zelf verplaatsen of annuleren',
                  'Responsive design voor mobiel & desktop',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-text">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 mt-8 text-primary font-semibold hover:gap-3 transition-all"
              >
                Maak je boekingspagina aan
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-xl border border-light-gray/50 p-6 sm:p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy">Beauty Salon Amsterdam</p>
                    <p className="text-xs text-gray-text">beautysalon.bookedwell.app</p>
                  </div>
                </div>
                {['Knippen', 'Knippen + Föhnen', 'Highlights', 'Keratine Behandeling'].map((service, i) => (
                  <div key={service} className="flex items-center justify-between p-4 rounded-xl bg-bg-gray border border-light-gray/50">
                    <div>
                      <p className="text-sm font-medium text-navy">{service}</p>
                      <p className="text-xs text-gray-text">{[30, 45, 90, 120][i]} min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-navy">&euro;{[25, 45, 85, 120][i]}</p>
                      <button className="text-xs text-primary font-medium">Boek nu</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlight 2 - WhatsApp & No-show */}
      <section className="py-20 sm:py-28">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-xl border border-light-gray/50 p-6 sm:p-8">
                <div className="space-y-4">
                  {/* WhatsApp message mockup */}
                  <div className="bg-[#DCF8C6] rounded-xl rounded-tr-none p-4 max-w-[85%] ml-auto">
                    <p className="text-sm text-navy font-medium mb-1">BookedWell</p>
                    <p className="text-sm text-slate">
                      Hoi Sarah! Herinnering: morgen om 14:00 heb je een afspraak bij Beauty Salon Amsterdam voor Knippen + Föhnen.
                    </p>
                    <p className="text-[10px] text-gray-text text-right mt-2">14:00 ✓✓</p>
                  </div>
                  <div className="bg-white rounded-xl rounded-tl-none p-4 max-w-[70%] border border-light-gray">
                    <p className="text-sm text-slate">Top, ik ben er!</p>
                    <p className="text-[10px] text-gray-text text-right mt-2">14:02</p>
                  </div>
                  <div className="bg-[#DCF8C6] rounded-xl rounded-tr-none p-4 max-w-[85%] ml-auto">
                    <p className="text-sm text-slate">
                      Nog 2 uur! Je afspraak bij Beauty Salon Amsterdam begint om 14:00. Tot zo!
                    </p>
                    <p className="text-[10px] text-gray-text text-right mt-2">12:00 ✓✓</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-light-gray flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center border-2 border-white">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center border-2 border-white">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-text">Klant bevestigd &middot; No-show risico: <span className="text-green-600 font-medium">Laag</span></p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">No-show preventie</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-navy leading-tight">
                Van boeking tot afspraak zonder zorgen
              </h2>
              <p className="mt-5 text-lg text-gray-text leading-relaxed">
                Automatische WhatsApp herinneringen zorgen ervoor dat je klanten hun afspraak niet vergeten.
                Combineer met optionele aanbetaling voor maximale bescherming.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'WhatsApp herinnering 24 uur voor afspraak',
                  'WhatsApp herinnering 2 uur voor afspraak',
                  'Optionele aanbetaling bij boeking',
                  'Automatische no-show registratie',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-text">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 mt-8 text-primary font-semibold hover:gap-3 transition-all"
              >
                Start met no-show preventie
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28 bg-bg-gray">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Reviews</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy">
              De beste salon software volgens onze gebruikers
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Lisa de Vries',
                salon: 'Beauty Studio Rotterdam',
                text: 'Sinds we BookedWell gebruiken is onze no-show rate met 70% gedaald. De WhatsApp reminders zijn een gamechanger!',
                rating: 5,
              },
              {
                name: 'Mohammed El Amrani',
                salon: 'Barber Kings Amsterdam',
                text: 'Eindelijk software die simpel is en gewoon werkt. Mijn klanten vinden het boeken super makkelijk.',
                rating: 5,
              },
              {
                name: 'Sophie Jansen',
                salon: 'Nail Art Den Haag',
                text: 'De aanbetaling optie is fantastisch. Geen gemiste afspraken meer en mijn omzet is gestegen.',
                rating: 5,
              },
            ].map((review) => (
              <div
                key={review.name}
                className="bg-white p-6 rounded-2xl border border-light-gray/70 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-primary/20 mb-3" />
                <p className="text-sm text-slate leading-relaxed mb-6">
                  {review.text}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-light-gray/50">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{review.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{review.name}</p>
                    <p className="text-xs text-gray-text">{review.salon}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zij werken met BookedWell */}
      <section className="py-20 sm:py-28">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Voor elke salon</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy">
              Zij werken met BookedWell
            </h2>
            <p className="mt-4 text-lg text-gray-text max-w-2xl mx-auto">
              Of je nu alleen werkt of in een team, BookedWell past bij elke salon.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              { icon: Scissors, label: 'Kapsalons' },
              { icon: Sparkles, label: 'Schoonheidssalons' },
              { icon: Users, label: 'Barbershops' },
              { icon: Sparkles, label: "Nagelstudio's" },
              { icon: Zap, label: "Spa's & Massage" },
              { icon: Scissors, label: 'Trimsalons' },
              { icon: Sparkles, label: 'Pedicurepraktijk' },
              { icon: Calendar, label: 'En meer...' },
            ].map((type) => (
              <div
                key={type.label}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-light-gray/70 hover:border-primary/30 hover:shadow-md transition-all cursor-default"
              >
                <div className="w-14 h-14 bg-primary/5 group-hover:bg-primary/10 rounded-2xl flex items-center justify-center transition-colors">
                  <type.icon className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm font-medium text-navy text-center">{type.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="prijzen" className="py-20 sm:py-28 bg-bg-gray">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Prijzen</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy">
              Simpele, eerlijke prijzen
            </h2>
            <p className="mt-4 text-lg text-gray-text">
              Start gratis. Upgrade wanneer je wilt. Geen verborgen kosten.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Solo',
                price: '19,95',
                serviceFee: '+ €0,15 per betaling',
                desc: 'De Starter',
                features: [
                  'Tot 100 boekingen/maand',
                  'Onbeperkt teamleden',
                  'E-mail reminders',
                  'WhatsApp reminders',
                  'Eigen boekingspagina',
                ],
                cta: '7 dagen gratis proberen',
                highlight: false,
              },
              {
                name: 'Growth',
                price: '29,95',
                serviceFee: '+ €0,15 per betaling',
                desc: 'De Medium Salon',
                features: [
                  'Tot 500 boekingen/maand',
                  'Onbeperkt teamleden',
                  'E-mail reminders',
                  'WhatsApp reminders',
                  'Eigen boekingspagina',
                  'Prioriteit support',
                ],
                cta: '7 dagen gratis proberen',
                highlight: true,
              },
              {
                name: 'Unlimited',
                price: '49,95',
                serviceFee: '+ €0,15 per betaling',
                desc: 'De Grote Salon',
                features: [
                  'Onbeperkt boekingen',
                  'Onbeperkt teamleden',
                  'E-mail reminders',
                  'WhatsApp reminders',
                  'Eigen boekingspagina',
                  'Prioriteit support',
                ],
                cta: '7 dagen gratis proberen',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 sm:p-8 rounded-2xl border-2 transition-all ${
                  plan.highlight
                    ? 'border-primary bg-white shadow-xl scale-[1.02]'
                    : 'border-light-gray/70 bg-white hover:border-primary/30 hover:shadow-md'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-block px-4 py-1.5 text-xs font-bold bg-primary text-white rounded-full shadow-md">
                      Meest gekozen
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-navy">{plan.name}</h3>
                <p className="text-sm text-gray-text mt-1">{plan.desc}</p>
                <div className="mt-6 mb-2">
                  <span className="text-4xl font-extrabold text-navy">
                    &euro;{plan.price}
                  </span>
                  <span className="text-gray-text text-sm">/maand</span>
                </div>
                <p className="text-xs font-medium text-primary mb-6">{plan.serviceFee}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-primary text-white hover:bg-primary-dark shadow-md shadow-primary/25'
                      : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-text mt-10">
            Alle prijzen excl. BTW. 7 dagen gratis proefperiode bij elk pakket.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 sm:py-28">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Vergelijk</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy">
              Waarom BookedWell?
            </h2>
            <p className="mt-4 text-lg text-gray-text max-w-xl mx-auto">
              Vergelijk ons met traditionele salonsoftware en ontdek het verschil.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-light-gray overflow-hidden shadow-sm">
              <div className="grid grid-cols-3 text-center text-sm font-semibold">
                <div className="p-4 bg-bg-gray" />
                <div className="p-4 bg-primary/5 text-primary border-x border-light-gray">BookedWell</div>
                <div className="p-4 bg-bg-gray text-gray-text">Traditioneel</div>
              </div>
              {[
                { label: 'Vanaf', ours: '€19,95/mnd', theirs: '€30+/mnd', icon: CreditCard },
                { label: 'Online betalingen', ours: true, theirs: false, icon: Shield },
                { label: 'WhatsApp reminders', ours: 'Inbegrepen', theirs: 'Niet beschikbaar', icon: Smartphone },
                { label: 'SMS credits', ours: 'Niet nodig', theirs: '€0,07-0,15/SMS', icon: Smartphone },
                { label: 'Teamleden', ours: 'Onbeperkt gratis', theirs: '€5-15/medewerker', icon: UserPlus },
                { label: 'No-show bescherming', ours: true, theirs: false, icon: Shield },
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
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="max-w-container mx-auto px-4 sm:px-6 text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Maak in twee eenvoudige stappen<br className="hidden sm:block" /> je account aan
          </h2>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
            Of je nu alleen werkt of in een team; BookedWell staat klaar voor jou.
            Eenvoudig, maar zeer effectief.
          </p>

          <div className="mt-12 grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Maak een account aan</h3>
              <p className="text-sm text-white/60 mt-2">Vul je gegevens in en je salon is binnen 2 minuten live.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Begin met boeken</h3>
              <p className="text-sm text-white/60 mt-2">Deel je boekingslink en ontvang direct je eerste afspraken.</p>
            </div>
          </div>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center mt-12 px-10 py-4 text-base font-semibold rounded-xl bg-white text-navy hover:bg-gray-100 transition-all shadow-lg hover:-translate-y-0.5"
          >
            Aan de slag
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
