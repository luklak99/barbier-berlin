import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { type Language } from '../../i18n/translations';

interface StatsData {
  today: { bookings: number; confirmed: number; revenue: number; pointsPaid: number };
  week: { revenue: number; revenueByDay: Record<string, number> };
  month: { bookings: number; topServices: { name: string; count: number; revenue: number }[]; slotHeatmap: Record<string, number> };
  totals: { customers: number; reviews: number };
}

const dayNames: Record<Language, string[]> = {
  de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  tr: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  ar: ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'],
};

const statsLabels: Record<Language, {
  weekRevenue: string;
  monthBookings: string;
  revenueChart: string;
  topServices: string;
  noData: string;
  heatmap: string;
  heatmapTooltip: (hour: string, count: number) => string;
  customersTotal: string;
  reviews: string;
  exportBookings: string;
  exportCustomers: string;
  error: string;
}> = {
  de: {
    weekRevenue: 'Wochenumsatz',
    monthBookings: 'Termine (30 Tage)',
    revenueChart: 'Umsatz letzte 7 Tage',
    topServices: 'Top Services (30 Tage)',
    noData: 'Noch keine Daten vorhanden.',
    heatmap: 'Auslastung nach Uhrzeit (30 Tage)',
    heatmapTooltip: (hour, count) => `${hour}:00 — ${count} Termine`,
    customersTotal: 'Kunden gesamt',
    reviews: 'Bewertungen',
    exportBookings: 'Termine CSV',
    exportCustomers: 'Kunden CSV',
    error: 'Statistiken konnten nicht geladen werden.',
  },
  en: {
    weekRevenue: 'Weekly revenue',
    monthBookings: 'Appointments (30 days)',
    revenueChart: 'Revenue last 7 days',
    topServices: 'Top services (30 days)',
    noData: 'No data available yet.',
    heatmap: 'Utilisation by time of day (30 days)',
    heatmapTooltip: (hour, count) => `${hour}:00 — ${count} appointments`,
    customersTotal: 'Total customers',
    reviews: 'Reviews',
    exportBookings: 'Appointments CSV',
    exportCustomers: 'Customers CSV',
    error: 'Statistics could not be loaded.',
  },
  tr: {
    weekRevenue: 'Haftalık gelir',
    monthBookings: 'Randevular (30 gün)',
    revenueChart: 'Son 7 günün geliri',
    topServices: 'En iyi hizmetler (30 gün)',
    noData: 'Henüz veri yok.',
    heatmap: 'Saate göre doluluk (30 gün)',
    heatmapTooltip: (hour, count) => `${hour}:00 — ${count} randevu`,
    customersTotal: 'Toplam müşteri',
    reviews: 'Değerlendirmeler',
    exportBookings: 'Randevular CSV',
    exportCustomers: 'Müşteriler CSV',
    error: 'İstatistikler yüklenemedi.',
  },
  ar: {
    weekRevenue: 'إيرادات الأسبوع',
    monthBookings: 'المواعيد (30 يوماً)',
    revenueChart: 'الإيرادات آخر 7 أيام',
    topServices: 'أبرز الخدمات (30 يوماً)',
    noData: 'لا توجد بيانات بعد.',
    heatmap: 'الاستخدام حسب الوقت (30 يوماً)',
    heatmapTooltip: (hour, count) => `${hour}:00 — ${count} مواعيد`,
    customersTotal: 'إجمالي العملاء',
    reviews: 'التقييمات',
    exportBookings: 'تصدير المواعيد CSV',
    exportCustomers: 'تصدير العملاء CSV',
    error: 'تعذّر تحميل الإحصائيات.',
  },
};

interface BarChartProps {
  data: Record<string, number>;
  label: string;
  lang: Language;
}

function BarChart({ data, label, lang }: BarChartProps) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const days = dayNames[lang];

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">{label}</h3>
      <div className="flex items-end gap-2 h-32">
        {entries.map(([date, value]) => {
          const dayName = days[new Date(date).getDay()] || '';
          const height = max > 0 ? (value / max) * 100 : 0;
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-[var(--text-muted)]">{value}€</span>
              <div className="w-full relative" style={{ height: '80px' }}>
                <div
                  className="absolute bottom-0 w-full rounded-t bg-gradient-to-t from-[#C8A55A] to-[#E8D48B] transition-all duration-500"
                  style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)]">{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HeatmapRowProps {
  data: Record<string, number>;
  lang: Language;
}

function HeatmapRow({ data, lang }: HeatmapRowProps) {
  const labels = statsLabels[lang];
  const hours = Array.from({ length: 8 }, (_, i) => (i + 10).toString());
  const max = Math.max(...Object.values(data), 1);

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">{labels.heatmap}</h3>
      <div className="flex gap-1.5">
        {hours.map(h => {
          const count = data[h] || 0;
          const intensity = count / max;
          return (
            <div key={h} className="flex-1 text-center">
              <div
                className="h-10 rounded-lg transition-colors"
                style={{
                  backgroundColor: intensity > 0
                    ? `rgba(200, 165, 90, ${0.1 + intensity * 0.6})`
                    : 'var(--glass)',
                  border: '1px solid var(--border)',
                }}
                title={labels.heatmapTooltip(h, count)}
              />
              <span className="text-xs text-[var(--text-muted)] mt-1 block">{h}h</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AdminStatsProps {
  lang?: Language;
}

export default function AdminStats({ lang = 'de' }: AdminStatsProps) {
  const labels = statsLabels[lang];
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<StatsData>('/api/admin/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-[var(--glass)] rounded-xl border border-[var(--border)]" />)}
      </div>
    );
  }

  if (!stats) return <p className="text-[var(--text-muted)]">{labels.error}</p>;

  return (
    <div className="space-y-6">
      {/* Revenue Chart */}
      <div className="bg-[var(--glass)] rounded-xl p-6 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[var(--text-muted)] text-sm">{labels.weekRevenue}</p>
            <p className="text-2xl font-display font-bold text-[#C8A55A]">{stats.week.revenue}€</p>
          </div>
          <div className="text-right">
            <p className="text-[var(--text-muted)] text-sm">{labels.monthBookings}</p>
            <p className="text-2xl font-display font-bold text-[var(--text)]">{stats.month.bookings}</p>
          </div>
        </div>
        <BarChart data={stats.week.revenueByDay} label={labels.revenueChart} lang={lang} />
      </div>

      {/* Top Services */}
      <div className="bg-[var(--glass)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--text-muted)] mb-4">{labels.topServices}</h3>
        <div className="space-y-3">
          {stats.month.topServices.map((svc, i) => {
            const maxCount = stats.month.topServices[0]?.count || 1;
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text)]">{svc.name}</span>
                  <span className="text-[var(--text-muted)]">{svc.count}× · {svc.revenue}€</span>
                </div>
                <div className="h-2 bg-[var(--glass)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#C8A55A] to-[#E8D48B] transition-all duration-500"
                    style={{ width: `${(svc.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          {stats.month.topServices.length === 0 && (
            <p className="text-[var(--text-muted)] text-sm">{labels.noData}</p>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[var(--glass)] rounded-xl p-6 border border-[var(--border)]">
        <HeatmapRow data={stats.month.slotHeatmap} lang={lang} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)] text-center">
          <p className="text-3xl font-display font-bold text-[var(--text)]">{stats.totals.customers}</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">{labels.customersTotal}</p>
        </div>
        <div className="bg-[var(--glass)] rounded-xl p-5 border border-[var(--border)] text-center">
          <p className="text-3xl font-display font-bold text-[var(--text)]">{stats.totals.reviews}</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">{labels.reviews}</p>
        </div>
      </div>

      {/* Export */}
      <div className="flex gap-3">
        <a
          href="/api/admin/export?type=bookings"
          className="flex-1 py-3 text-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[#C8A55A] hover:border-[#C8A55A]/30 transition-all text-sm font-medium"
        >
          {labels.exportBookings}
        </a>
        <a
          href="/api/admin/export?type=customers"
          className="flex-1 py-3 text-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[#C8A55A] hover:border-[#C8A55A]/30 transition-all text-sm font-medium"
        >
          {labels.exportCustomers}
        </a>
      </div>
    </div>
  );
}
