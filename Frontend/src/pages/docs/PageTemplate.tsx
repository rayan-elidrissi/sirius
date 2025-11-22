import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import MarkdownContent from '../components/MarkdownContent'
import { loadMarkdown } from '../utils/loadMarkdown'

interface PageTemplateProps {
  basePath: string
}

export default function PageTemplate({ basePath }: PageTemplateProps) {
  const { '*': path } = useParams()
  const location = useLocation()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fullPath = path 
      ? `${basePath}/${path}`
      : basePath
    
    loadMarkdown(fullPath)
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(() => {
        setContent(`# Page non trouvée

Cette page est en cours de développement : ${fullPath}`)
        setLoading(false)
      })
  }, [path, basePath, location.pathname])

  if (loading) {
    return <div>Chargement...</div>
  }

  return <MarkdownContent content={content} />
}

