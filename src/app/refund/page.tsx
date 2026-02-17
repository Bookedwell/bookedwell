import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Restitutiebeleid | BookedWell',
  description: 'Restitutie- en annuleringsbeleid van BookedWell',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-blue-600 hover:underline text-sm mb-8 inline-block">
          ← Terug naar home
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Restitutiebeleid</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6 text-gray-700 leading-relaxed">
          <p className="text-sm text-gray-500">Laatst bijgewerkt: februari 2026</p>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Abonnementskosten</h2>
            <h3 className="font-semibold text-gray-800 mt-4 mb-2">Proefperiode</h3>
            <p>
              BookedWell biedt een gratis proefperiode van 14 dagen. Tijdens deze periode worden geen 
              kosten in rekening gebracht. U kunt op elk moment tijdens de proefperiode opzeggen zonder 
              enige kosten.
            </p>
            
            <h3 className="font-semibold text-gray-800 mt-4 mb-2">Betaald abonnement</h3>
            <p>
              Na de proefperiode wordt het abonnement maandelijks gefactureerd. Abonnementskosten worden 
              vooraf in rekening gebracht en zijn niet restitueerbaar. Bij opzegging blijft uw account 
              actief tot het einde van de lopende factureringsperiode.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Transactiekosten</h2>
            <p>
              Kosten per boeking en transactiekosten zijn niet restitueerbaar, aangezien deze kosten 
              worden gemaakt op het moment van de boeking (SMS, WhatsApp, betalingsverwerking).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Betalingen via BookedWell</h2>
            <h3 className="font-semibold text-gray-800 mt-4 mb-2">Voor saloneigenaren (Klanten)</h3>
            <p>
              Betalingen die uw klanten doen via het boekingssysteem worden rechtstreeks verwerkt naar 
              uw verbonden betaalrekening (Stripe/Mollie). BookedWell houdt geen klantbetalingen aan.
            </p>
            
            <h3 className="font-semibold text-gray-800 mt-4 mb-2">Voor eindgebruikers (klanten van salons)</h3>
            <p>
              Als eindgebruiker heeft u een afspraak geboekt bij een salon die gebruikmaakt van BookedWell. 
              Voor vragen over restitutie van uw betaling dient u rechtstreeks contact op te nemen met de 
              betreffende salon. Het annulerings- en restitutiebeleid wordt bepaald door de salon, niet 
              door BookedWell.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Annulering van boekingen</h2>
            <p>
              Het annuleringsbeleid voor boekingen wordt bepaald door de individuele salon. BookedWell 
              faciliteert enkel het boekingsplatform. Neem voor annuleringen contact op met de salon waar 
              u de afspraak heeft gemaakt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Uitzonderingen</h2>
            <p>In uitzonderlijke gevallen kan restitutie worden overwogen:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Technische storingen aan onze kant waardoor de dienst niet beschikbaar was</li>
              <li>Dubbele afschrijvingen door een systeemfout</li>
              <li>Andere situaties ter beoordeling van BookedWell</li>
            </ul>
            <p className="mt-2">
              Voor restitutieverzoeken kunt u contact opnemen via info@bookedwell.app met vermelding 
              van uw accountgegevens en de reden voor het verzoek.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Hoe opzeggen?</h2>
            <p>
              U kunt uw abonnement op elk moment opzeggen via uw dashboard onder Instellingen → Abonnement. 
              Na opzegging blijft uw account actief tot het einde van de huidige factureringsperiode.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact</h2>
            <p>
              Heeft u vragen over dit restitutiebeleid? Neem contact met ons op:
            </p>
            <p className="mt-2">
              BookedWell<br />
              Rietbaan 2<br />
              2908LP Capelle aan den IJssel<br />
              Telefoon: +31 6 20 89 03 16<br />
              E-mail: info@bookedwell.app
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
