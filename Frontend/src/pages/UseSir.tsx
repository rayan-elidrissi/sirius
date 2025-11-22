import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UseSir() {
  const navigate = useNavigate()

  // Redirect to Sirius landing immediately
  useEffect(() => {
    navigate('/sirius')
  }, [navigate])

  // This page just redirects to /sirius now
  return null
}

