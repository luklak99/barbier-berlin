import { useState } from 'react';
import { motion } from 'framer-motion';

type Tab = 'today' | 'all' | 'customers' | 'walkin';

const mockTodayAppointments = [
  { id: '1', customer: 'Marco S.', service: 'Herren Schneiden & Styling', time: '10:00', price: 25, paidWithPoints: false, status: 'confirmed' as const },
  { id: '2', customer: 'Ahmet K.', service: 'Herren - Haarschnitt & Rasur', time: '11:00', price: 40, paidWithPoints: true, pointsUsed: 4000, status: 'confirmed' as const },
  { id: '3', customer: 'Jonas W.', service: 'Herren - Bart trimmen', time: '12:00', price: 17, paidWithPoints: false, status: 'confirmed' as const },
  { id: '4', customer: 'David M.', service: 'Herren - Waschen & Schneiden', time: '14:00', price: 30, paidWithPoints: false, status: 'confirmed' as const },
  { id: '5', customer: 'Kemal Y.', service: 'Herren - Rasur', time: '15:30', price: 17, paidWithPoints: false, status: 'confirmed' as const },
];

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: 'Heute' },
    { key: 'all', label: 'Alle Termine' },
    { key: 'customers', label: 'Kunden' },
  ];

  const todayRevenue = mockTodayAppointments.reduce((sum, a) => sum + (a.paidWithPoints ? 0 : a.price), 0);
  const pointsPaid = mockTodayAppointments.filter((a) => a.paidWithPoints).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Admin-Portal</h1>
          <p className="text-white/40 mt-1">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setShowWalkInModal(true)}
          className="bg-gold-500 text-surface-950 font-semibold px-6 py-2.5 rounded-full hover:bg-gold-400 transition-colors text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Walk-in
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Termine heute</p>
          <p className="text-2xl font-display font-bold text-white mt-1">{mockTodayAppointments.length}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Umsatz heute</p>
          <p className="text-2xl font-display font-bold text-gold-400 mt-1">{todayRevenue}€</p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Mit Punkten bezahlt</p>
          <p className="text-2xl font-display font-bold text-white mt-1">{pointsPaid}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Zahlung ausstehend</p>
          <p className="text-2xl font-display font-bold text-white mt-1">{mockTodayAppointments.length - pointsPaid}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-gold-500 text-surface-950'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Today's Appointments */}
      {activeTab === 'today' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {mockTodayAppointments.map((apt) => (
            <div
              key={apt.id}
              className={`rounded-xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                apt.paidWithPoints
                  ? 'bg-gold-500/5 border-gold-500/20'
                  : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-center bg-white/5 rounded-lg px-3 py-2 min-w-[60px]">
                  <span className="text-white font-bold text-lg">{apt.time}</span>
                </div>
                <div>
                  <h3 className="text-white font-medium">{apt.customer}</h3>
                  <p className="text-white/40 text-sm">{apt.service}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {apt.paidWithPoints ? (
                  <span className="px-3 py-1 rounded-full bg-gold-500/20 text-gold-400 text-xs font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Mit Punkten bezahlt
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                    Zahlung im Salon
                  </span>
                )}
                <span className="text-white font-display font-bold text-lg">{apt.price}€</span>
                <button className="text-green-400 hover:text-green-300 transition-colors text-sm font-medium">
                  Abschließen
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'all' && (
        <div className="text-center py-12 text-white/40">
          Alle Termine werden hier angezeigt — mit Filter nach Datum, Status und Kunde.
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="text-center py-12 text-white/40">
          Kundenliste mit Punktestand, Besuchshistorie und Kontaktdaten.
        </div>
      )}

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-900 rounded-2xl p-6 max-w-md w-full border border-white/10"
          >
            <h3 className="text-white font-semibold text-lg mb-4">Walk-in hinzufügen</h3>
            <div className="space-y-3">
              <div>
                <label className="text-white/40 text-sm">Kundenname</label>
                <input type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500" placeholder="Name des Kunden" />
              </div>
              <div>
                <label className="text-white/40 text-sm">Service</label>
                <select className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500 [&>option]:bg-surface-900">
                  <option value="">Service wählen...</option>
                  <option value="herren-schneiden-styling">Herren Schneiden & Styling — 25€</option>
                  <option value="herren-haarschnitt-rasur">Herren - Haarschnitt & Rasur — 40€</option>
                  <option value="herren-bart-trimmen">Herren - Bart trimmen — 17€</option>
                  <option value="herren-rasur">Herren - Rasur — 17€</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWalkInModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-gold-500 text-surface-950 font-semibold text-sm hover:bg-gold-400 transition-colors"
              >
                Hinzufügen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
