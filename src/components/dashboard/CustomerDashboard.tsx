import { useState } from 'react';
import { motion } from 'framer-motion';

type Tab = 'appointments' | 'points' | 'reviews' | 'settings';

// Mock data - will be replaced with API calls
const mockAppointments = [
  { id: '1', service: 'Herren Schneiden & Styling', date: '2026-04-15', time: '14:00', price: 25, status: 'confirmed' as const },
  { id: '2', service: 'Herren - Bart trimmen', date: '2026-03-28', time: '11:00', price: 17, status: 'completed' as const },
  { id: '3', service: 'Herren - Haarschnitt & Rasur', date: '2026-03-10', time: '10:30', price: 40, status: 'completed' as const },
];

const mockPoints = {
  balance: 410,
  value: '4,10€',
  transactions: [
    { id: '1', type: 'earned' as const, amount: 200, description: 'Haarschnitt & Rasur', date: '2026-03-10' },
    { id: '2', type: 'earned' as const, amount: 85, description: 'Bart trimmen', date: '2026-03-28' },
    { id: '3', type: 'earned' as const, amount: 125, description: 'Schneiden & Styling', date: '2026-04-15' },
  ],
};

const statusLabels = {
  confirmed: { text: 'Bestätigt', class: 'bg-green-500/10 text-green-400' },
  completed: { text: 'Abgeschlossen', class: 'bg-white/5 text-white/40' },
  cancelled: { text: 'Storniert', class: 'bg-red-500/10 text-red-400' },
};

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('appointments');

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    {
      key: 'appointments',
      label: 'Termine',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    {
      key: 'points',
      label: 'Punkte',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    },
    {
      key: 'reviews',
      label: 'Bewertungen',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    },
    {
      key: 'settings',
      label: 'Einstellungen',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Mein Bereich</h1>
          <p className="text-white/40 mt-1">Willkommen zurück!</p>
        </div>
        <a
          href="/booking"
          className="bg-gold-500 text-surface-950 font-semibold px-6 py-2.5 rounded-full hover:bg-gold-400 transition-colors text-sm"
        >
          Neuer Termin
        </a>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Anstehende Termine</p>
          <p className="text-2xl font-display font-bold text-white mt-1">1</p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Punktestand</p>
          <p className="text-2xl font-display font-bold text-gold-400 mt-1">{mockPoints.balance}</p>
          <p className="text-white/30 text-xs">Wert: {mockPoints.value}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Besuche gesamt</p>
          <p className="text-2xl font-display font-bold text-white mt-1">3</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-gold-500 text-surface-950'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === 'appointments' && (
          <div className="space-y-3">
            {mockAppointments.map((apt) => (
              <div key={apt.id} className="bg-white/5 rounded-xl p-5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-medium">{apt.service}</h3>
                  <p className="text-white/40 text-sm mt-0.5">
                    {new Date(apt.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })} um {apt.time} Uhr
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[apt.status].class}`}>
                    {statusLabels[apt.status].text}
                  </span>
                  <span className="text-gold-400 font-display font-bold">{apt.price}€</span>
                  {apt.status === 'confirmed' && (
                    <button className="text-white/30 hover:text-red-400 text-sm transition-colors">
                      Stornieren
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'points' && (
          <div>
            <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/10 rounded-2xl p-8 border border-gold-500/20 mb-6">
              <p className="text-gold-400/60 text-sm uppercase tracking-wider">Ihr Punktestand</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-display font-bold text-gold-400">{mockPoints.balance}</span>
                <span className="text-gold-400/60">Punkte</span>
              </div>
              <p className="text-gold-400/60 text-sm mt-1">Wert: {mockPoints.value}</p>
              <p className="text-white/30 text-xs mt-4">
                Punkte verfallen nach 6 Monaten ohne Besuch. 1 Punkt = 1 Cent. Sie erhalten 5% Cashback auf jede Buchung.
              </p>
            </div>
            <h3 className="text-white font-semibold mb-3">Transaktionen</h3>
            <div className="space-y-2">
              {mockPoints.transactions.map((tx) => (
                <div key={tx.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">{tx.description}</p>
                    <p className="text-white/30 text-xs">{new Date(tx.date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <span className={`font-semibold ${tx.type === 'earned' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'earned' ? '+' : '-'}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-white/40">Noch keine Bewertungen. Bewerten Sie uns nach Ihrem nächsten Besuch!</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/5">
              <h3 className="text-white font-semibold mb-4">Profil</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-white/40 text-sm">Name</label>
                  <input type="text" defaultValue="Max Mustermann" className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500" />
                </div>
                <div>
                  <label className="text-white/40 text-sm">Telefon</label>
                  <input type="tel" defaultValue="+49 170 1234567" className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500" />
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/5">
              <h3 className="text-white font-semibold mb-2">Zwei-Faktor-Authentifizierung</h3>
              <p className="text-white/40 text-sm mb-4">Schützen Sie Ihr Konto mit einem zusätzlichen Sicherheitscode.</p>
              <button className="px-4 py-2 rounded-lg bg-gold-500/10 text-gold-400 text-sm font-medium hover:bg-gold-500/20 transition-colors">
                2FA einrichten
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
