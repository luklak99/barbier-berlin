import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, getUser, type User } from '../../lib/api';

type Tab = 'appointments' | 'points' | 'reviews' | 'settings';

interface Booking {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paidWithPoints: boolean;
  pointsUsed: number;
  serviceName: string;
  servicePrice: number;
  createdAt: string;
}

interface PointsData {
  balance: number;
  valueEur: string;
  transactions: {
    id: string;
    amount: number;
    type: 'earned' | 'redeemed' | 'expired';
    description: string | null;
    createdAt: string;
  }[];
}

const statusLabels = {
  confirmed: { text: 'Bestätigt', class: 'bg-green-500/10 text-green-400' },
  completed: { text: 'Abgeschlossen', class: 'bg-white/5 text-white/40' },
  cancelled: { text: 'Storniert', class: 'bg-red-500/10 text-red-400' },
  no_show: { text: 'Nicht erschienen', class: 'bg-orange-500/10 text-orange-400' },
};

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Appointments state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Points state
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsError, setPointsError] = useState('');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Review state
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Auth-Check
  useEffect(() => {
    getUser().then((u) => {
      if (!u) {
        window.location.href = '/login';
      } else {
        setUser(u);
        setAuthChecked(true);
      }
    });
  }, []);

  // Bookings laden
  useEffect(() => {
    if (!authChecked) return;
    loadBookings();
  }, [authChecked]);

  // Points laden wenn Tab gewechselt wird
  useEffect(() => {
    if (!authChecked || activeTab !== 'points') return;
    loadPoints();
  }, [authChecked, activeTab]);

  const loadBookings = async () => {
    setBookingsLoading(true);
    setBookingsError('');
    try {
      const data = await api<{ bookings: Booking[] }>('/api/bookings/list');
      setBookings(data.bookings);
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : 'Fehler beim Laden der Termine.');
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadPoints = async () => {
    setPointsLoading(true);
    setPointsError('');
    try {
      const data = await api<PointsData>('/api/points/balance');
      setPointsData(data);
    } catch (err) {
      setPointsError(err instanceof Error ? err.message : 'Fehler beim Laden der Punkte.');
    } finally {
      setPointsLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Möchten Sie diesen Termin wirklich stornieren?')) return;

    setCancellingId(bookingId);
    try {
      await api<{ success: boolean }>('/api/bookings/cancel', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
      // Booking-Liste aktualisieren
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Stornieren.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRedeem = async (bookingId: string) => {
    if (!confirm('Möchten Sie Ihre Punkte für diesen Termin einlösen?')) return;

    setRedeemingId(bookingId);
    try {
      await api<{ success: boolean; pointsUsed: number; newBalance: number }>('/api/points/redeem', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
      // Beide Listen aktualisieren
      await loadBookings();
      await loadPoints();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Einlösen der Punkte.');
    } finally {
      setRedeemingId(null);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBookingId) return;

    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      await api<{ success: boolean }>('/api/reviews/create', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: reviewBookingId,
          rating: reviewRating,
          text: reviewText || undefined,
        }),
      });
      setReviewSuccess('Bewertung erfolgreich abgegeben!');
      setReviewBookingId(null);
      setReviewRating(5);
      setReviewText('');
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Bewertung.');
    } finally {
      setReviewLoading(false);
    }
  };

  const upcomingCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

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
          <h1 className="text-3xl font-display font-bold text-white">Mein Bereich</h1>
          <p className="text-white/40 mt-1">Willkommen zurück, {user?.name?.split(' ')[0] ?? ''}!</p>
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
          <p className="text-2xl font-display font-bold text-white mt-1">
            {bookingsLoading ? '...' : upcomingCount}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Punktestand</p>
          <p className="text-2xl font-display font-bold text-gold-400 mt-1">
            {pointsData ? pointsData.balance : user?.pointsBalance ?? 0}
          </p>
          <p className="text-white/30 text-xs">
            Wert: {pointsData ? pointsData.valueEur : ((user?.pointsBalance ?? 0) / 100).toFixed(2)}€
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/40 text-sm">Besuche gesamt</p>
          <p className="text-2xl font-display font-bold text-white mt-1">
            {bookingsLoading ? '...' : completedCount}
          </p>
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
        {/* Termine Tab */}
        {activeTab === 'appointments' && (
          <div>
            {bookingsLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-white/40 text-sm">Termine werden geladen...</span>
              </div>
            )}

            {bookingsError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {bookingsError}
              </div>
            )}

            {!bookingsLoading && !bookingsError && bookings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/40">Noch keine Termine vorhanden.</p>
                <a href="/booking" className="text-gold-400 hover:text-gold-300 text-sm mt-2 inline-block">
                  Jetzt Termin buchen
                </a>
              </div>
            )}

            {!bookingsLoading && !bookingsError && bookings.length > 0 && (
              <div className="space-y-3">
                {bookings.map((apt) => (
                  <div key={apt.id} className="bg-white/5 rounded-xl p-5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-white font-medium">{apt.serviceName}</h3>
                      <p className="text-white/40 text-sm mt-0.5">
                        {new Date(apt.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })} um {apt.startTime} Uhr
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[apt.status]?.class ?? 'bg-white/5 text-white/40'}`}>
                        {statusLabels[apt.status]?.text ?? apt.status}
                      </span>
                      {apt.paidWithPoints && (
                        <span className="px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 text-xs font-medium">
                          Mit Punkten bezahlt
                        </span>
                      )}
                      <span className="text-gold-400 font-display font-bold">{apt.servicePrice}€</span>
                      {apt.status === 'confirmed' && !apt.paidWithPoints && (
                        <button
                          onClick={() => handleRedeem(apt.id)}
                          disabled={redeemingId === apt.id}
                          className="text-gold-400 hover:text-gold-300 text-sm transition-colors disabled:opacity-50"
                        >
                          {redeemingId === apt.id ? 'Wird eingelöst...' : 'Punkte einlösen'}
                        </button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancel(apt.id)}
                          disabled={cancellingId === apt.id}
                          className="text-white/30 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
                        >
                          {cancellingId === apt.id ? 'Wird storniert...' : 'Stornieren'}
                        </button>
                      )}
                      {apt.status === 'completed' && (
                        <button
                          onClick={() => setReviewBookingId(apt.id)}
                          className="text-gold-400 hover:text-gold-300 text-sm transition-colors"
                        >
                          Bewerten
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Punkte Tab */}
        {activeTab === 'points' && (
          <div>
            {pointsLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-white/40 text-sm">Punkte werden geladen...</span>
              </div>
            )}

            {pointsError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {pointsError}
              </div>
            )}

            {!pointsLoading && !pointsError && pointsData && (
              <>
                <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/10 rounded-2xl p-8 border border-gold-500/20 mb-6">
                  <p className="text-gold-400/60 text-sm uppercase tracking-wider">Ihr Punktestand</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-display font-bold text-gold-400">{pointsData.balance}</span>
                    <span className="text-gold-400/60">Punkte</span>
                  </div>
                  <p className="text-gold-400/60 text-sm mt-1">Wert: {pointsData.valueEur}€</p>
                  <p className="text-white/30 text-xs mt-4">
                    Punkte verfallen nach 6 Monaten ohne Besuch. 1 Punkt = 1 Cent. Sie erhalten 5% Cashback auf jede Buchung.
                  </p>
                </div>

                {pointsData.transactions.length > 0 && (
                  <>
                    <h3 className="text-white font-semibold mb-3">Transaktionen</h3>
                    <div className="space-y-2">
                      {pointsData.transactions.map((tx) => (
                        <div key={tx.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm">{tx.description ?? 'Transaktion'}</p>
                            <p className="text-white/30 text-xs">
                              {new Date(tx.createdAt).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                          <span className={`font-semibold ${tx.type === 'earned' ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.type === 'earned' ? '+' : '-'}{Math.abs(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {pointsData.transactions.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-4">Noch keine Transaktionen.</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Bewertungen Tab */}
        {activeTab === 'reviews' && (
          <div>
            {reviewSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-400 text-sm mb-4">
                {reviewSuccess}
              </div>
            )}

            {/* Bewertungsformular */}
            {reviewBookingId ? (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
                <h3 className="text-white font-semibold mb-4">Bewertung schreiben</h3>
                <form onSubmit={handleReview}>
                  <div className="mb-4">
                    <label className="text-white/40 text-sm block mb-2">Bewertung</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1"
                        >
                          <svg
                            className={`w-8 h-8 ${star <= reviewRating ? 'text-gold-400' : 'text-white/20'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-white/40 text-sm block mb-2">Kommentar (optional)</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500 resize-none"
                      placeholder="Wie war Ihr Erlebnis?"
                    />
                  </div>
                  {reviewError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
                      {reviewError}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewBookingId(null);
                        setReviewError('');
                      }}
                      className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="flex-1 py-2.5 rounded-lg bg-gold-500 text-surface-950 font-semibold text-sm hover:bg-gold-400 transition-colors disabled:opacity-50"
                    >
                      {reviewLoading ? 'Wird gesendet...' : 'Bewertung abgeben'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                {/* Abgeschlossene Termine zur Bewertung */}
                {bookings.filter((b) => b.status === 'completed').length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-white/40 text-sm mb-3">
                      Wählen Sie einen abgeschlossenen Termin, um eine Bewertung zu schreiben.
                    </p>
                    {bookings.filter((b) => b.status === 'completed').map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => setReviewBookingId(apt.id)}
                        className="w-full text-left bg-white/5 rounded-xl p-4 border border-white/5 hover:border-gold-500/30 transition-colors"
                      >
                        <h4 className="text-white font-medium">{apt.serviceName}</h4>
                        <p className="text-white/40 text-sm">
                          {new Date(apt.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-white/40">Noch keine abgeschlossenen Termine zum Bewerten.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Einstellungen Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/5">
              <h3 className="text-white font-semibold mb-4">Profil</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-white/40 text-sm">Name</label>
                  <input type="text" defaultValue={user?.name ?? ''} className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500" />
                </div>
                <div>
                  <label className="text-white/40 text-sm">E-Mail</label>
                  <input type="email" defaultValue={user?.email ?? ''} disabled className="w-full mt-1 bg-white/3 border border-white/5 rounded-lg px-4 py-2 text-white/40 text-sm cursor-not-allowed" />
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/5">
              <h3 className="text-white font-semibold mb-2">Zwei-Faktor-Authentifizierung</h3>
              <p className="text-white/40 text-sm mb-4">
                {user?.totpEnabled
                  ? 'Zwei-Faktor-Authentifizierung ist aktiviert.'
                  : 'Schützen Sie Ihr Konto mit einem zusätzlichen Sicherheitscode.'}
              </p>
              {!user?.totpEnabled && (
                <button className="px-4 py-2 rounded-lg bg-gold-500/10 text-gold-400 text-sm font-medium hover:bg-gold-500/20 transition-colors">
                  2FA einrichten
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
