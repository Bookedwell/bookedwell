import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact | BookedWell',
  description: 'Neem contact op met BookedWell',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-blue-600 hover:underline text-sm mb-8 inline-block">
          ← Terug naar home
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-700 mb-8">
            Heb je vragen over BookedWell? We helpen je graag! Neem contact met ons op via 
            onderstaande gegevens of vul het contactformulier in.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Contactgegevens</h2>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Telefoon</p>
                  <a href="tel:+31620890316" className="text-blue-600 hover:underline">
                    +31 6 20 89 03 16
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">E-mail</p>
                  <a href="mailto:info@bookedwell.app" className="text-blue-600 hover:underline">
                    info@bookedwell.app
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Adres</p>
                  <p className="text-gray-600">
                    Rietbaan 2<br />
                    2908LP Capelle aan den IJssel
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Bereikbaarheid</p>
                  <p className="text-gray-600">
                    Maandag t/m vrijdag<br />
                    09:00 - 17:00 uur
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Bedrijfsgegevens</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bedrijfsnaam</span>
                  <span className="text-gray-900 font-medium">BookedWell</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">KVK-nummer</span>
                  <span className="text-gray-900 font-medium">98442945</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vestigingsplaats</span>
                  <span className="text-gray-900 font-medium">Capelle aan den IJssel</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Support nodig?</strong><br />
                  Voor technische ondersteuning kun je ook mailen naar{' '}
                  <a href="mailto:support@bookedwell.app" className="underline">
                    support@bookedwell.app
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>BookedWell • KVK: 98442945</p>
        </div>
      </div>
    </div>
  );
}
