import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkBreaks from 'remark-breaks'
import './MarkdownContent.css'
import 'highlight.js/styles/github-dark.css'

interface MarkdownContentProps {
  content: string
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <pre className="markdown-code-block">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="markdown-code-inline" {...props}>
                {children}
              </code>
            )
          },
          blockquote: ({ node, children, ...props }: any) => {
            const content = String(children).toLowerCase();
            const isWarning = content.includes('public access') || content.includes('danger') || content.includes('warning');
            return (
              <blockquote className={`markdown-blockquote ${isWarning ? 'markdown-warning' : ''}`} {...props}>
                {children}
              </blockquote>
            );
          },
          table: ({ node, ...props }) => (
            <div className="markdown-table-wrapper">
              <table className="markdown-table" {...props} />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

