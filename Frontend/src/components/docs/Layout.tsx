import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

