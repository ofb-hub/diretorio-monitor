import { Navigate, Route, Routes } from 'react-router-dom'
import { DirectoryProvider, useDirectory } from './lib/DirectoryContext'
import { Layout } from './components/Layout'
import { ErrorState, Spinner } from './components/ui'
import { Dashboard } from './pages/Dashboard'
import { Participants } from './pages/Participants'
import { ParticipantDetail } from './pages/ParticipantDetail'
import { Apis } from './pages/Apis'
import { Certifications } from './pages/Certifications'

function AppContent() {
  const { loading, error, organisations, refresh } = useDirectory()

  if (loading && organisations.length === 0) {
    return <Spinner label="Carregando diretório do Open Finance Brasil…" />
  }
  if (error && organisations.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />
  }

  return (
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
  )
}

function App() {
  return (
    <DirectoryProvider>
      <Layout>
        <AppContent />
      </Layout>
    </DirectoryProvider>
  )
}

export default App
