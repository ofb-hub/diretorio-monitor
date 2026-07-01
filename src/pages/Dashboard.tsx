import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Building2, Boxes, Server, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useDirectory } from '../lib/DirectoryContext'
import { prettyFamily } from '../lib/directory'
import { Card, KpiCard, PageHeader } from '../components/ui'

const ROLE_COLORS = ['#2ecc9b', '#3aa0ff', '#f5a524', '#f04d6a', '#a78bfa', '#22d3ee', '#e879f9']

export function Dashboard() {
  const { stats } = useDirectory()
  if (!stats) return null

  const topFamilies = stats.apiFamilyCounts.slice(0, 12).map((f) => ({
    ...f,
    label: prettyFamily(f.name),
  }))

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do ecossistema Open Finance Brasil"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Organizações"
          value={stats.totalOrganisations}
          sub={`${stats.activeOrganisations} ativas`}
          icon={<Building2 size={20} />}
          tone="info"
        />
        <KpiCard
          label="Authorisation Servers"
          value={stats.totalServers}
          icon={<Server size={20} />}
        />
        <KpiCard
          label="APIs declaradas"
          value={stats.totalApis.toLocaleString('pt-BR')}
          icon={<Boxes size={20} />}
        />
        <KpiCard
          label="Certificações válidas"
          value={stats.certsOk}
          icon={<ShieldCheck size={20} />}
          tone="ok"
        />
        <KpiCard
          label="Expirando (≤90d)"
          value={stats.certsExpiring}
          icon={<ShieldAlert size={20} />}
          tone="warn"
        />
        <KpiCard
          label="Expiradas"
          value={stats.certsExpired}
          icon={<ShieldAlert size={20} />}
          tone="danger"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Famílias de API */}
        <Card className="p-5 xl:col-span-2">
          <h2 className="mb-4 font-semibold">Top famílias de API</h2>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={topFamilies} layout="vertical" margin={{ left: 40, right: 16 }}>
              <XAxis type="number" stroke="#8b96b8" fontSize={12} />
              <YAxis
                type="category"
                dataKey="label"
                width={160}
                stroke="#8b96b8"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  background: '#1b2440',
                  border: '1px solid #273154',
                  borderRadius: 8,
                  color: '#e6ebff',
                }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="value" fill="#3aa0ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Roles */}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Distribuição por Role</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.roleCounts}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(e) => `${e.name}: ${e.value}`}
                fontSize={11}
              >
                {stats.roleCounts.map((_, i) => (
                  <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1b2440',
                  border: '1px solid #273154',
                  borderRadius: 8,
                  color: '#e6ebff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-[var(--color-muted)]">
            CONTA · DADOS · PAGTO · CCORR — habilitações declaradas por organização.
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Status de certificação das APIs */}
        <Card className="p-5 xl:col-span-2">
          <h2 className="mb-4 font-semibold">Status de certificação das APIs</h2>
          <div className="flex flex-wrap gap-4">
            {stats.certStatusCounts.map((s) => (
              <div
                key={s.name}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3"
              >
                <div className="text-2xl font-bold">{s.value.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-[var(--color-muted)]">{s.name}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Segmentos PF/PJ */}
        <Card className="p-5">
          <h2 className="mb-1 font-semibold">Segmentos atendidos</h2>
          <p className="mb-4 text-xs text-[var(--color-muted)]">
            Organizações com ao menos um server marcado como PF/PJ.
          </p>
          <div className="flex gap-4">
            <div className="flex-1 rounded-lg border border-[var(--color-ok)]/30 bg-[var(--color-ok)]/10 px-4 py-3">
              <div className="text-3xl font-bold text-[var(--color-ok)]">{stats.orgsPf}</div>
              <div className="text-xs text-[var(--color-muted)]">
                PF — Pessoa Física
              </div>
            </div>
            <div className="flex-1 rounded-lg border border-[var(--color-warn)]/30 bg-[var(--color-warn)]/10 px-4 py-3">
              <div className="text-3xl font-bold text-[var(--color-warn)]">{stats.orgsPj}</div>
              <div className="text-xs text-[var(--color-muted)]">
                PJ — Pessoa Jurídica
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-[var(--color-muted)]">
            de {stats.totalOrganisations} organizações
          </div>
        </Card>
      </div>
    </>
  )
}
