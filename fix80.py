with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter useRef import
content = content.replace(
    "import { useState } from 'react'",
    "import { useState, useEffect, useRef } from 'react'"
)

# Ajouter le ref et le useEffect apres le state showUserMenu
content = content.replace(
    "const [showUserMenu, setShowUserMenu] = useState(false)",
    """const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])"""
)

# Ajouter le ref sur le div du menu utilisateur
content = content.replace(
    '<div style={{ fontSize: 12, color: \'#94A3B8\', position: \'relative\' }}>',
    '<div ref={userMenuRef} style={{ fontSize: 12, color: \'#94A3B8\', position: \'relative\' }}>'
)

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
