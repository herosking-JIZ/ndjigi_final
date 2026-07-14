import { useState, useEffect } from 'react'
import { Users, Car, CreditCard, Star } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts'
import { KpiCard } from '@/components/KpiCard'
import { dashboardService } from '@/services/api'
import { formatFCFA } from '@/lib/utils'
import type { AdminKpis, ChartDataPoint, TopChauffeur } from '@/types'

const COLORS = ['hsl(24,95%,53%)', 'hsl(220,25%,55%)', 'hsl(145,65%,42%)', 'hsl(38,92%,50%)']

const CHART_STYLE = {
  fontSize: 11,
  fill: 'hsl(220,15%,50%)',
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<AdminKpis | null>(null)
  const [coursesSemaine, setCoursesSemaine] = useState<ChartDataPoint[]>([])
  const [evolution, setEvolution] = useState<ChartDataPoint[]>([])
  const [paiements, setPaiements] = useState<{ name: string; value: number }[]>([])
  const [topChauffeurs, setTopChauffeurs] = useState<TopChauffeur[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [k, cs, ev, pm, tc] = await Promise.all([
          dashboardService.kpis(),
          dashboardService.coursesSemaine(),
          dashboardService.evolutionMensuelle(),
          dashboardService.moyensPaiement(),
          dashboardService.topChauffeurs(),
        ])
        setKpis(k)
        setCoursesSemaine(cs)
        setEvolution(ev)
        setPaiements(Array.isArray(pm) ? pm : [])
        setTopChauffeurs(tc)
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vue d'ensemble de la plateforme</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Utilisateurs totaux"
          value={kpis?.total_utilisateurs ?? '—'}
          subtitle="Tous rôles confondus"
          icon={Users}
          trend={kpis?.tendance_utilisateurs}
          loading={loading}
        />
        <KpiCard
          title="Courses aujourd'hui"
          value={kpis?.courses_aujourd_hui ?? '—'}
          subtitle="Courses du jour"
          icon={Car}
          trend={kpis?.tendance_courses}
          loading={loading}
        />
        <KpiCard
          title="Commissions du jour"
          value={kpis ? formatFCFA(kpis.revenus_commission_jour) : '—'}
          subtitle="15% sur courses terminées"
          icon={CreditCard}
          loading={loading}
        />
        <KpiCard
          title="Satisfaction moyenne"
          value={kpis ? `${kpis.satisfaction_moyenne} / 5` : '—'}
          subtitle="Note globale du système"
          icon={Star}
          loading={loading}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-semibold mb-4">Courses par semaine</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={coursesSemaine} barSize={28}>
              <XAxis dataKey="label" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar dataKey="value" name="Courses" fill="hsl(24,95%,53%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-semibold mb-4">Évolution mensuelle</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={evolution}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(24,95%,53%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(24,95%,53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                name="Courses"
                stroke="hsl(24,95%,53%)"
                strokeWidth={2}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-semibold mb-4">Moyens de paiement</h3>
          <div className="flex items-center gap-4">
            {/* ✅ PieChart avec dimensions fixes — pas besoin de ResponsiveContainer */}
            <PieChart width={160} height={160}>
              <Pie
                data={paiements}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                dataKey="value"
                paddingAngle={3}
              >
                {paiements.map((p, i) => (
                  <Cell key={p.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {paiements.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="flex-1 text-muted-foreground text-xs">{p.name}</span>
                  <span className="font-semibold text-xs">{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-semibold mb-4">Top 5 Chauffeurs</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <ol className="space-y-2">
              {topChauffeurs.map((c) => (
                <li key={c.rang} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {c.rang}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">{c.nom}</span>
                  <span className="text-sm font-semibold text-primary shrink-0">
                    {formatFCFA(c.chiffre_affaires)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
