import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import SuiWalletProvider from './providers/SuiWalletProvider'
import Header from '../components/Header'
import Home from './pages/Home'
import About from './pages/About'
import Docs from './pages/Docs'
import UseSir from './pages/UseSir'
import BlobDetails from './pages/BlobDetails'
import SiriusLanding from './pages/SiriusLanding'
import Dashboard from './pages/Dashboard'
import ProjectDetails from './pages/ProjectDetails'

function AppContent() {
  const location = useLocation()
  const isBlobDetailsPage = location.pathname.startsWith('/blob/')
  const isSiriusPage = location.pathname.startsWith('/sirius') || 
                       location.pathname.startsWith('/dashboard') ||
                       location.pathname.startsWith('/project')

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {!isBlobDetailsPage && !isSiriusPage && <Header />}
      <div className={`flex-1 overflow-y-auto ${(!isBlobDetailsPage && !isSiriusPage) ? 'pt-20 md:pt-24' : ''}`}>
        <Routes>
          {/* Original routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/use-sir" element={<UseSir />} />
          <Route path="/blob/:blobId" element={<BlobDetails />} />
          
          {/* New Sirius routes */}
          <Route path="/sirius" element={<SiriusLanding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/project/:projectId" element={<ProjectDetails />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <SuiWalletProvider>
      <Router>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#97F0E5',
                secondary: '#161923',
              },
            },
          }}
        />
      </Router>
    </SuiWalletProvider>
  )
}

export default App

