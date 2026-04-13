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

const summaryLabels: Record<Language, { summary: string; date: string; time: string; duration: string; price: string; booked: string; payment: string; email: string; noSlots: string; slotsLoading: string; change: string }> = {
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

export default function BookingFlow({ lang = 'de' }: Props) {
  const tr = t(lang);
  const labels = summaryLabels[lang];
  const dbLabels = dashboardLabels[lang];

  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('haircut');

  // API states
  const [authChecked, setAuthChecked] = useState(false);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Auth-Check beim Mount
  useEffect(() => {
    getUser().then((user) => {
      if (!user) {
        window.location.href = lang === 'de' ? '/login' : `/${lang}/login`;
      } else {
        setAuthChecked(true);
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

    setBookingLoading(true);
    setBookingError('');

    try {
      await api<CreateBookingResponse>('/api/bookings/create', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedTime,
        }),
      });
      setStep('success');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Fehler bei der Buchung.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredServices = services.filter((s) => s.category === activeCategory);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
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
                      : 'bg-white/5 text-white/30'
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
              <span className={`text-sm hidden sm:block ${step === s.key ? 'text-white' : 'text-white/30'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-12 h-px bg-white/10 mx-2" />}
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
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
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
                      : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{service.name[lang]}</h3>
                      <p className="text-white/40 text-sm mt-0.5">{`ca. ${service.duration} ${tr.services.duration}`}</p>
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
            <div className="bg-white/5 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{selectedService?.name[lang]}</p>
                <p className="text-white/40 text-sm">{selectedService?.duration} {tr.services.duration} · {selectedService?.price}€</p>
              </div>
              <button onClick={() => setStep('service')} className="text-gold-400 text-sm hover:text-gold-300">
                {labels.change}
              </button>
            </div>

            {/* Date Picker */}
            <div className="mb-6">
              <label className="block text-white/60 text-sm mb-2">{tr.booking.selectDate}</label>
              <input
                type="date"
                min={getMinDate()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors [color-scheme:dark]"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <label className="block text-white/60 text-sm mb-2">{tr.booking.selectTime}</label>

                {slotsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-white/40 text-sm">{labels.slotsLoading}</span>
                  </div>
                )}

                {slotsError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                    {slotsError}
                  </div>
                )}

                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <p className="text-white/40 text-sm py-4">
                    {labels.noSlots}
                  </p>
                )}

                {!slotsLoading && !slotsError && slots.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`py-3 rounded-lg text-sm font-medium transition-colors ${
                          !slot.available
                            ? 'bg-white/3 text-white/20 cursor-not-allowed line-through'
                            : selectedTime === slot.time
                              ? 'bg-gold-500 text-surface-950'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep('service')}
                className="flex-1 py-3 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
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
            <div className="bg-white/5 rounded-2xl p-6 space-y-4 mb-6">
              <h3 className="text-white font-semibold text-lg">{labels.summary}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Service</span>
                  <span className="text-white font-medium">{selectedService?.name[lang]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">{labels.date}</span>
                  <span className="text-white font-medium">
                    {selectedDate && new Date(selectedDate).toLocaleDateString(getLocale(lang), {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">{labels.time}</span>
                  <span className="text-white font-medium">{selectedTime} Uhr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">{labels.duration}</span>
                  <span className="text-white font-medium">{`ca. ${selectedService?.duration} ${tr.services.duration}`}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-medium">{labels.price}</span>
                  <span className="text-gold-400 font-display font-bold text-xl">{selectedService?.price}€</span>
                </div>
              </div>
            </div>

            {bookingError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-4">
                {bookingError}
              </div>
            )}

            <p className="text-white/40 text-xs text-center mb-6">
              {tr.booking.cancelPolicy}{' '}
              {labels.payment}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('datetime')}
                disabled={bookingLoading}
                className="flex-1 py-3 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
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
            <h2 className="text-2xl font-display font-bold text-white">{labels.booked}</h2>
            <p className="mt-2 text-white/50">
              {selectedDate && new Date(selectedDate).toLocaleDateString(getLocale(lang), {
                day: 'numeric',
                month: 'long',
              })}{' '}
              {selectedTime} Uhr
            </p>
            <p className="mt-1 text-white/40 text-sm">
              {labels.email}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={lang === 'de' ? '/dashboard' : '/' + lang + '/dashboard'}
                className="px-6 py-3 rounded-full bg-gold-500 text-surface-950 font-semibold hover:bg-gold-400 transition-colors"
              >
                {dbLabels.toDashboard}
              </a>
              <a
                href={lang === 'de' ? '/' : '/' + lang}
                className="px-6 py-3 rounded-full border border-white/10 text-white/60 hover:text-white transition-colors"
              >
                {dbLabels.toHome}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
