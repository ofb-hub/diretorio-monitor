import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { DirectoryProvider, useDirectory } from './lib/DirectoryContext'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { ErrorState, ListSkeleton, Spinner } from './components/ui'
import { Participants } from './pages/Participants'
import { ParticipantDetail } from './pages/ParticipantDetail'

// Páginas fora do menu: carregadas sob demanda para não pesar no bundle
// principal (o Dashboard sozinho traz o recharts).
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Apis = lazy(() => import('./pages/Apis').then((m) => ({ default: m.Apis })))
const Certifications = lazy(() =>
  import('./pages/Certifications').then((m) => ({ default: m.Certifications })),
)

function AppContent() {
  const { loading, error, organisations, refresh } = useDirectory()

  if (loading && organisations.length === 0) {
    return <ListSkeleton />
  }
  if (error && organisations.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />
  }

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* App abre em Participantes. Dashboard/APIs/Certificações seguem no código,
            acessíveis por URL, mas fora do menu por enquanto. */}
        <Route path="/" element={<Navigate to="/participantes" replace />} />
        <Route path="/participantes" element={<Participants />} />
        <Route path="/participantes/:id" element={<ParticipantDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apis" element={<Apis />} />
        <Route path="/certificacoes" element={<Certifications />} />
        <Route
          path="*"
          element={<div className="py-16 text-center">Página não encontrada.</div>}
        />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <DirectoryProvider>
      <ScrollToTop />
      <Layout>
        <AppContent />
      </Layout>
    </DirectoryProvider>
  )
}

export default App
