import { useEffect, useState } from 'react'
import MarkdownContent from '../components/MarkdownContent'
import { loadMarkdown } from '../utils/loadMarkdown'

export default function Home() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMarkdown('/')
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(() => {
        setContent(`# Sirius

Sirius est une couche AI × DATA d'observabilité, de gouvernance et d'attestation qui s'intègre au-dessus d'un système de stockage distribué.

[Voir la documentation complète...]`)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div>Chargement...</div>
  }

  return <MarkdownContent content={content} />
}

