'use client';

import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

interface CustomersClientProps {
  customers: any[];
}

export function CustomersClient({ customers }: CustomersClientProps) {
  const router = useRouter();

  const scoreColors: Record<string, { bg: string; text: string; label: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-700', label: 'Betrouwbaar' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Let op' },
    red: { bg: 'bg-red-50', text: 'text-red-700', label: 'Risico' },
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-light-gray overflow-hidden">
        {customers && customers.length > 0 ? (
          <>
            {/* Mobile card view */}
            <div className="divide-y divide-light-gray md:hidden">
              {customers.map((customer: any) => {
                const score = scoreColors[customer.reliability_score] || scoreColors.green;
                return (
                  <div 
                    key={customer.id} 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-navy">{customer.name}</p>
                        <p className="text-xs text-gray-text">{customer.phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${score.bg} ${score.text}`}>
                        {score.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-text">
                      <span>{customer.total_bookings} boekingen</span>
                      <span>{customer.no_show_count} no-shows</span>
                      {customer.last_booking_at && (
                        <span>
                          {new Date(customer.last_booking_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-light-gray bg-bg-gray/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-text">Klant</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-text">Telefoon</th>
                    <th className="text-center px-5 py-3 font-medium text-gray-text">Boekingen</th>
                    <th className="text-center px-5 py-3 font-medium text-gray-text">No-shows</th>
                    <th className="text-center px-5 py-3 font-medium text-gray-text">Score</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-text">Laatst geboekt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-gray">
                  {customers.map((customer: any) => {
                    const score = scoreColors[customer.reliability_score] || scoreColors.green;
                    return (
                      <tr 
                        key={customer.id} 
                        className="hover:bg-bg-gray/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {customer.profile_picture_url ? (
                              <img
                                src={customer.profile_picture_url}
                                alt={customer.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-sm font-medium">
                                  {customer.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-navy">{customer.name}</p>
                              {customer.email && (
                                <p className="text-xs text-gray-text">{customer.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate">{customer.phone}</td>
                        <td className="px-5 py-3 text-center text-slate">
                          {customer.total_bookings}
                        </td>
                        <td className="px-5 py-3 text-center text-slate">
                          {customer.no_show_count}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${score.bg} ${score.text}`}>
                            {score.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate">
                          {customer.last_booking_at
                            ? new Date(customer.last_booking_at).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-5 py-16 text-center">
            <Users className="w-10 h-10 text-light-gray mx-auto mb-3" />
            <p className="text-sm font-medium text-navy">Nog geen klanten</p>
            <p className="text-xs text-gray-text mt-1">
              Klanten worden automatisch aangemaakt wanneer ze een afspraak boeken
            </p>
          </div>
        )}
      </div>

    </>
  );
}
