content = open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8').read()

# Remplacer les icones emoji par des SVG inline simples
# et mettre a jour les couleurs

new_nav = """const navItems = [
  { icon: 'grid', label: 'Dashboard',    route: '/dashboard' },
  { icon: 'user', label: 'Profil',       route: '/profil' },
  { icon: 'book', label: 'Annuaire',     route: '/annuaire' },
  { icon: 'mail', label: 'Messagerie',   route: '/messagerie' },
  { icon: 'box', label: 'Commandes',    route: '/commandes' },
  { icon: 'tool', label: 'Production',   route: '/production' },
  { icon: 'qr', label: 'QR Code',      route: '/qrcode' },
  { icon: 'file', label: 'Facturation',  route: '/facturation' },
  { icon: 'bar', label: 'Reporting',    route: '/reporting' },
  { icon: 'leaf', label: 'ESG',          route: '/esg' },
  { icon: 'star', label: 'Certification', route: '/certification' },
  { icon: 'gear', label: 'Admin',        route: '/admin' },
]"""

old_nav = """const navItems = [
  { icon: '\u229e', label: 'Dashboard',    route: '/dashboard' },
  { icon: '\u25ce', label: 'Profil',       route: '/profil' },
  { icon: '\u2295', label: 'Annuaire',     route: '/annuaire' },
  { icon: '\u2709', label: 'Messagerie',   route: '/messagerie' },
  { icon: '\u25c8', label: 'Commandes',    route: '/commandes' },
  { icon: '\u2b21', label: 'Production',   route: '/production' },
  { icon: '\u25a3', label: 'QR Code',      route: '/qrcode' },
  { icon: '\u25eb', label: 'Facturation',  route: '/facturation' },
  { icon: '\u25c9', label: 'Reporting',    route: '/reporting' },
  { icon: '\u25e6', label: 'ESG',          route: '/esg' },
  { icon: '\u26a1', label: 'Certification', route: '/certification' },
  { icon: '\u2699', label: 'Admin',        route: '/admin' },
]"""

content = content.replace(old_nav, new_nav)
open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8').write(content)
print("Done")
