import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { services, type Service, type ServiceCategory } from '../../data/services';
import { api, getUser } from '../../lib/api';
import { t, type Language } from '../../i18n/translations';

type Step = 'service' | 'datetime' | 'confirm' | 'success';

interface SlotData {
  time: string;
  available: boolean;
}

interface AvailableSlotsResponse {
  slots: SlotData[];
  service: { name: string; price: number; duration: number };
}

interface CreateBookingResponse {
  success: boolean;
  booking: { id: string; serviceId: string; date: string; startTime: string; endTime: string; price: number };
}

interface Props {
  lang?: Language;
}

const summaryLabels: Record<Language, { summary: string; date: string; time: string; duration: string; price: string; booked: string; payment: string; email: string; noSlots: string; slotsLoading: string; change: string; calExport: string; shareWhatsApp: string; waitlist: string; waitlistAdded: string; guestRequired: string; guestOrLogin: string; guestContinue: string; loginRegister: string; guestInfoTitle: string; guestNameLabel: string; guestEmailLabel: string; guestPhoneLabel: string; guestPhonePlaceholder: string; guestCancelNote: string; guestSuccessNote: string }> = {
  de: {
    summary: 'Zusammenfassung',
    date: 'Datum',
    time: 'Uhrzeit',
    duration: 'Dauer',
    price: 'Preis',
    booked: 'Termin gebucht!',
    payment: 'Bezahlung erfolgt im Salon.',
    email: 'Sie erhalten eine Bestätigung per E-Mail.',
    noSlots: 'Keine Zeitslots verfügbar an diesem Tag (ggf. Sonntag oder Feiertag).',
    slotsLoading: 'Zeitslots werden geladen...',
    change: 'Ändern',
    calExport: 'Zum Kalender hinzufügen',
    shareWhatsApp: 'WhatsApp teilen',
    waitlist: 'Warteliste',
    waitlistAdded: 'Eingetragen',
    guestRequired: 'Name und E-Mail sind erforderlich.',
    guestOrLogin: 'Konto erstellen oder als Gast buchen',
    guestContinue: 'Als Gast fortfahren',
    loginRegister: 'Anmelden / Registrieren',
    guestInfoTitle: 'Ihre Kontaktdaten',
    guestNameLabel: 'Name *',
    guestEmailLabel: 'E-Mail *',
    guestPhoneLabel: 'Telefon (optional)',
    guestPhonePlaceholder: '+49 170 123456',
    guestCancelNote: 'Termin ändern oder stornieren? Schreiben Sie uns: info@barbier.berlin',
    guestSuccessNote: 'Bestätigung wurde an Ihre E-Mail gesendet. Stornierungslink ist in der E-Mail enthalten.',
  },
  en: {
    summary: 'Summary',
    date: 'Date',
    time: 'Time',
    duration: 'Duration',
    price: 'Price',
    booked: 'Appointment booked!',
    payment: 'Payment in salon.',
    email: 'You will receive a confirmation by email.',
    noSlots: 'No time slots available for this day.',
    slotsLoading: 'Loading time slots...',
    change: 'Change',
    calExport: 'Add to Calendar',
    shareWhatsApp: 'Share on WhatsApp',
    waitlist: 'Waitlist',
    waitlistAdded: 'Added',
    guestRequired: 'Name and email are required.',
    guestOrLogin: 'Create account or book as guest',
    guestContinue: 'Continue as Guest',
    loginRegister: 'Sign In / Register',
    guestInfoTitle: 'Your Contact Details',
    guestNameLabel: 'Name *',
    guestEmailLabel: 'Email *',
    guestPhoneLabel: 'Phone (optional)',
    guestPhonePlaceholder: '+49 170 123456',
    guestCancelNote: 'To change or cancel: email us at info@barbier.berlin',
    guestSuccessNote: 'Confirmation sent to your email. Cancellation link is included.',
  },
  tr: {
    summary: 'Özet',
    date: 'Tarih',
    time: 'Saat',
    duration: 'Süre',
    price: 'Fiyat',
    booked: 'Randevu alındı!',
    payment: 'Ödeme salonda yapılır.',
    email: 'E-posta ile onay alacaksınız.',
    noSlots: 'Bu gün için mevcut zaman dilimi yok.',
    slotsLoading: 'Zaman dilimleri yükleniyor...',
    change: 'Değiştir',
    calExport: 'Takvime Ekle',
    shareWhatsApp: "WhatsApp'ta Paylaş",
    waitlist: 'Bekleme',
    waitlistAdded: 'Eklendi',
    guestRequired: 'Ad ve e-posta zorunludur.',
    guestOrLogin: 'Hesap oluştur veya misafir olarak devam et',
    guestContinue: 'Misafir Olarak Devam Et',
    loginRegister: 'Giriş Yap / Kayıt Ol',
    guestInfoTitle: 'İletişim Bilgileriniz',
    guestNameLabel: 'Ad *',
    guestEmailLabel: 'E-posta *',
    guestPhoneLabel: 'Telefon (isteğe bağlı)',
    guestPhonePlaceholder: '+49 170 123456',
    guestCancelNote: 'Değiştirmek veya iptal için: info@barbier.berlin',
    guestSuccessNote: 'Onay e-postanıza gönderildi. İptal bağlantısı e-postada yer almaktadır.',
  },
  ar: {
    summary: 'ملخص',
    date: 'التاريخ',
    time: 'الوقت',
    duration: 'المدة',
    price: 'السعر',
    booked: 'تم الحجز!',
    payment: 'الدفع في الصالون.',
    email: 'ستصلك رسالة تأكيد بالبريد الإلكتروني.',
    noSlots: 'لا توجد مواعيد متاحة لهذا اليوم.',
    slotsLoading: 'جارٍ تحميل المواعيد...',
    change: 'تغيير',
    calExport: 'إضافة إلى التقويم',
    shareWhatsApp: 'مشاركة عبر واتساب',
    waitlist: 'قائمة الانتظار',
    waitlistAdded: 'تمت الإضافة',
    guestRequired: 'الاسم والبريد الإلكتروني مطلوبان.',
    guestOrLogin: 'إنشاء حساب أو الحجز كضيف',
    guestContinue: 'المتابعة كضيف',
    loginRegister: 'تسجيل الدخول / التسجيل',
    guestInfoTitle: 'بيانات الاتصال',
    guestNameLabel: 'الاسم *',
    guestEmailLabel: 'البريد الإلكتروني *',
    guestPhoneLabel: 'الهاتف (اختياري)',
    guestPhonePlaceholder: '+49 170 123456',
    guestCancelNote: 'للتغيير أو الإلغاء: راسلنا على info@barbier.berlin',
    guestSuccessNote: 'تم إرسال التأكيد إلى بريدك الإلكتروني. رابط الإلغاء مرفق في البريد.',
  },
};

const dashboardLabels: Record<Language, { toDashboard: string; toHome: string }> = {
  de: { toDashboard: 'Zum Dashboard', toHome: 'Zur Startseite' },
  en: { toDashboard: 'To Dashboard', toHome: 'To Home' },
  tr: { toDashboard: 'Panele Git', toHome: 'Ana Sayfaya Git' },
  ar: { toDashboard: 'إلى لوحة التحكم', toHome: 'إلى الرئيسية' },
};

function getLocale(lang: Language): string {
  if (lang === 'de') return 'de-DE';
  if (lang === 'en') return 'en-US';
  if (lang === 'tr') return 'tr-TR';
  return 'ar-SA';
}

function downloadICS(serviceName: string, date: string, time: string, durationMinutes: number): void {
  const [year, month, day] = date.split('-');
  const [hour, minute] = time.split(':');
  const dtStart = `${year}${month}${day}T${hour}${minute}00`;

  const startMs = new Date(date + 'T' + time + ':00').getTime();
  const endMs = startMs + durationMinutes * 60 * 1000;
  const endDate = new Date(endMs);
  const endYear = endDate.getFullYear().toString();
  const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const endDay = String(endDate.getDate()).padStart(2, '0');
  const endHour = String(endDate.getHours()).padStart(2, '0');
  const endMinute = String(endDate.getMinutes()).padStart(2, '0');
  const dtEnd = `${endYear}${endMonth}${endDay}T${endHour}${endMinute}00`;

  const uid = `${dtStart}-barbier-berlin@booking`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Barbier Berlin//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${serviceName} – Barbier Berlin`,
    'LOCATION:Barbier Berlin',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'barbier-berlin-termin.ics';
  a.click();
  URL.revokeObjectURL(url);
}

function buildWhatsAppUrl(lang: Language, serviceName: string, date: string, time: string, locale: string): string {
  const formattedDate = new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const textMap: Record<Language, string> = {
    de: `Ich habe einen Termin bei Barbier Berlin gebucht: ${serviceName} am ${formattedDate} um ${time} Uhr`,
    en: `I've booked an appointment at Barbier Berlin: ${serviceName} on ${formattedDate} at ${time}`,
    tr: `Barbier Berlin'de randevu aldım: ${serviceName}, ${formattedDate} saat ${time}`,
    ar: `حجزت موعداً في Barbier Berlin: ${serviceName} في ${formattedDate} الساعة ${time}`,
  };
  return `https://wa.me/?text=${encodeURIComponent(textMap[lang])}`;
}

export default function BookingFlow({ lang = 'de' }: Props) {
  const tr = t(lang);
  const labels = summaryLabels[lang];
  const dbLabels = dashboardLabels[lang];

  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('haircut');

  // Auth mode
  type AuthMode = 'loading' | 'user' | 'guest' | 'choice';
  const [authMode, setAuthMode] = useState<AuthMode>('loading');

  // Guest info
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // API states
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Waitlist states
  const [waitlistSlot, setWaitlistSlot] = useState<string | null>(null);
  const [waitlistSuccess, setWaitlistSuccess] = useState<string | null>(null);

  // Auth-Check beim Mount
  useEffect(() => {
    getUser().then((user) => {
      if (user) {
        setAuthMode('user');
      } else {
        setAuthMode('choice');
      }
    });
  }, []);

  // Slots laden wenn Datum oder Service sich aendern
  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError('');
    setSelectedTime('');

    api<AvailableSlotsResponse>(
      `/api/bookings/available-slots?date=${selectedDate}&serviceId=${selectedService.id}`
    )
      .then((data) => {
        if (!cancelled) {
          setSlots(data.slots);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSlotsError(err instanceof Error ? err.message : 'Fehler beim Laden der Zeitslots.');
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedDate, selectedService]);

  const steps: { key: Step; label: string; num: number }[] = [
    { key: 'service', label: tr.booking.selectService, num: 1 },
    { key: 'datetime', label: tr.booking.selectDate, num: 2 },
    { key: 'confirm', label: tr.booking.confirm, num: 3 },
  ];

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    // Guest validation
    if (authMode === 'guest') {
      if (!guestName.trim() || !guestEmail.trim()) {
        setBookingError(labels.guestRequired ?? 'Name und E-Mail sind erforderlich.');
        return;
      }
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      if (authMode === 'guest') {
        await api('/api/bookings/create-guest', {
          method: 'POST',
          body: JSON.stringify({
            serviceId: selectedService.id,
            date: selectedDate,
            startTime: selectedTime,
            name: guestName.trim(),
            email: guestEmail.trim(),
            phone: guestPhone.trim() || undefined,
            lang,
          }),
        });
      } else {
        await api<CreateBookingResponse>('/api/bookings/create', {
          method: 'POST',
          body: JSON.stringify({
            serviceId: selectedService.id,
            date: selectedDate,
            startTime: selectedTime,
          }),
        });
      }
      setStep('success');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Fehler bei der Buchung.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleWaitlist = async (time: string) => {
    if (!selectedService || !selectedDate) return;
    setWaitlistSlot(time);
    try {
      await api('/api/bookings/waitlist', {
        method: 'POST',
        body: JSON.stringify({ serviceId: selectedService.id, date: selectedDate, time }),
      });
      setWaitlistSuccess(time);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler');
    } finally {
      setWaitlistSlot(null);
    }
  };

  const filteredServices = services.filter((s) => s.category === activeCategory);

  if (authMode === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authMode === 'choice') {
    return (
      <div className="max-w-sm mx-auto text-center py-8">
        <div className="w-16 h-16 rounded-full bg-gold-500/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-semibold text-[var(--text)] mb-2">
          {labels.guestOrLogin}
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-8">
          {/* empty, keep it minimal */}
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={lang === 'de' ? '/login' : `/${lang}/login`}
            className="w-full py-3.5 rounded-full bg-gold-500 text-surface-950 font-semibold text-sm hover:bg-gold-400 transition-colors"
          >
            {labels.loginRegister}
          </a>
          <button
            onClick={() => setAuthMode('guest')}
            className="w-full py-3.5 rounded-full border border-[var(--border)] text-[var(--text-subtle)] text-sm font-medium hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
          >
            {labels.guestContinue}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Steps */}
      {step !== 'success' && (
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step === s.key
                    ? 'bg-gold-500 text-surface-950'
                    : steps.findIndex((st) => st.key === step) > i
                      ? 'bg-gold-500/20 text-gold-400'
                      : 'bg-[var(--glass)] text-[var(--text-muted)]'
                }`}
              >
                {steps.findIndex((st) => st.key === step) > i ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.num
                )}
              </div>
              <span className={`text-sm hidden sm:block ${step === s.key ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-12 h-px bg-[var(--glass-strong)] mx-2" />}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Service Selection */}
        {step === 'service' && (
          <motion.div
            key="service"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(tr.services.categories) as ServiceCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-gold-500 text-surface-950'
                      : 'bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--glass-strong)]'
                  }`}
                >
                  {tr.services.categories[cat]}
                </button>
              ))}
            </div>

            {/* Service List */}
            <div className="space-y-3">
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep('datetime');
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedService?.id === service.id
                      ? 'bg-gold-500/10 border-gold-500/30'
                      : 'bg-[var(--glass)] border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[var(--text)] font-medium">{service.name[lang]}</h3>
                      <p className="text-[var(--text-muted)] text-sm mt-0.5">{`ca. ${service.duration} ${tr.services.duration}`}</p>
                    </div>
                    <span className="text-gold-400 font-display font-bold text-xl">{service.price}€</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Date & Time */}
        {step === 'datetime' && (
          <motion.div
            key="datetime"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Selected Service Summary */}
            <div className="bg-[var(--glass)] rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-[var(--text)] font-medium">{selectedService?.name[lang]}</p>
                <p className="text-[var(--text-muted)] text-sm">{selectedService?.duration} {tr.services.duration} · {selectedService?.price}€</p>
              </div>
              <button onClick={() => setStep('service')} className="text-gold-400 text-sm hover:text-gold-300">
                {labels.change}
              </button>
            </div>

            {/* Date Picker */}
            <div className="mb-6">
              <label className="block text-[var(--text-muted)] text-sm mb-2">{tr.booking.selectDate}</label>
              <input
                type="date"
                min={getMinDate()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-gold-500 transition-colors [color-scheme:dark]"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <label className="block text-[var(--text-muted)] text-sm mb-2">{tr.booking.selectTime}</label>

                {slotsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-[var(--text-muted)] text-sm">{labels.slotsLoading}</span>
                  </div>
                )}

                {slotsError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                    {slotsError}
                  </div>
                )}

                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <p className="text-[var(--text-muted)] text-sm py-4">
                    {labels.noSlots}
                  </p>
                )}

                {!slotsLoading && !slotsError && slots.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      slot.available ? (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-3 rounded-lg text-sm font-medium transition-colors ${
                            selectedTime === slot.time
                              ? 'bg-gold-500 text-surface-950'
                              : 'bg-[var(--glass)] text-[var(--text-muted)] hover:bg-[var(--glass-strong)] hover:text-[var(--text)]'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ) : (
                        <div key={slot.time} className="relative group">
                          <div className="py-3 rounded-lg text-sm font-medium bg-[var(--glass)] text-[var(--text-muted)] cursor-not-allowed line-through text-center">
                            {slot.time}
                          </div>
                          <button
                            onClick={() => handleWaitlist(slot.time)}
                            disabled={waitlistSlot === slot.time}
                            className="absolute inset-x-0 -bottom-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {waitlistSuccess === slot.time ? (
                              <span className="text-[10px] text-gold-400 font-medium flex items-center gap-0.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {labels.waitlistAdded}
                              </span>
                            ) : (
                              <span className={`text-[10px] text-gold-400 font-medium ${waitlistSlot === slot.time ? 'opacity-50' : 'hover:text-gold-300'}`}>
                                {waitlistSlot === slot.time ? '...' : labels.waitlist}
                              </span>
                            )}
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep('service')}
                className="flex-1 py-3 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
              >
                {tr.common.back}
              </button>
              <button
                onClick={() => selectedDate && selectedTime && setStep('confirm')}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 py-3 rounded-full bg-gold-500 text-surface-950 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold-400 transition-colors"
              >
                {tr.common.next}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {authMode === 'guest' && (
              <div className="bg-[var(--glass)] rounded-2xl p-6 mb-4 space-y-3">
                <h3 className="text-[var(--text)] font-semibold">{labels.guestInfoTitle}</h3>
                <div>
                  <label className="text-[var(--text-muted)] text-xs block mb-1">{labels.guestNameLabel}</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text)] text-sm focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-muted)] text-xs block mb-1">{labels.guestEmailLabel}</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text)] text-sm focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="max@beispiel.de"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-muted)] text-xs block mb-1">{labels.guestPhoneLabel}</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text)] text-sm focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder={labels.guestPhonePlaceholder}
                  />
                </div>
              </div>
            )}
            <div className="bg-[var(--glass)] rounded-2xl p-6 space-y-4 mb-6">
              <h3 className="text-[var(--text)] font-semibold text-lg">{labels.summary}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Service</span>
                  <span className="text-[var(--text)] font-medium">{selectedService?.name[lang]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">{labels.date}</span>
                  <span className="text-[var(--text)] font-medium">
                    {selectedDate && new Date(selectedDate).toLocaleDateString(getLocale(lang), {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">{labels.time}</span>
                  <span className="text-[var(--text)] font-medium">{selectedTime} Uhr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">{labels.duration}</span>
                  <span className="text-[var(--text)] font-medium">{`ca. ${selectedService?.duration} ${tr.services.duration}`}</span>
                </div>
                <div className="border-t border-[var(--border)] pt-3 flex justify-between">
                  <span className="text-[var(--text)] font-medium">{labels.price}</span>
                  <span className="text-gold-400 font-display font-bold text-xl">{selectedService?.price}€</span>
                </div>
              </div>
            </div>

            {bookingError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-4">
                {bookingError}
              </div>
            )}

            <p className="text-[var(--text-muted)] text-xs text-center mb-6">
              {tr.booking.cancelPolicy}{' '}
              {labels.payment}
            </p>

            {authMode === 'guest' && (
              <p className="text-[var(--text-muted)] text-xs text-center mb-4">
                {labels.guestCancelNote}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('datetime')}
                disabled={bookingLoading}
                className="flex-1 py-3 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-50"
              >
                {tr.common.back}
              </button>
              <button
                onClick={handleConfirm}
                disabled={bookingLoading}
                className="flex-1 py-3 rounded-full bg-gold-500 text-surface-950 font-semibold hover:bg-gold-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bookingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-surface-950 border-t-transparent rounded-full animate-spin" />
                    {tr.common.loading}
                  </>
                ) : (
                  tr.booking.confirm
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Success */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-display font-bold text-[var(--text)]">{labels.booked}</h2>
            <p className="mt-2 text-[var(--text-muted)]">
              {selectedDate && new Date(selectedDate).toLocaleDateString(getLocale(lang), {
                day: 'numeric',
                month: 'long',
              })}{' '}
              {selectedTime} Uhr
            </p>
            <p className="mt-1 text-[var(--text-muted)] text-sm">
              {labels.email}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  if (selectedService && selectedDate && selectedTime) {
                    downloadICS(selectedService.name[lang], selectedDate, selectedTime, selectedService.duration);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--glass)] border border-[var(--border)] text-[var(--text-subtle)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {labels.calExport}
              </button>
              <a
                href={selectedService && selectedDate && selectedTime
                  ? buildWhatsAppUrl(lang, selectedService.name[lang], selectedDate, selectedTime, getLocale(lang))
                  : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.113 1.522 5.843L.057 23.25l5.57-1.463A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.797-.5-5.398-1.38l-.387-.225-4.013 1.055 1.073-3.907-.247-.4A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
                {labels.shareWhatsApp}
              </a>
            </div>
            {authMode === 'guest' ? (
              <div className="mt-6">
                <p className="text-[var(--text-muted)] text-xs mb-6">{labels.guestSuccessNote}</p>
                <a
                  href={lang === 'de' ? '/' : '/' + lang}
                  className="px-6 py-3 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  {dbLabels.toHome}
                </a>
              </div>
            ) : (
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <a href={lang === 'de' ? '/dashboard' : '/' + lang + '/dashboard'} className="px-6 py-3 rounded-full bg-gold-500 text-surface-950 font-semibold hover:bg-gold-400 transition-colors">
                  {dbLabels.toDashboard}
                </a>
                <a href={lang === 'de' ? '/' : '/' + lang} className="px-6 py-3 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                  {dbLabels.toHome}
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
