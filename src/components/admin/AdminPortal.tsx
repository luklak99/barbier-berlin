import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, getUser } from '../../lib/api';
import { services } from '../../data/services';
import { type Language } from '../../i18n/translations';
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

const localeMap: Record<Language, string> = {
  de: 'de-DE',
  en: 'en-GB',
  tr: 'tr-TR',
  ar: 'ar-SA',
};

function getLocale(lang: Language): string {
  return localeMap[lang];
}

const adminLabels: Record<Language, {
  tabToday: string;
  tabAll: string;
  tabCustomers: string;
  tabStats: string;
  statAppointmentsToday: string;
  statRevenueToday: string;
  statPaidWithPoints: string;
  statPaymentPending: string;
  filterByDate: string;
  resetFilter: string;
  loadingAppointments: string;
  emptyToday: string;
  emptyAll: string;
  statusCompleted: string;
  statusCancelled: string;
  badgePaidWithPoints: string;
  badgePaymentInSalon: string;
  completeBtn: string;
  completingBtn: string;
  customersPlaceholder: string;
  walkInTitle: string;
  walkInCustomerName: string;
  walkInCustomerNamePlaceholder: string;
  walkInEmail: string;
  walkInEmailPlaceholder: string;
  walkInPhone: string;
  walkInPhonePlaceholder: string;
  walkInService: string;
  walkInServicePlaceholder: string;
  walkInCancel: string;
  walkInSubmit: string;
  walkInSubmitting: string;
}> = {
  de: {
    tabToday: 'Heute',
    tabAll: 'Alle Termine',
    tabCustomers: 'Kunden',
    tabStats: 'Statistiken',
    statAppointmentsToday: 'Termine heute',
    statRevenueToday: 'Umsatz heute',
    statPaidWithPoints: 'Mit Punkten bezahlt',
    statPaymentPending: 'Zahlung ausstehend',
    filterByDate: 'Nach Datum filtern',
    resetFilter: 'Filter zurücksetzen',
    loadingAppointments: 'Termine werden geladen...',
    emptyToday: 'Heute keine Termine.',
    emptyAll: 'Keine Termine gefunden.',
    statusCompleted: 'Abgeschlossen',
    statusCancelled: 'Storniert',
    badgePaidWithPoints: 'Mit Punkten bezahlt',
    badgePaymentInSalon: 'Zahlung im Salon',
    completeBtn: 'Abschließen',
    completingBtn: 'Wird abgeschlossen...',
    customersPlaceholder: 'Kundenliste mit Punktestand, Besuchshistorie und Kontaktdaten.',
    walkInTitle: 'Walk-in hinzufügen',
    walkInCustomerName: 'Kundenname *',
    walkInCustomerNamePlaceholder: 'Name des Kunden',
    walkInEmail: 'E-Mail (optional)',
    walkInEmailPlaceholder: 'kunde@beispiel.de',
    walkInPhone: 'Telefon (optional)',
    walkInPhonePlaceholder: '+49 170 1234567',
    walkInService: 'Service *',
    walkInServicePlaceholder: 'Service wählen...',
    walkInCancel: 'Abbrechen',
    walkInSubmit: 'Hinzufügen',
    walkInSubmitting: 'Wird hinzugefügt...',
  },
  en: {
    tabToday: 'Today',
    tabAll: 'All Appointments',
    tabCustomers: 'Customers',
    tabStats: 'Statistics',
    statAppointmentsToday: 'Appointments today',
    statRevenueToday: "Today's revenue",
    statPaidWithPoints: 'Paid with points',
    statPaymentPending: 'Payment pending',
    filterByDate: 'Filter by date',
    resetFilter: 'Reset filter',
    loadingAppointments: 'Loading appointments...',
    emptyToday: 'No appointments today.',
    emptyAll: 'No appointments found.',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    badgePaidWithPoints: 'Paid with points',
    badgePaymentInSalon: 'Pay in salon',
    completeBtn: 'Complete',
    completingBtn: 'Completing...',
    customersPlaceholder: 'Customer list with points balance, visit history and contact details.',
    walkInTitle: 'Add walk-in',
    walkInCustomerName: 'Customer name *',
    walkInCustomerNamePlaceholder: "Customer's name",
    walkInEmail: 'Email (optional)',
    walkInEmailPlaceholder: 'customer@example.com',
    walkInPhone: 'Phone (optional)',
    walkInPhonePlaceholder: '+49 170 1234567',
    walkInService: 'Service *',
    walkInServicePlaceholder: 'Select service...',
    walkInCancel: 'Cancel',
    walkInSubmit: 'Add',
    walkInSubmitting: 'Adding...',
  },
  tr: {
    tabToday: 'Bugün',
    tabAll: 'Tüm Randevular',
    tabCustomers: 'Müşteriler',
    tabStats: 'İstatistikler',
    statAppointmentsToday: 'Bugünkü randevular',
    statRevenueToday: 'Bugünkü gelir',
    statPaidWithPoints: 'Puanla ödendi',
    statPaymentPending: 'Ödeme bekliyor',
    filterByDate: 'Tarihe göre filtrele',
    resetFilter: 'Filtreyi sıfırla',
    loadingAppointments: 'Randevular yükleniyor...',
    emptyToday: 'Bugün randevu yok.',
    emptyAll: 'Randevu bulunamadı.',
    statusCompleted: 'Tamamlandı',
    statusCancelled: 'İptal edildi',
    badgePaidWithPoints: 'Puanla ödendi',
    badgePaymentInSalon: 'Salonda ödeme',
    completeBtn: 'Tamamla',
    completingBtn: 'Tamamlanıyor...',
    customersPlaceholder: 'Puan bakiyesi, ziyaret geçmişi ve iletişim bilgileriyle müşteri listesi.',
    walkInTitle: 'Walk-in ekle',
    walkInCustomerName: 'Müşteri adı *',
    walkInCustomerNamePlaceholder: 'Müşterinin adı',
    walkInEmail: 'E-posta (isteğe bağlı)',
    walkInEmailPlaceholder: 'musteri@ornek.com',
    walkInPhone: 'Telefon (isteğe bağlı)',
    walkInPhonePlaceholder: '+49 170 1234567',
    walkInService: 'Hizmet *',
    walkInServicePlaceholder: 'Hizmet seçin...',
    walkInCancel: 'İptal',
    walkInSubmit: 'Ekle',
    walkInSubmitting: 'Ekleniyor...',
  },
  ar: {
    tabToday: 'اليوم',
    tabAll: 'جميع المواعيد',
    tabCustomers: 'العملاء',
    tabStats: 'الإحصائيات',
    statAppointmentsToday: 'مواعيد اليوم',
    statRevenueToday: 'إيرادات اليوم',
    statPaidWithPoints: 'مدفوع بالنقاط',
    statPaymentPending: 'الدفع معلق',
    filterByDate: 'تصفية حسب التاريخ',
    resetFilter: 'إعادة تعيين الفلتر',
    loadingAppointments: 'جارٍ تحميل المواعيد...',
    emptyToday: 'لا مواعيد اليوم.',
    emptyAll: 'لم يتم العثور على مواعيد.',
    statusCompleted: 'مكتمل',
    statusCancelled: 'ملغى',
    badgePaidWithPoints: 'مدفوع بالنقاط',
    badgePaymentInSalon: 'الدفع في الصالون',
    completeBtn: 'إتمام',
    completingBtn: 'جارٍ الإتمام...',
    customersPlaceholder: 'قائمة العملاء مع رصيد النقاط وسجل الزيارات وبيانات التواصل.',
    walkInTitle: 'إضافة زيارة مباشرة',
    walkInCustomerName: 'اسم العميل *',
    walkInCustomerNamePlaceholder: 'اسم العميل',
    walkInEmail: 'البريد الإلكتروني (اختياري)',
    walkInEmailPlaceholder: 'customer@example.com',
    walkInPhone: 'الهاتف (اختياري)',
    walkInPhonePlaceholder: '+49 170 1234567',
    walkInService: 'الخدمة *',
    walkInServicePlaceholder: 'اختر خدمة...',
    walkInCancel: 'إلغاء',
    walkInSubmit: 'إضافة',
    walkInSubmitting: 'جارٍ الإضافة...',
  },
};

interface AdminPortalProps {
  lang?: Language;
}

export default function AdminPortal({ lang = 'de' }: AdminPortalProps) {
  const labels = adminLabels[lang];

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
    { key: 'today', label: labels.tabToday },
    { key: 'all', label: labels.tabAll },
    { key: 'customers', label: labels.tabCustomers },
    { key: 'stats', label: labels.tabStats },
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
          <h1 className="text-3xl font-display font-bold text-[var(--text)]">Admin-Portal</h1>
          <p className="text-[var(--text-muted)] mt-1">
            {new Date().toLocaleDateString(getLocale(lang), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
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
        <div className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm">{labels.statAppointmentsToday}</p>
          <p className="text-2xl font-display font-bold text-[var(--text)] mt-1">
            {appointmentsLoading ? '...' : todayAppointments.length}
          </p>
        </div>
        <div className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm">{labels.statRevenueToday}</p>
          <p className="text-2xl font-display font-bold text-gold-400 mt-1">
            {appointmentsLoading ? '...' : `${todayRevenue}€`}
          </p>
        </div>
        <div className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm">{labels.statPaidWithPoints}</p>
          <p className="text-2xl font-display font-bold text-[var(--text)] mt-1">
            {appointmentsLoading ? '...' : pointsPaid}
          </p>
        </div>
        <div className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm">{labels.statPaymentPending}</p>
          <p className="text-2xl font-display font-bold text-[var(--text)] mt-1">
            {appointmentsLoading
              ? '...'
              : todayAppointments.filter((a) => a.status === 'confirmed' && !a.paidWithPoints).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--glass)] rounded-xl p-1 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-gold-500 text-surface-950'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--glass)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date filter for "all" tab */}
      {activeTab === 'all' && (
        <div className="mb-6">
          <label className="text-[var(--text-muted)] text-sm block mb-2">{labels.filterByDate}</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] text-sm focus:outline-none focus:border-gold-500 [color-scheme:dark]"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="ml-3 text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors"
            >
              {labels.resetFilter}
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
              <span className="ml-3 text-[var(--text-muted)] text-sm">{labels.loadingAppointments}</span>
            </div>
          )}

          {appointmentsError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              {appointmentsError}
            </div>
          )}

          {!appointmentsLoading && !appointmentsError && displayAppointments.length === 0 && (
            <div className="text-center py-12 text-[var(--text-muted)]">
              {activeTab === 'today' ? labels.emptyToday : labels.emptyAll}
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
                        ? 'bg-[var(--glass)] border-[var(--border)]'
                        : 'bg-[var(--glass)] border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-[var(--glass)] rounded-lg px-3 py-2 min-w-[60px]">
                      <span className="text-[var(--text)] font-bold text-lg">{apt.startTime}</span>
                    </div>
                    <div>
                      <h3 className="text-[var(--text)] font-medium">
                        {apt.customerName}
                        {apt.isWalkIn && (
                          <span className="ml-2 text-xs text-[var(--text-muted)] bg-[var(--glass)] px-2 py-0.5 rounded-full">Walk-in</span>
                        )}
                      </h3>
                      <p className="text-[var(--text-muted)] text-sm">{apt.serviceName}</p>
                      {activeTab === 'all' && apt.date !== todayStr && (
                        <p className="text-[var(--text-muted)] text-xs mt-0.5">
                          {new Date(apt.date).toLocaleDateString(getLocale(lang), { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {apt.status === 'completed' && (
                      <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                        {labels.statusCompleted}
                      </span>
                    )}
                    {apt.status === 'cancelled' && (
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                        {labels.statusCancelled}
                      </span>
                    )}
                    {apt.paidWithPoints ? (
                      <span className="px-3 py-1 rounded-full bg-gold-500/20 text-gold-400 text-xs font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {labels.badgePaidWithPoints}
                      </span>
                    ) : apt.status === 'confirmed' ? (
                      <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                        {labels.badgePaymentInSalon}
                      </span>
                    ) : null}
                    <span className="text-[var(--text)] font-display font-bold text-lg">{apt.servicePrice}€</span>
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => handleComplete(apt.id)}
                        disabled={completingId === apt.id}
                        className="text-green-400 hover:text-green-300 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {completingId === apt.id ? labels.completingBtn : labels.completeBtn}
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
        <div className="text-center py-12 text-[var(--text-muted)]">
          {labels.customersPlaceholder}
        </div>
      )}

      {activeTab === 'stats' && <AdminStats lang={lang} />}

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-elevated)] rounded-2xl p-6 max-w-md w-full border border-[var(--border)]"
          >
            <h3 className="text-[var(--text)] font-semibold text-lg mb-4">{labels.walkInTitle}</h3>
            <form onSubmit={handleWalkIn}>
              <div className="space-y-3">
                <div>
                  <label className="text-[var(--text-muted)] text-sm">{labels.walkInCustomerName}</label>
                  <input
                    type="text"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    required
                    className="w-full mt-1 bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] text-sm focus:outline-none focus:border-gold-500"
                    placeholder={labels.walkInCustomerNamePlaceholder}
                  />
                </div>
                <div>
                  <label className="text-[var(--text-muted)] text-sm">{labels.walkInEmail}</label>
                  <input
                    type="email"
                    value={walkInEmail}
                    onChange={(e) => setWalkInEmail(e.target.value)}
                    className="w-full mt-1 bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] text-sm focus:outline-none focus:border-gold-500"
                    placeholder={labels.walkInEmailPlaceholder}
                  />
                </div>
                <div>
                  <label className="text-[var(--text-muted)] text-sm">{labels.walkInPhone}</label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full mt-1 bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] text-sm focus:outline-none focus:border-gold-500"
                    placeholder={labels.walkInPhonePlaceholder}
                  />
                </div>
                <div>
                  <label className="text-[var(--text-muted)] text-sm">{labels.walkInService}</label>
                  <select
                    value={walkInServiceId}
                    onChange={(e) => setWalkInServiceId(e.target.value)}
                    required
                    className="w-full mt-1 bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] text-sm focus:outline-none focus:border-gold-500 [&>option]:bg-[var(--bg-elevated)]"
                  >
                    <option value="">{labels.walkInServicePlaceholder}</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name[lang]} — {s.price}€
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
                  className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors disabled:opacity-50"
                >
                  {labels.walkInCancel}
                </button>
                <button
                  type="submit"
                  disabled={walkInLoading}
                  className="flex-1 py-2.5 rounded-lg bg-gold-500 text-surface-950 font-semibold text-sm hover:bg-gold-400 transition-colors disabled:opacity-50"
                >
                  {walkInLoading ? labels.walkInSubmitting : labels.walkInSubmit}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
