with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[87] = "          <div style={{ fontSize: 13, fontWeight: 600, color: '#0A3D26' }}>\n"
lines[88] = "            {navItems.find(n => pathname === n.route || pathname.startsWith(n.route + '/'))?.label ?? 'Dashboard'}\n          </div>\n"
lines[89] = "          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>\n"
lines[90] = "            <NotificationBell userId={profil?.id ?? ''} />\n"
lines[91] = "            <div style={{ fontSize: 12, color: '#94A3B8', position: 'relative' }}>\n"
# Supprimer les lignes parasites
del lines[92]  # ancienne div flex

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
