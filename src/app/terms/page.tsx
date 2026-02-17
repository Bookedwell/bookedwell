import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden | BookedWell',
  description: 'Algemene voorwaarden voor het gebruik van BookedWell',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-blue-600 hover:underline text-sm mb-8 inline-block">
          ← Terug naar home
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Algemene Voorwaarden</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6 text-gray-700 leading-relaxed">
          <p className="text-sm text-gray-500">Laatst bijgewerkt: februari 2026</p>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 1 - Definities</h2>
            <p>In deze algemene voorwaarden wordt verstaan onder:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>BookedWell:</strong> de besloten vennootschap BookedWell, gevestigd te Rietbaan 2, 2908LP Capelle aan den IJssel, KVK 98442945.</li>
              <li><strong>Klant:</strong> de natuurlijke of rechtspersoon die een overeenkomst aangaat met BookedWell voor het gebruik van de dienst.</li>
              <li><strong>Eindgebruiker:</strong> de consument die via het platform van de Klant een boeking plaatst.</li>
              <li><strong>Dienst:</strong> het online boekingsplatform en alle bijbehorende functionaliteiten.</li>
              <li><strong>Overeenkomst:</strong> de overeenkomst tussen BookedWell en Klant.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 2 - Toepasselijkheid</h2>
            <p>
              Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, offertes en overeenkomsten 
              tussen BookedWell en de Klant. Afwijkingen van deze voorwaarden zijn slechts geldig indien 
              deze uitdrukkelijk schriftelijk zijn overeengekomen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 3 - De Dienst</h2>
            <p>BookedWell biedt een online boekingsplatform waarmee Klanten:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Online boekingen kunnen ontvangen via een boekingswidget</li>
              <li>Betalingen kunnen verwerken via geïntegreerde betalingsproviders</li>
              <li>Automatische herinneringen kunnen versturen via SMS, WhatsApp en e-mail</li>
              <li>Hun agenda en klantgegevens kunnen beheren</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 4 - Abonnementen en Prijzen</h2>
            <p>
              BookedWell hanteert verschillende abonnementsvormen. De actuele prijzen staan vermeld op de website. 
              Alle prijzen zijn exclusief BTW tenzij anders vermeld. BookedWell behoudt zich het recht voor om 
              prijzen te wijzigen. Prijswijzigingen worden minimaal 30 dagen van tevoren aangekondigd.
            </p>
            <p className="mt-2">
              Naast de maandelijkse abonnementskosten kunnen er kosten per boeking in rekening worden gebracht, 
              alsmede transactiekosten voor betalingsverwerking. Deze kosten worden duidelijk gecommuniceerd 
              bij het afsluiten van het abonnement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 5 - Betalingen</h2>
            <p>
              Betaling van het abonnement geschiedt vooraf per maand via automatische incasso of creditcard. 
              Bij niet-tijdige betaling behoudt BookedWell zich het recht voor om de toegang tot de dienst 
              op te schorten totdat volledige betaling is ontvangen.
            </p>
            <p className="mt-2">
              Betalingen van Eindgebruikers aan Klanten worden verwerkt via externe betalingsproviders 
              (Stripe/Mollie). BookedWell is niet verantwoordelijk voor storingen of fouten bij deze 
              betalingsproviders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 6 - Proefperiode</h2>
            <p>
              BookedWell biedt een gratis proefperiode van 14 dagen aan. Tijdens de proefperiode heeft de 
              Klant toegang tot alle functionaliteiten. Na afloop van de proefperiode wordt het abonnement 
              automatisch omgezet naar een betaald abonnement, tenzij de Klant voor het einde van de 
              proefperiode opzegt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 7 - Opzegging</h2>
            <p>
              Het abonnement kan op elk moment worden opgezegd. De opzegging gaat in aan het einde van de 
              lopende factureringsperiode. Reeds betaalde abonnementsgelden worden niet gerestitueerd.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 8 - Beschikbaarheid</h2>
            <p>
              BookedWell streeft naar een beschikbaarheid van 99,9% maar garandeert geen ononderbroken 
              toegang tot de dienst. BookedWell is niet aansprakelijk voor schade als gevolg van 
              onderhoudswerkzaamheden of storingen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 9 - Aansprakelijkheid</h2>
            <p>
              De aansprakelijkheid van BookedWell is beperkt tot het bedrag dat de Klant in de 12 maanden 
              voorafgaand aan de schade aan BookedWell heeft betaald. BookedWell is niet aansprakelijk voor 
              indirecte schade, waaronder begrepen gederfde winst, gemiste besparingen en schade door 
              bedrijfsstagnatie.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 10 - Intellectueel Eigendom</h2>
            <p>
              Alle intellectuele eigendomsrechten op de dienst, waaronder software, teksten en afbeeldingen, 
              berusten bij BookedWell. De Klant verkrijgt uitsluitend een niet-exclusief gebruiksrecht voor 
              de duur van de overeenkomst.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 11 - Privacy</h2>
            <p>
              BookedWell verwerkt persoonsgegevens conform de Algemene Verordening Gegevensbescherming (AVG). 
              Zie onze <Link href="/privacy" className="text-blue-600 hover:underline">Privacyverklaring</Link> voor 
              meer informatie.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 12 - Toepasselijk Recht</h2>
            <p>
              Op deze overeenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de 
              bevoegde rechter in Rotterdam.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 13 - Contact</h2>
            <p>
              Voor vragen over deze algemene voorwaarden kunt u contact opnemen met:
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
