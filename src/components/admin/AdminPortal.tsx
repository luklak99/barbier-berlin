import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, getUser } from '../../lib/api';
import { services } from '../../data/services';
import AdminStats from './AdminStats';

type Tab = 'today' | 'all' | 'customers' | 'stats';

interface Appointment {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paidWithPoints: boolean;
  pointsUsed: number;
  isWalkIn: boolean;
  serviceName: string;
  servicePrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [authChecked, setAuthChecked] = useState(false);

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Walk-in state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState('');
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [walkInError, setWalkInError] = useState('');

  // Date filter for "all" tab
  const [filterDate, setFilterDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0]!;

  // Auth-Check (Admin only)
  useEffect(() => {
    getUser().then((user) => {
      if (!user) {
        window.location.href = '/login';
      } else if (user.role !== 'admin') {
        window.location.href = '/dashboard';
      } else {
        setAuthChecked(true);
      }
    });
  }, []);

  // Appointments laden
  useEffect(() => {
    if (!authChecked) return;
    loadAppointments();
  }, [authChecked, activeTab, filterDate]);

  const loadAppointments = async () => {
    setAppointmentsLoading(true);
    setAppointmentsError('');
    try {
      const dateParam = activeTab === 'today' ? todayStr : filterDate || '';
      const url = dateParam
        ? `/api/admin/appointments?date=${dateParam}`
        : '/api/admin/appointments';
      const data = await api<{ appointments: Appointment[] }>(url);
      setAppointments(data.appointments);
    } catch (err) {
      setAppointmentsError(err instanceof Error ? err.message : 'Fehler beim Laden der Termine.');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleComplete = async (bookingId: string) => {
    setCompletingId(bookingId);
    try {
      await api<{ success: boolean }>('/api/admin/complete', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === bookingId ? { ...a, status: 'completed' as const } : a))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Abschließen.');
    } finally {
      setCompletingId(null);
    }
  };

  const handleWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInLoading(true);
    setWalkInError('');

    try {
      await api<{ success: boolean; bookingId: string }>('/api/admin/walkin', {
        method: 'POST',
        body: JSON.stringify({
          name: walkInName,
          email: walkInEmail || undefined,
          phone: walkInPhone || undefined,
          serviceId: walkInServiceId,
        }),
      });
      // Modal schliessen und Daten zuruecksetzen
      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInEmail('');
      setWalkInPhone('');
      setWalkInServiceId('');
      // Termine neu laden
      await loadAppointments();
    } catch (err) {
      setWalkInError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen.');
    } finally {
      setWalkInLoading(false);
    }
  };

  const todayAppointments = appointments.filter(
    (a) => a.date === todayStr
  );

  const confirmedToday = todayAppointments.filter((a) => a.status === 'confirmed' || a.status === 'completed');
  const todayRevenue = confirmedToday.reduce((sum, a) => sum + (a.paidWithPoints ? 0 : a.servicePrice), 0);
  const pointsPaid = confirmedToday.filter((a) => a.paidWithPoints).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: 'Heute' },
    { key: 'all', label: 'Alle Termine' },
    { key: 'customers', label: 'Kunden' },
    { key: 'stats', label: 'Statistiken' },
  ];

  const displayAppointments = activeTab === 'today' ? todayAppointments : appointments;

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          <p className="text-2xl font-display font-bold text-white mt-1">
            {appointmentsLoading ? '...' : todayAppointments.length}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Umsatz heute</p>
          <p className="text-2xl font-display font-bold text-gold-400 mt-1">
            {appointmentsLoading ? '...' : `${todayRevenue}€`}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Mit Punkten bezahlt</p>
          <p className="text-2xl font-display font-bold text-white mt-1">
            {appointmentsLoading ? '...' : pointsPaid}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Zahlung ausstehend</p>
          <p className="text-2xl font-display font-bold text-white mt-1">
            {appointmentsLoading
              ? '...'
              : todayAppointments.filter((a) => a.status === 'confirmed' && !a.paidWithPoints).length}
          </p>
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

      {/* Date filter for "all" tab */}
      {activeTab === 'all' && (
        <div className="mb-6">
          <label className="text-white/40 text-sm block mb-2">Nach Datum filtern</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500 [color-scheme:dark]"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="ml-3 text-white/40 hover:text-white text-sm transition-colors"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Appointments List */}
      {(activeTab === 'today' || activeTab === 'all') && (
        <>
          {appointmentsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-white/40 text-sm">Termine werden geladen...</span>
            </div>
          )}

          {appointmentsError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              {appointmentsError}
            </div>
          )}

          {!appointmentsLoading && !appointmentsError && displayAppointments.length === 0 && (
            <div className="text-center py-12 text-white/40">
              {activeTab === 'today' ? 'Heute keine Termine.' : 'Keine Termine gefunden.'}
            </div>
          )}

          {!appointmentsLoading && !appointmentsError && displayAppointments.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {displayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`rounded-xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    apt.paidWithPoints
                      ? 'bg-gold-500/5 border-gold-500/20'
                      : apt.status === 'completed'
                        ? 'bg-white/3 border-white/5'
                        : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-white/5 rounded-lg px-3 py-2 min-w-[60px]">
                      <span className="text-white font-bold text-lg">{apt.startTime}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        {apt.customerName}
                        {apt.isWalkIn && (
                          <span className="ml-2 text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Walk-in</span>
                        )}
                      </h3>
                      <p className="text-white/40 text-sm">{apt.serviceName}</p>
                      {activeTab === 'all' && apt.date !== todayStr && (
                        <p className="text-white/30 text-xs mt-0.5">
                          {new Date(apt.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {apt.status === 'completed' && (
                      <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                        Abgeschlossen
                      </span>
                    )}
                    {apt.status === 'cancelled' && (
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                        Storniert
                      </span>
                    )}
                    {apt.paidWithPoints ? (
                      <span className="px-3 py-1 rounded-full bg-gold-500/20 text-gold-400 text-xs font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Mit Punkten bezahlt
                      </span>
                    ) : apt.status === 'confirmed' ? (
                      <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                        Zahlung im Salon
                      </span>
                    ) : null}
                    <span className="text-white font-display font-bold text-lg">{apt.servicePrice}€</span>
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => handleComplete(apt.id)}
                        disabled={completingId === apt.id}
                        className="text-green-400 hover:text-green-300 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {completingId === apt.id ? 'Wird abgeschlossen...' : 'Abschließen'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="text-center py-12 text-white/40">
          Kundenliste mit Punktestand, Besuchshistorie und Kontaktdaten.
        </div>
      )}

      {activeTab === 'stats' && <AdminStats />}

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-900 rounded-2xl p-6 max-w-md w-full border border-white/10"
          >
            <h3 className="text-white font-semibold text-lg mb-4">Walk-in hinzufügen</h3>
            <form onSubmit={handleWalkIn}>
              <div className="space-y-3">
                <div>
                  <label className="text-white/40 text-sm">Kundenname *</label>
                  <input
                    type="text"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    required
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                    placeholder="Name des Kunden"
                  />
                </div>
                <div>
                  <label className="text-white/40 text-sm">E-Mail (optional)</label>
                  <input
                    type="email"
                    value={walkInEmail}
                    onChange={(e) => setWalkInEmail(e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                    placeholder="kunde@beispiel.de"
                  />
                </div>
                <div>
                  <label className="text-white/40 text-sm">Telefon (optional)</label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                    placeholder="+49 170 1234567"
                  />
                </div>
                <div>
                  <label className="text-white/40 text-sm">Service *</label>
                  <select
                    value={walkInServiceId}
                    onChange={(e) => setWalkInServiceId(e.target.value)}
                    required
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500 [&>option]:bg-surface-900"
                  >
                    <option value="">Service wählen...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name.de} — {s.price}€
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {walkInError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mt-4">
                  {walkInError}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowWalkInModal(false);
                    setWalkInError('');
                  }}
                  disabled={walkInLoading}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm transition-colors disabled:opacity-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={walkInLoading}
                  className="flex-1 py-2.5 rounded-lg bg-gold-500 text-surface-950 font-semibold text-sm hover:bg-gold-400 transition-colors disabled:opacity-50"
                >
                  {walkInLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
