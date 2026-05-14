import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, getUser, type User } from '../../lib/api';
import { t, type Language } from '../../i18n/translations';

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

interface Props {
  lang?: Language;
}

const statusLabelsMap: Record<Language, Record<string, { text: string; class: string }>> = {
  de: {
    confirmed: { text: 'Bestätigt', class: 'bg-green-500/10 text-green-400' },
    completed: { text: 'Abgeschlossen', class: 'bg-[var(--glass)] text-[var(--text-muted)]' },
    cancelled: { text: 'Storniert', class: 'bg-red-500/10 text-red-400' },
    no_show: { text: 'Nicht erschienen', class: 'bg-orange-500/10 text-orange-400' },
  },
  en: {
    confirmed: { text: 'Confirmed', class: 'bg-green-500/10 text-green-400' },
    completed: { text: 'Completed', class: 'bg-[var(--glass)] text-[var(--text-muted)]' },
    cancelled: { text: 'Cancelled', class: 'bg-red-500/10 text-red-400' },
    no_show: { text: 'No Show', class: 'bg-orange-500/10 text-orange-400' },
  },
  tr: {
    confirmed: { text: 'Onaylandı', class: 'bg-green-500/10 text-green-400' },
    completed: { text: 'Tamamlandı', class: 'bg-[var(--glass)] text-[var(--text-muted)]' },
    cancelled: { text: 'İptal edildi', class: 'bg-red-500/10 text-red-400' },
    no_show: { text: 'Gelmedi', class: 'bg-orange-500/10 text-orange-400' },
  },
  ar: {
    confirmed: { text: 'مؤكد', class: 'bg-green-500/10 text-green-400' },
    completed: { text: 'مكتمل', class: 'bg-[var(--glass)] text-[var(--text-muted)]' },
    cancelled: { text: 'ملغى', class: 'bg-red-500/10 text-red-400' },
    no_show: { text: 'لم يحضر', class: 'bg-orange-500/10 text-orange-400' },
  },
};

const extraLabels: Record<Language, {
  welcomeBack: string;
  newAppointment: string;
  totalVisits: string;
  noAppointments: string;
  bookNow: string;
  redeemLoading: string;
  redeemPoints: string;
  cancelLoading: string;
  settingsLabel: string;
  profile: string;
  twoFactor: string;
  twoFactorEnabled: string;
  twoFactorDisabled: string;
  setup2FA: string;
  transactionsLabel: string;
  transactionFallback: string;
  noTransactions: string;
  yourPoints: string;
  pointsUnit: string;
  reviewWriting: string;
  ratingLabel: string;
  commentLabel: string;
  commentPlaceholder: string;
  reviewSubmitLoading: string;
  reviewSubmit: string;
  reviewSuccess: string;
  selectCompleted: string;
  noCompleted: string;
  bookingsLoading: string;
  pointsLoading: string;
  // Cancellation countdown
  cancelableFor: string;
  cancelableHours: string;
  noLongerCancelable: string;
  // 2FA setup dialog
  setup2FATitle: string;
  setup2FAStep1: string;
  setup2FAVerify: string;
  setup2FACode: string;
  setup2FAConfirm: string;
  setup2FASuccess: string;
  setup2FACancel: string;
  setup2FALoading: string;
}> = {
  de: {
    welcomeBack: 'Willkommen zurück,',
    newAppointment: 'Neuer Termin',
    totalVisits: 'Besuche gesamt',
    noAppointments: 'Noch keine Termine vorhanden.',
    bookNow: 'Jetzt Termin buchen',
    redeemLoading: 'Wird eingelöst...',
    redeemPoints: 'Punkte einlösen',
    cancelLoading: 'Wird storniert...',
    settingsLabel: 'Einstellungen',
    profile: 'Profil',
    twoFactor: 'Zwei-Faktor-Authentifizierung',
    twoFactorEnabled: 'Zwei-Faktor-Authentifizierung ist aktiviert.',
    twoFactorDisabled: 'Schützen Sie Ihr Konto mit einem zusätzlichen Sicherheitscode.',
    setup2FA: '2FA einrichten',
    transactionsLabel: 'Transaktionen',
    transactionFallback: 'Transaktion',
    noTransactions: 'Noch keine Transaktionen.',
    yourPoints: 'Ihr Punktestand',
    pointsUnit: 'Punkte',
    reviewWriting: 'Bewertung schreiben',
    ratingLabel: 'Bewertung',
    commentLabel: 'Kommentar (optional)',
    commentPlaceholder: 'Wie war Ihr Erlebnis?',
    reviewSubmitLoading: 'Wird gesendet...',
    reviewSubmit: 'Bewertung abgeben',
    reviewSuccess: 'Bewertung erfolgreich abgegeben!',
    selectCompleted: 'Wählen Sie einen abgeschlossenen Termin, um eine Bewertung zu schreiben.',
    noCompleted: 'Noch keine abgeschlossenen Termine zum Bewerten.',
    bookingsLoading: 'Termine werden geladen...',
    pointsLoading: 'Punkte werden geladen...',
    cancelableFor: 'Stornierbar für',
    cancelableHours: 'Std.',
    noLongerCancelable: 'Nicht mehr stornierbar',
    setup2FATitle: '2FA einrichten',
    setup2FAStep1: 'Scannen Sie den QR-Code mit Ihrer Authenticator-App',
    setup2FAVerify: 'Code eingeben und bestätigen',
    setup2FACode: '6-stelliger Code',
    setup2FAConfirm: 'Bestätigen',
    setup2FASuccess: '2FA erfolgreich aktiviert!',
    setup2FACancel: 'Abbrechen',
    setup2FALoading: 'Wird generiert...',
  },
  en: {
    welcomeBack: 'Welcome back,',
    newAppointment: 'New Appointment',
    totalVisits: 'Total visits',
    noAppointments: 'No appointments yet.',
    bookNow: 'Book Appointment',
    redeemLoading: 'Redeeming...',
    redeemPoints: 'Redeem Points',
    cancelLoading: 'Cancelling...',
    settingsLabel: 'Settings',
    profile: 'Profile',
    twoFactor: 'Two-Factor Authentication',
    twoFactorEnabled: 'Two-factor authentication is enabled.',
    twoFactorDisabled: 'Protect your account with an additional security code.',
    setup2FA: 'Set Up 2FA',
    transactionsLabel: 'Transactions',
    transactionFallback: 'Transaction',
    noTransactions: 'No transactions yet.',
    yourPoints: 'Your Points Balance',
    pointsUnit: 'Points',
    reviewWriting: 'Write Review',
    ratingLabel: 'Rating',
    commentLabel: 'Comment (optional)',
    commentPlaceholder: 'How was your experience?',
    reviewSubmitLoading: 'Sending...',
    reviewSubmit: 'Submit Review',
    reviewSuccess: 'Review submitted successfully!',
    selectCompleted: 'Select a completed appointment to write a review.',
    noCompleted: 'No completed appointments to review yet.',
    bookingsLoading: 'Loading appointments...',
    pointsLoading: 'Loading points...',
    cancelableFor: 'Free cancel for',
    cancelableHours: 'h',
    noLongerCancelable: 'No longer cancellable',
    setup2FATitle: 'Set Up 2FA',
    setup2FAStep1: 'Scan the QR code with your authenticator app',
    setup2FAVerify: 'Enter code to confirm',
    setup2FACode: '6-digit code',
    setup2FAConfirm: 'Confirm',
    setup2FASuccess: '2FA successfully activated!',
    setup2FACancel: 'Cancel',
    setup2FALoading: 'Generating...',
  },
  tr: {
    welcomeBack: 'Tekrar hoş geldiniz,',
    newAppointment: 'Yeni Randevu',
    totalVisits: 'Toplam ziyaret',
    noAppointments: 'Henüz randevu yok.',
    bookNow: 'Randevu Al',
    redeemLoading: 'Kullanılıyor...',
    redeemPoints: 'Puan Kullan',
    cancelLoading: 'İptal ediliyor...',
    settingsLabel: 'Ayarlar',
    profile: 'Profil',
    twoFactor: 'İki Faktörlü Doğrulama',
    twoFactorEnabled: 'İki faktörlü doğrulama etkin.',
    twoFactorDisabled: 'Hesabınızı ek bir güvenlik koduyla koruyun.',
    setup2FA: '2FA Kur',
    transactionsLabel: 'İşlemler',
    transactionFallback: 'İşlem',
    noTransactions: 'Henüz işlem yok.',
    yourPoints: 'Puan Bakiyeniz',
    pointsUnit: 'Puan',
    reviewWriting: 'Değerlendirme Yaz',
    ratingLabel: 'Değerlendirme',
    commentLabel: 'Yorum (isteğe bağlı)',
    commentPlaceholder: 'Deneyiminiz nasıldı?',
    reviewSubmitLoading: 'Gönderiliyor...',
    reviewSubmit: 'Değerlendirme Gönder',
    reviewSuccess: 'Değerlendirme başarıyla gönderildi!',
    selectCompleted: 'Değerlendirme yazmak için tamamlanmış bir randevu seçin.',
    noCompleted: 'Henüz değerlendirilecek tamamlanmış randevu yok.',
    bookingsLoading: 'Randevular yükleniyor...',
    pointsLoading: 'Puanlar yükleniyor...',
    cancelableFor: 'İptal için',
    cancelableHours: 'sa.',
    noLongerCancelable: 'Artık iptal edilemiyor',
    setup2FATitle: '2FA Kur',
    setup2FAStep1: 'QR kodunu authenticator uygulamanızla tarayın',
    setup2FAVerify: 'Onaylamak için kodu girin',
    setup2FACode: '6 haneli kod',
    setup2FAConfirm: 'Onayla',
    setup2FASuccess: '2FA başarıyla etkinleştirildi!',
    setup2FACancel: 'İptal',
    setup2FALoading: 'Oluşturuluyor...',
  },
  ar: {
    welcomeBack: 'مرحباً بعودتك،',
    newAppointment: 'موعد جديد',
    totalVisits: 'إجمالي الزيارات',
    noAppointments: 'لا توجد مواعيد بعد.',
    bookNow: 'احجز موعداً',
    redeemLoading: 'جارٍ الاسترداد...',
    redeemPoints: 'استرداد النقاط',
    cancelLoading: 'جارٍ الإلغاء...',
    settingsLabel: 'الإعدادات',
    profile: 'الملف الشخصي',
    twoFactor: 'المصادقة الثنائية',
    twoFactorEnabled: 'المصادقة الثنائية مفعّلة.',
    twoFactorDisabled: 'احمِ حسابك برمز أمان إضافي.',
    setup2FA: 'إعداد 2FA',
    transactionsLabel: 'المعاملات',
    transactionFallback: 'معاملة',
    noTransactions: 'لا توجد معاملات بعد.',
    yourPoints: 'رصيد نقاطك',
    pointsUnit: 'نقاط',
    reviewWriting: 'اكتب تقييم',
    ratingLabel: 'التقييم',
    commentLabel: 'تعليق (اختياري)',
    commentPlaceholder: 'كيف كانت تجربتك؟',
    reviewSubmitLoading: 'جارٍ الإرسال...',
    reviewSubmit: 'إرسال التقييم',
    reviewSuccess: 'تم إرسال التقييم بنجاح!',
    selectCompleted: 'اختر موعداً مكتملاً لكتابة تقييم.',
    noCompleted: 'لا توجد مواعيد مكتملة للتقييم بعد.',
    bookingsLoading: 'جارٍ تحميل المواعيد...',
    pointsLoading: 'جارٍ تحميل النقاط...',
    cancelableFor: 'قابل للإلغاء لمدة',
    cancelableHours: 'س.',
    noLongerCancelable: 'لم يعد قابلاً للإلغاء',
    setup2FATitle: 'إعداد 2FA',
    setup2FAStep1: 'امسح رمز QR بتطبيق المصادقة',
    setup2FAVerify: 'أدخل الرمز للتأكيد',
    setup2FACode: 'رمز 6 أرقام',
    setup2FAConfirm: 'تأكيد',
    setup2FASuccess: 'تم تفعيل 2FA بنجاح!',
    setup2FACancel: 'إلغاء',
    setup2FALoading: 'جارٍ الإنشاء...',
  },
};

function getLocale(lang: Language): string {
  if (lang === 'de') return 'de-DE';
  if (lang === 'en') return 'en-US';
  if (lang === 'tr') return 'tr-TR';
  return 'ar-SA';
}

export default function CustomerDashboard({ lang = 'de' }: Props) {
  const tr = t(lang);
  const xl = extraLabels[lang];
  const statusLabels = statusLabelsMap[lang];

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

  // 2FA dialog state
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'loading' | 'scan' | 'verify' | 'success'>('idle');
  const [twoFAQrUrl, setTwoFAQrUrl] = useState('');
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAToken, setTwoFAToken] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFAVerifyLoading, setTwoFAVerifyLoading] = useState(false);

  // Auth-Check
  useEffect(() => {
    getUser().then((u) => {
      if (!u) {
        window.location.href = lang === 'de' ? '/login' : `/${lang}/login`;
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
      setBookingsError(err instanceof Error ? err.message : tr.common.error);
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
      setPointsError(err instanceof Error ? err.message : tr.common.error);
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
      alert(err instanceof Error ? err.message : tr.common.error);
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
      alert(err instanceof Error ? err.message : tr.common.error);
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
      setReviewSuccess(xl.reviewSuccess);
      setReviewBookingId(null);
      setReviewRating(5);
      setReviewText('');
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : tr.common.error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handle2FASetup = async () => {
    setTwoFAStep('loading');
    setTwoFAError('');
    try {
      const data = await api<{ qrUrl: string; secret: string }>('/api/auth/2fa/setup', { method: 'POST' });
      setTwoFAQrUrl(data.qrUrl);
      setTwoFASecret(data.secret);
      setTwoFAStep('scan');
    } catch (err) {
      setTwoFAError(err instanceof Error ? err.message : tr.common.error);
      setTwoFAStep('idle');
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFAToken || twoFAToken.length !== 6) return;
    setTwoFAVerifyLoading(true);
    setTwoFAError('');
    try {
      await api<{ success: boolean }>('/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ token: twoFAToken }),
      });
      setTwoFAStep('success');
    } catch (err) {
      setTwoFAError(err instanceof Error ? err.message : tr.common.error);
    } finally {
      setTwoFAVerifyLoading(false);
    }
  };

  const close2FADialog = () => {
    setShow2FADialog(false);
    setTwoFAStep('idle');
    setTwoFAQrUrl('');
    setTwoFASecret('');
    setTwoFAToken('');
    setTwoFAError('');
    setTwoFAVerifyLoading(false);
  };

  const upcomingCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    {
      key: 'appointments',
      label: tr.dashboard.appointments,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    {
      key: 'points',
      label: tr.dashboard.points,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    },
    {
      key: 'reviews',
      label: tr.dashboard.reviews,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    },
    {
      key: 'settings',
      label: xl.settingsLabel,
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
          <h1 className="text-3xl font-display font-bold text-[var(--text)]">{tr.dashboard.title}</h1>
          <p className="text-[var(--text-muted)] mt-1">{xl.welcomeBack} {user?.name?.split(' ')[0] ?? ''}!</p>
        </div>
        <a
          href={lang === 'de' ? '/booking' : `/${lang}/booking`}
          className="bg-gold-500 text-surface-950 font-semibold px-6 py-2.5 rounded-full hover:bg-gold-400 transition-colors text-sm"
        >
          {xl.newAppointment}
        </a>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm">{tr.dashboard.upcoming}</p>
          <p className="text-2xl font-display font-bold text-[var(--text)] mt-1">
            {bookingsLoading ? '...' : upcomingCount}
          </p>
        </div>
        <div className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm">{tr.dashboard.pointsBalance}</p>
          <p className="text-2xl font-display font-bold text-gold-400 mt-1">
            {pointsData ? pointsData.balance : user?.pointsBalance ?? 0}
          </p>
          <p className="text-[var(--text-muted)] text-xs">
            {tr.dashboard.pointsValue}: {pointsData ? pointsData.valueEur : ((user?.pointsBalance ?? 0) / 100).toFixed(2)}€
          </p>
        </div>
        <div className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm">{xl.totalVisits}</p>
          <p className="text-2xl font-display font-bold text-[var(--text)] mt-1">
            {bookingsLoading ? '...' : completedCount}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--glass)] rounded-xl p-1 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-gold-500 text-surface-950'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--glass)]'
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
                <span className="ml-3 text-[var(--text-muted)] text-sm">{xl.bookingsLoading}</span>
              </div>
            )}

            {bookingsError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {bookingsError}
              </div>
            )}

            {!bookingsLoading && !bookingsError && bookings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[var(--text-muted)]">{xl.noAppointments}</p>
                <a
                  href={lang === 'de' ? '/booking' : `/${lang}/booking`}
                  className="text-gold-400 hover:text-gold-300 text-sm mt-2 inline-block"
                >
                  {xl.bookNow}
                </a>
              </div>
            )}

            {!bookingsLoading && !bookingsError && bookings.length > 0 && (
              <div className="space-y-3">
                {bookings.map((apt) => (
                  <div key={apt.id} className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-[var(--text)] font-medium">{apt.serviceName}</h3>
                      <p className="text-[var(--text-muted)] text-sm mt-0.5">
                        {new Date(apt.date).toLocaleDateString(getLocale(lang), { weekday: 'short', day: 'numeric', month: 'long' })} {apt.startTime} Uhr
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[apt.status]?.class ?? 'bg-[var(--glass)] text-[var(--text-muted)]'}`}>
                        {statusLabels[apt.status]?.text ?? apt.status}
                      </span>
                      {apt.paidWithPoints && (
                        <span className="px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 text-xs font-medium">
                          {tr.admin.paidWithPoints}
                        </span>
                      )}
                      <span className="text-gold-400 font-display font-bold">{apt.servicePrice}€</span>
                      {apt.status === 'confirmed' && !apt.paidWithPoints && (
                        <button
                          onClick={() => handleRedeem(apt.id)}
                          disabled={redeemingId === apt.id}
                          className="text-gold-400 hover:text-gold-300 text-sm transition-colors disabled:opacity-50"
                        >
                          {redeemingId === apt.id ? xl.redeemLoading : xl.redeemPoints}
                        </button>
                      )}
                      {apt.status === 'confirmed' && (() => {
                        const apptMs = new Date(`${apt.date}T${apt.startTime}`).getTime();
                        const hoursRemaining = (apptMs - Date.now()) / 1000 / 3600 - 24;
                        const canCancel = hoursRemaining > 0;
                        const showCountdown = hoursRemaining > 0 && hoursRemaining < 48;
                        const isUrgent = hoursRemaining < 1;
                        return (
                          <div className="flex items-center gap-2 flex-wrap">
                            {showCountdown && (
                              <span className={`text-xs ${isUrgent ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                                {xl.cancelableFor} {Math.floor(hoursRemaining)}{xl.cancelableHours}
                              </span>
                            )}
                            {canCancel ? (
                              <button
                                onClick={() => handleCancel(apt.id)}
                                disabled={cancellingId === apt.id}
                                className="text-[var(--text-muted)] hover:text-red-400 text-sm transition-colors disabled:opacity-50"
                              >
                                {cancellingId === apt.id ? xl.cancelLoading : tr.booking.cancel}
                              </button>
                            ) : (
                              <span className="text-[var(--text-muted)] text-sm cursor-not-allowed">
                                {xl.noLongerCancelable}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      {apt.status === 'completed' && (
                        <button
                          onClick={() => setReviewBookingId(apt.id)}
                          className="text-gold-400 hover:text-gold-300 text-sm transition-colors"
                        >
                          {tr.dashboard.writeReview}
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
                <span className="ml-3 text-[var(--text-muted)] text-sm">{xl.pointsLoading}</span>
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
                  <p className="text-gold-400/60 text-sm uppercase tracking-wider">{xl.yourPoints}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-display font-bold text-gold-400">{pointsData.balance}</span>
                    <span className="text-gold-400/60">{xl.pointsUnit}</span>
                  </div>
                  <p className="text-gold-400/60 text-sm mt-1">{tr.dashboard.pointsValue}: {pointsData.valueEur}€</p>
                  <p className="text-[var(--text-muted)] text-xs mt-4">
                    {tr.dashboard.pointsExpiry}
                  </p>
                </div>

                {pointsData.transactions.length > 0 && (
                  <>
                    <h3 className="text-[var(--text)] font-semibold mb-3">{xl.transactionsLabel}</h3>
                    <div className="space-y-2">
                      {pointsData.transactions.map((tx) => (
                        <div key={tx.id} className="bg-[var(--glass)] rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[var(--text)] text-sm">{tx.description ?? xl.transactionFallback}</p>
                            <p className="text-[var(--text-muted)] text-xs">
                              {new Date(tx.createdAt).toLocaleDateString(getLocale(lang))}
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
                  <p className="text-[var(--text-muted)] text-sm text-center py-4">{xl.noTransactions}</p>
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
              <div className="bg-[var(--glass)] rounded-2xl p-6 border border-[var(--border)] mb-6">
                <h3 className="text-[var(--text)] font-semibold mb-4">{xl.reviewWriting}</h3>
                <form onSubmit={handleReview}>
                  <div className="mb-4">
                    <label className="text-[var(--text-muted)] text-sm block mb-2">{xl.ratingLabel}</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1"
                        >
                          <svg
                            className={`w-8 h-8 ${star <= reviewRating ? 'text-gold-400' : 'text-[var(--text-muted)]'}`}
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
                    <label className="text-[var(--text-muted)] text-sm block mb-2">{xl.commentLabel}</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] text-sm focus:outline-none focus:border-gold-500 resize-none"
                      placeholder={xl.commentPlaceholder}
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
                      className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors"
                    >
                      {tr.common.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="flex-1 py-2.5 rounded-lg bg-gold-500 text-surface-950 font-semibold text-sm hover:bg-gold-400 transition-colors disabled:opacity-50"
                    >
                      {reviewLoading ? xl.reviewSubmitLoading : xl.reviewSubmit}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                {/* Abgeschlossene Termine zur Bewertung */}
                {bookings.filter((b) => b.status === 'completed').length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[var(--text-muted)] text-sm mb-3">
                      {xl.selectCompleted}
                    </p>
                    {bookings.filter((b) => b.status === 'completed').map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => setReviewBookingId(apt.id)}
                        className="w-full text-left bg-[var(--glass)] rounded-xl p-4 border border-[var(--border)] hover:border-gold-500/30 transition-colors"
                      >
                        <h4 className="text-[var(--text)] font-medium">{apt.serviceName}</h4>
                        <p className="text-[var(--text-muted)] text-sm">
                          {new Date(apt.date).toLocaleDateString(getLocale(lang), { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-[var(--text-muted)]">{xl.noCompleted}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Einstellungen Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-[var(--glass)] rounded-xl p-6 border border-[var(--border)]">
              <h3 className="text-[var(--text)] font-semibold mb-4">{xl.profile}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[var(--text-muted)] text-sm">Name</label>
                  <input type="text" defaultValue={user?.name ?? ''} className="w-full mt-1 bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] text-sm focus:outline-none focus:border-gold-500" />
                </div>
                <div>
                  <label className="text-[var(--text-muted)] text-sm">E-Mail</label>
                  <input type="email" defaultValue={user?.email ?? ''} disabled className="w-full mt-1 bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-muted)] text-sm cursor-not-allowed" />
                </div>
              </div>
            </div>
            <div className="bg-[var(--glass)] rounded-xl p-6 border border-[var(--border)]">
              <h3 className="text-[var(--text)] font-semibold mb-2">{xl.twoFactor}</h3>
              <p className="text-[var(--text-muted)] text-sm mb-4">
                {user?.totpEnabled ? xl.twoFactorEnabled : xl.twoFactorDisabled}
              </p>
              {!user?.totpEnabled && (
                <button
                  onClick={() => { setShow2FADialog(true); setTwoFAStep('idle'); }}
                  className="px-4 py-2 rounded-lg bg-gold-500/10 text-gold-400 text-sm font-medium hover:bg-gold-500/20 transition-colors"
                >
                  {xl.setup2FA}
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* 2FA Setup Dialog */}
      {show2FADialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color-mix(in_oklab,var(--bg)_70%,transparent)] backdrop-blur-sm">
          <div className="bg-[var(--bg-elevated-2)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[var(--text)] font-semibold text-lg">{xl.setup2FATitle}</h2>
              <button
                onClick={close2FADialog}
                className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                aria-label={xl.setup2FACancel}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {twoFAError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
                {twoFAError}
              </div>
            )}

            {twoFAStep === 'success' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-400 font-medium">{xl.setup2FASuccess}</p>
                <button
                  onClick={close2FADialog}
                  className="mt-6 px-6 py-2.5 rounded-full bg-gold-500 text-surface-950 font-semibold text-sm hover:bg-gold-400 transition-colors"
                >
                  {tr.common.close ?? 'OK'}
                </button>
              </div>
            )}

            {(twoFAStep === 'idle' || twoFAStep === 'loading') && (
              <div>
                <p className="text-[var(--text-muted)] text-sm mb-6">{xl.setup2FAStep1}</p>
                <button
                  onClick={handle2FASetup}
                  disabled={twoFAStep === 'loading'}
                  className="w-full py-3 rounded-full bg-gold-500 text-surface-950 font-semibold hover:bg-gold-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {twoFAStep === 'loading' && (
                    <div className="w-4 h-4 border-2 border-surface-950 border-t-transparent rounded-full animate-spin" />
                  )}
                  {twoFAStep === 'loading' ? xl.setup2FALoading : xl.setup2FATitle}
                </button>
                <button
                  onClick={close2FADialog}
                  className="w-full mt-3 py-3 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors"
                >
                  {xl.setup2FACancel}
                </button>
              </div>
            )}

            {twoFAStep === 'scan' && (
              <div>
                <p className="text-[var(--text-muted)] text-sm mb-4">{xl.setup2FAStep1}</p>
                <div className="flex justify-center mb-4">
                  <img src={twoFAQrUrl} alt="QR Code" className="w-48 h-48 rounded-lg bg-white p-2" />
                </div>
                {twoFASecret && (
                  <div className="bg-[var(--glass)] rounded-lg px-4 py-2 mb-6 text-center">
                    <p className="text-[var(--text-muted)] text-xs mb-1">Secret</p>
                    <code className="text-gold-400 text-sm font-mono tracking-widest break-all">{twoFASecret}</code>
                  </div>
                )}
                <button
                  onClick={() => setTwoFAStep('verify')}
                  className="w-full py-3 rounded-full bg-gold-500 text-surface-950 font-semibold hover:bg-gold-400 transition-colors"
                >
                  {xl.setup2FAVerify}
                </button>
                <button
                  onClick={close2FADialog}
                  className="w-full mt-3 py-3 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors"
                >
                  {xl.setup2FACancel}
                </button>
              </div>
            )}

            {twoFAStep === 'verify' && (
              <form onSubmit={handle2FAVerify}>
                <p className="text-[var(--text-muted)] text-sm mb-4">{xl.setup2FAVerify}</p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={twoFAToken}
                  onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={xl.setup2FACode}
                  className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-gold-500 transition-colors mb-6"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={twoFAVerifyLoading || twoFAToken.length !== 6}
                  className="w-full py-3 rounded-full bg-gold-500 text-surface-950 font-semibold hover:bg-gold-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {twoFAVerifyLoading && (
                    <div className="w-4 h-4 border-2 border-surface-950 border-t-transparent rounded-full animate-spin" />
                  )}
                  {xl.setup2FAConfirm}
                </button>
                <button
                  type="button"
                  onClick={() => setTwoFAStep('scan')}
                  className="w-full mt-3 py-3 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors"
                >
                  {tr.common.back}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
