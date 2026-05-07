with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[88] = "          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>\n          <NotificationBell userId={profil?.id ?? ''} />\n" + lines[88]

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
