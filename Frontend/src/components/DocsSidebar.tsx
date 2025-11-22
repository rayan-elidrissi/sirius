import { useState } from 'react'

interface MenuItem {
  id: string
  label: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    id: 'sirius',
    label: 'Documentation',
    children: [
      { id: 'the-problem', label: 'The Problem' },
      { id: 'our-solution', label: 'Our Solution' },
      {
        id: 'architecture',
        label: 'Architecture',
        children: [
          { id: 'data-layer', label: 'Data Layer' },
          { id: 'ai-layer', label: 'AI Layer' },
          { id: 'on-chain-anchoring', label: 'On-chain Anchoring' },
          { id: 'user-dashboard', label: 'User Dashboard' },
        ],
      },
      { id: 'reputation-consensus', label: 'Reputation and Snapshot Consensus' },
      { id: 'reproducibility-receipts', label: 'Reproducibility Receipts' },
      { id: 'key-advantages', label: 'Key Advantages' },
      { id: 'performance-indicators', label: 'Performance Indicators' },
      { id: 'organization', label: 'Organization' },
    ],
  },
]

interface MenuItemComponentProps {
  item: MenuItem
  level?: number
}

function MenuItemComponent({ item, level = 0 }: MenuItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0)

  const hasChildren = item.children && item.children.length > 0

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault()
      setIsExpanded(!isExpanded)
    } else {
      e.preventDefault()
      // Smooth scroll to section with offset for header
      const element = document.getElementById(item.id)
      if (element) {
        // Find the scrollable container (from App.tsx)
        const scrollContainer = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement
        const headerOffset = 7.5 * 16 // 7.5rem in pixels
        
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect()
          const elementRect = element.getBoundingClientRect()
          const scrollTop = scrollContainer.scrollTop
          const targetPosition = elementRect.top - containerRect.top + scrollTop - headerOffset
          
          scrollContainer.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          })
        } else {
          // Fallback to window scroll
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }
    }
  }

  return (
    <div className="menu-item-wrapper">
      <a
        href={`#${item.id}`}
        onClick={handleClick}
        className="menu-item-link"
        rel="noreferrer"
      >
        <li role="none" className="menu-item-label-wrapper">
          <div className="menu-item-chevron-wrapper">
            {hasChildren ? (
              <svg
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`chevron-icon ${isExpanded ? 'expanded' : ''}`}
              >
                <path
                  d={isExpanded ? 'M8 10.9998L3 5.9998L3.7 5.2998L8 9.5998L12.3 5.2998L13 5.9998L8 10.9998Z' : 'M11 8L6.00002 13L5.30002 12.3L9.60002 8L5.30002 3.7L6.00002 3L11 8Z'}
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="chevron-icon chevron-right"
              >
                <path
                  d="M11 8L6.00002 13L5.30002 12.3L9.60002 8L5.30002 3.7L6.00002 3L11 8Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </div>
          <div className="menu-item-label-text-wrapper">
            <span className="menu-item-label">{item.label}</span>
          </div>
        </li>
      </a>
      {hasChildren && (
        <div
          className="menu-item-nested-wrapper"
          style={{
            height: isExpanded ? 'auto' : '0px',
            pointerEvents: isExpanded ? 'auto' : 'none',
            overflow: isExpanded ? 'visible' : 'hidden',
            display: isExpanded ? 'block' : 'none',
          }}
        >
          <ul className="menu-wrapper">
            {item.children.map((child) => (
              <MenuItemComponent key={child.id} item={child} level={level + 1} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function DocsSidebar() {
  return (
    <aside className="docs-sidebar">
      <div className="menu-container">
        <ul className="menu-wrapper">
          {menuItems.map((item) => (
            <MenuItemComponent key={item.id} item={item} />
          ))}
        </ul>
      </div>
    </aside>
  )
}

