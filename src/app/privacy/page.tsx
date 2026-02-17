import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacyverklaring | BookedWell',
  description: 'Hoe BookedWell omgaat met uw persoonsgegevens',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-blue-600 hover:underline text-sm mb-8 inline-block">
          ← Terug naar home
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacyverklaring</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6 text-gray-700 leading-relaxed">
          <p className="text-sm text-gray-500">Laatst bijgewerkt: februari 2026</p>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Wie zijn wij?</h2>
            <p>
              BookedWell is een handelsnaam van BookedWell, gevestigd te Rietbaan 2, 2908LP Capelle aan den IJssel, 
              ingeschreven bij de Kamer van Koophandel onder nummer 98442945. Wij zijn verantwoordelijk voor de 
              verwerking van persoonsgegevens zoals weergegeven in deze privacyverklaring.
            </p>
            <p className="mt-2">
              <strong>Contactgegevens:</strong><br />
              Rietbaan 2<br />
              2908LP Capelle aan den IJssel<br />
              Telefoon: +31 6 20 89 03 16<br />
              E-mail: info@bookedwell.app
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Welke gegevens verzamelen wij?</h2>
            <p>Wij verwerken persoonsgegevens doordat u gebruik maakt van onze diensten en/of omdat u deze zelf aan ons verstrekt:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Voor- en achternaam</li>
              <li>Telefoonnummer</li>
              <li>E-mailadres</li>
              <li>Betalingsgegevens (verwerkt door onze betalingsprovider)</li>
              <li>IP-adres</li>
              <li>Gegevens over uw activiteiten op onze website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Waarom verzamelen wij deze gegevens?</h2>
            <p>BookedWell verwerkt uw persoonsgegevens voor de volgende doelen:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Het afhandelen van uw boeking en betaling</li>
              <li>U te kunnen bellen of e-mailen indien dit nodig is</li>
              <li>U te informeren over wijzigingen van onze diensten</li>
              <li>Het verzenden van afspraakbevestigingen en herinneringen via SMS, WhatsApp of e-mail</li>
              <li>Het verbeteren van onze dienstverlening</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Hoe lang bewaren wij gegevens?</h2>
            <p>
              BookedWell bewaart uw persoonsgegevens niet langer dan strikt nodig is om de doelen te realiseren 
              waarvoor uw gegevens worden verzameld. Wij hanteren een bewaartermijn van maximaal 7 jaar voor 
              financiële gegevens (wettelijke verplichting) en 2 jaar voor overige persoonsgegevens na laatste contact.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Delen met anderen</h2>
            <p>
              BookedWell verkoopt uw gegevens niet aan derden en verstrekt deze uitsluitend indien dit nodig is 
              voor de uitvoering van onze overeenkomst met u of om te voldoen aan een wettelijke verplichting. 
              Met bedrijven die uw gegevens verwerken in onze opdracht, sluiten wij een bewerkersovereenkomst om 
              te zorgen voor eenzelfde niveau van beveiliging en vertrouwelijkheid van uw gegevens.
            </p>
            <p className="mt-2">Wij maken gebruik van de volgende dienstverleners:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Stripe/Mollie</strong> - voor betalingsverwerking</li>
              <li><strong>Twilio</strong> - voor SMS en WhatsApp berichten</li>
              <li><strong>Resend</strong> - voor e-mail verzending</li>
              <li><strong>Vercel</strong> - voor website hosting</li>
              <li><strong>Supabase</strong> - voor database hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
            <p>
              BookedWell gebruikt alleen technische en functionele cookies die geen inbreuk maken op uw privacy. 
              Een cookie is een klein tekstbestand dat bij het eerste bezoek aan deze website wordt opgeslagen 
              op uw computer, tablet of smartphone. De cookies die wij gebruiken zijn noodzakelijk voor de 
              technische werking van de website en uw gebruiksgemak.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Uw rechten</h2>
            <p>U heeft het recht om:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Uw persoonsgegevens in te zien</li>
              <li>Uw persoonsgegevens te laten corrigeren</li>
              <li>Uw persoonsgegevens te laten verwijderen</li>
              <li>Uw toestemming in te trekken</li>
              <li>Bezwaar te maken tegen de verwerking</li>
              <li>Uw gegevens over te dragen (dataportabiliteit)</li>
            </ul>
            <p className="mt-2">
              U kunt een verzoek tot inzage, correctie, verwijdering of overdracht van uw persoonsgegevens 
              sturen naar info@bookedwell.app. Wij reageren binnen 4 weken op uw verzoek.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Beveiliging</h2>
            <p>
              BookedWell neemt de bescherming van uw gegevens serieus en neemt passende maatregelen om misbruik, 
              verlies, onbevoegde toegang, ongewenste openbaarmaking en ongeoorloofde wijziging tegen te gaan. 
              Onze website maakt gebruik van een SSL-certificaat (HTTPS) en alle betalingen worden verwerkt via 
              gecertificeerde betalingsproviders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Klachten</h2>
            <p>
              Als u een klacht heeft over de verwerking van uw persoonsgegevens, neem dan contact met ons op. 
              Komt u er niet uit, dan heeft u het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens, 
              de toezichthoudende autoriteit op het gebied van privacybescherming.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>BookedWell • KVK: 98442945</p>
        </div>
      </div>
    </div>
  );
}
