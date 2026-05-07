with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)'" in line:
        print(str(i+1) + ': ' + line.strip())
