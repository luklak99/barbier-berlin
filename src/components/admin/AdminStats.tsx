import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface StatsData {
  today: { bookings: number; confirmed: number; revenue: number; pointsPaid: number };
  week: { revenue: number; revenueByDay: Record<string, number> };
  month: { bookings: number; topServices: { name: string; count: number; revenue: number }[]; slotHeatmap: Record<string, number> };
  totals: { customers: number; reviews: number };
}

function BarChart({ data, label }: { data: Record<string, number>; label: string }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  return (
    <div>
      <h3 className="text-sm font-medium text-[#8A8F98] mb-3">{label}</h3>
      <div className="flex items-end gap-2 h-32">
        {entries.map(([date, value]) => {
          const dayName = days[new Date(date).getDay()] || '';
          const height = max > 0 ? (value / max) * 100 : 0;
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-[#8A8F98]">{value}€</span>
              <div className="w-full relative" style={{ height: '80px' }}>
                <div
                  className="absolute bottom-0 w-full rounded-t bg-gradient-to-t from-[#C8A55A] to-[#E8D48B] transition-all duration-500"
                  style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-xs text-[#8A8F98]">{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeatmapRow({ data }: { data: Record<string, number> }) {
  const hours = Array.from({ length: 8 }, (_, i) => (i + 10).toString());
  const max = Math.max(...Object.values(data), 1);

  return (
    <div>
      <h3 className="text-sm font-medium text-[#8A8F98] mb-3">Auslastung nach Uhrzeit (30 Tage)</h3>
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
                    : 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                title={`${h}:00 — ${count} Termine`}
              />
              <span className="text-xs text-[#8A8F98] mt-1 block">{h}h</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminStats() {
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
        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/[0.03] rounded-xl border border-white/[0.06]" />)}
      </div>
    );
  }

  if (!stats) return <p className="text-[#8A8F98]">Statistiken konnten nicht geladen werden.</p>;

  return (
    <div className="space-y-6">
      {/* Revenue Chart */}
      <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#8A8F98] text-sm">Wochenumsatz</p>
            <p className="text-2xl font-display font-bold text-[#C8A55A]">{stats.week.revenue}€</p>
          </div>
          <div className="text-right">
            <p className="text-[#8A8F98] text-sm">Termine (30 Tage)</p>
            <p className="text-2xl font-display font-bold text-[#EDEDEF]">{stats.month.bookings}</p>
          </div>
        </div>
        <BarChart data={stats.week.revenueByDay} label="Umsatz letzte 7 Tage" />
      </div>

      {/* Top Services */}
      <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.06]">
        <h3 className="text-sm font-medium text-[#8A8F98] mb-4">Top Services (30 Tage)</h3>
        <div className="space-y-3">
          {stats.month.topServices.map((svc, i) => {
            const maxCount = stats.month.topServices[0]?.count || 1;
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#EDEDEF]">{svc.name}</span>
                  <span className="text-[#8A8F98]">{svc.count}× · {svc.revenue}€</span>
                </div>
                <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#C8A55A] to-[#E8D48B] transition-all duration-500"
                    style={{ width: `${(svc.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          {stats.month.topServices.length === 0 && (
            <p className="text-[#8A8F98] text-sm">Noch keine Daten vorhanden.</p>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.06]">
        <HeatmapRow data={stats.month.slotHeatmap} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06] text-center">
          <p className="text-3xl font-display font-bold text-[#EDEDEF]">{stats.totals.customers}</p>
          <p className="text-[#8A8F98] text-sm mt-1">Kunden gesamt</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06] text-center">
          <p className="text-3xl font-display font-bold text-[#EDEDEF]">{stats.totals.reviews}</p>
          <p className="text-[#8A8F98] text-sm mt-1">Bewertungen</p>
        </div>
      </div>

      {/* Export */}
      <div className="flex gap-3">
        <a
          href="/api/admin/export?type=bookings"
          className="flex-1 py-3 text-center rounded-xl border border-white/[0.08] text-[#8A8F98] hover:text-[#C8A55A] hover:border-[#C8A55A]/30 transition-all text-sm font-medium"
        >
          Termine CSV
        </a>
        <a
          href="/api/admin/export?type=customers"
          className="flex-1 py-3 text-center rounded-xl border border-white/[0.08] text-[#8A8F98] hover:text-[#C8A55A] hover:border-[#C8A55A]/30 transition-all text-sm font-medium"
        >
          Kunden CSV
        </a>
      </div>
    </div>
  );
}
