with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[17] = "  { icon: '\u26a1', label: 'Certification', route: '/certification' },\n  { icon: '\u2699', label: 'Admin',        route: '/admin' },\n"

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
