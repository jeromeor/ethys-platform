with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Reduire padding header et logo plus grand
content = content.replace(
    "background: '#1a1a1a', padding: '32px 24px', color: '#fff'",
    "background: '#1a1a1a', padding: '20px 24px 24px', color: '#fff'"
)

# Logo plus grand
content = content.replace(
    "width: 80, height: 'auto', filter: 'invert(1)', flexShrink: 0, marginTop: 4",
    "width: 100, height: 'auto', filter: 'invert(1)', flexShrink: 0"
)

# Aligner logo verticalement au centre
content = content.replace(
    "justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20",
    "justifyContent: 'space-between', alignItems: 'center', marginBottom: 16"
)

# Reduire la marge sous le titre
content = content.replace(
    "fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 4",
    "fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 2"
)

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
