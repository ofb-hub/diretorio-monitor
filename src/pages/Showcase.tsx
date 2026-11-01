// Vitrine: os efeitos mais chamativos da Magic UI e da Aceternity UI aplicados
// aos dados do diretório — é uma página para explorar, não parte do fluxo da app.

import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { useDirectory } from '../lib/DirectoryContext'
import { serverLabel } from '../lib/directory'
import { classifyFamily, PHASES, type PhaseKey } from '../lib/taxonomy'
import { modKeyLabel, openCommandMenu } from '../lib/commandMenu'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Kbd } from '@/components/ui/kbd'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { BlurFade } from '@/components/ui/blur-fade'
import { BorderBeam } from '@/components/ui/border-beam'
import { Particles } from '@/components/ui/particles'
import { Marquee } from '@/components/ui/marquee'
import { Meteors } from '@/components/ui/meteors'
import { NumberTicker } from '@/components/ui/number-ticker'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { Spotlight } from '@/components/ui/spotlight-new'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { TopRanking } from '../components/TopRanking'
import { cn } from '@/lib/utils'

// Velocidade do Marquee de logos: segundos que cada logo leva para passar.
const SECONDS_PER_LOGO = 4.5

function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('mb-10', className)}>{children}</section>
}

export function Showcase() {
  const navigate = useNavigate()
  const { organisations } = useDirectory()

  const data = useMemo(() => {
    let servers = 0
    let apis = 0
    let endpoints = 0
    const phaseCounts = new Map<PhaseKey, number>()
    const logos = new Map<string, string>()

    for (const org of organisations) {
      for (const s of org.AuthorisationServers ?? []) {
        servers++
        if (s.CustomerFriendlyLogoUri && !logos.has(s.CustomerFriendlyLogoUri)) {
          logos.set(s.CustomerFriendlyLogoUri, serverLabel(org, s.CustomerFriendlyName))
        }
        for (const a of s.ApiResources ?? []) {
          apis++
          endpoints += (a.ApiDiscoveryEndpoints ?? []).length
          const phase = classifyFamily(a.ApiFamilyType).phase
          phaseCounts.set(phase, (phaseCounts.get(phase) ?? 0) + 1)
        }
      }
    }

    const logoList = [...logos.entries()].map(([src, name]) => ({ src, name }))
    const half = Math.ceil(logoList.length / 2)
    return {
      servers,
      apis,
      endpoints,
      phases: (Object.keys(PHASES) as PhaseKey[])
        .filter((k) => phaseCounts.has(k))
        .map((k) => ({ key: k, label: PHASES[k].label, value: phaseCounts.get(k)! })),
      logosA: logoList.slice(0, half),
      logosB: logoList.slice(half),
    }
  }, [organisations])

  const stats = [
    { label: 'Organizações', value: organisations.length },
    { label: 'Authorisation Servers', value: data.servers },
    { label: 'APIs declaradas', value: data.apis },
    { label: 'Endpoints de descoberta', value: data.endpoints },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      {/* 1. Hero ---------------------------------------------------------- */}
      <Section>
        <div className="relative isolate flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-card px-6 py-16 text-center ring-1 ring-foreground/10">
          <Spotlight />
          {/* Brilho suave pulsando atrás do título (só CSS). */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[420px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-linear-to-tr from-primary/30 to-info/30 blur-3xl [animation-duration:4s]" />
          {/* Particles (Magic UI): duas camadas, verde e azul, subindo devagar e
              desviando do mouse. `staticity` maior = reage menos ao cursor. */}
          <Particles
            className="absolute inset-0 -z-10"
            quantity={110}
            staticity={40}
            ease={60}
            size={1.3}
            vy={-0.08}
            color="#2ecc9b"
          />
          <Particles
            className="absolute inset-0 -z-10"
            quantity={70}
            staticity={60}
            ease={80}
            size={1.1}
            vy={-0.05}
            color="#3aa0ff"
          />
          <BlurFade delay={0.1}>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-6xl">
              O ecossistema do{' '}
              <AnimatedGradientText colorFrom="#2ecc9b" colorTo="#3aa0ff" speed={1.5}>
                Open Finance
              </AnimatedGradientText>
              <br />
              em um só lugar
            </h1>
          </BlurFade>
          <BlurFade delay={0.25}>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {organisations.length} instituições, {data.servers} authorisation servers e{' '}
              {data.apis.toLocaleString('pt-BR')} APIs, direto do diretório central.
            </p>
          </BlurFade>
          <BlurFade delay={0.4}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ShimmerButton
                background="#0f1a33"
                shimmerColor="#2ecc9b"
                onClick={() => navigate('/participantes')}
                className="px-6 py-3 text-sm font-medium"
              >
                Explorar participantes <ArrowRight className="ml-2 size-4" />
              </ShimmerButton>
              <Button variant="outline" size="lg" onClick={openCommandMenu}>
                <Search /> Busca rápida <Kbd>{modKeyLabel} K</Kbd>
              </Button>
            </div>
          </BlurFade>
        </div>
      </Section>

      {/* 2. Números ------------------------------------------------------- */}
      <Section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg font-semibold">Em números</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Card key={s.label} className="relative">
              <CardContent>
                <NumberTicker
                  value={s.value}
                  className="font-heading text-4xl font-semibold tracking-tight"
                />
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </CardContent>
              <BorderBeam
                size={70}
                duration={10}
                delay={i * 2.5}
                colorFrom="#2ecc9b"
                colorTo="#3aa0ff"
              />
            </Card>
          ))}
        </div>
      </Section>

      {/* 3. Logos --------------------------------------------------------- */}
      <Section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg font-semibold">Quem está no diretório</h2>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-card py-4 ring-1 ring-foreground/10">
          {[data.logosA, data.logosB].map((row, i) => (
            <Marquee
              key={i}
              reverse={i === 1}
              pauseOnHover
              // A duração é o tempo para percorrer a fileira inteira; com dezenas
              // de logos, um valor fixo deixava rápido demais. Tempo por logo =
              // velocidade constante (~40px/s), não importa quantos logos haja.
              style={{ '--duration': `${row.length * SECONDS_PER_LOGO}s` } as React.CSSProperties}
            >
              {row.map((l) => (
                <div
                  key={l.src}
                  title={l.name}
                  className="flex h-14 w-40 items-center gap-2 rounded-lg bg-muted/40 px-3 ring-1 ring-foreground/5"
                >
                  <img
                    src={l.src}
                    alt=""
                    loading="lazy"
                    className="size-8 shrink-0 rounded object-contain"
                    onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                  />
                  <span className="truncate text-xs text-muted-foreground">{l.name}</span>
                </div>
              ))}
            </Marquee>
          ))}
          {/* Degradê nas bordas para os logos "sumirem" */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-card" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-card" />
        </div>
      </Section>

      {/* 4. Top 10 --------------------------------------------------------- */}
      <Section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg font-semibold">Maiores instituições</h2>
        </div>
        <Card>
          <CardContent>
            <TopRanking organisations={organisations} />
          </CardContent>
        </Card>
      </Section>

      {/* 5. Fases --------------------------------------------------------- */}
      <Section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg font-semibold">APIs por fase regulatória</h2>
        </div>
        <Card className="relative overflow-hidden">
          <Meteors number={18} />
          <CardHeader>
            <CardTitle>Distribuição das {data.apis.toLocaleString('pt-BR')} APIs</CardTitle>
            <CardDescription>Por fase da jornada regulatória do Open Finance Brasil</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.phases.map((p) => {
              const pct = Math.round((p.value / data.apis) * 100)
              return (
                <div key={p.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{p.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {p.value.toLocaleString('pt-BR')} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-primary to-info"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </Section>

      {/* 6. CTA ----------------------------------------------------------- */}
      <Section>
        <div className="relative flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-2xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
          <BackgroundBeams />
          <h2 className="relative z-10 font-heading text-2xl font-semibold sm:text-3xl">
            Procurando uma instituição específica?
          </h2>
          <p className="relative z-10 mt-2 text-muted-foreground">
            Aperte <Kbd>{modKeyLabel} K</Kbd> em qualquer tela.
          </p>
          <Button className="relative z-10 mt-6" onClick={openCommandMenu}>
            <Search /> Abrir busca rápida
          </Button>
        </div>
      </Section>
    </div>
  )
}
