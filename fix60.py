with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer la liste verticale par une grille
old = """.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #EEF0F3' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: label === 'Certification fil' ? '#D1FAE5' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                {label === 'Certification fil' ? 'E' : label === 'Filature' ? 'F' : label === 'Origine matiere' ? 'O' : label === 'Marque' ? 'M' : label === 'Volume total' ? 'V' : 'C'}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{label}</div>
                <div style={{ fontSize: 11, color: label === 'Certification fil' ? '#065F46' : '#64748B', fontWeight: label === 'Certification fil' ? 700 : 400 }}>{value}</div>
              </div>
            </div>
          ))"""

new = """.map(({ label, value }) => (
            <div key={label} style={{ padding: '12px 14px', borderRadius: 10, background: label === 'Certification fil' ? '#F0FDF4' : '#F8FAFC', border: '1px solid #EEF0F3', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: label === 'Certification fil' ? '#065F46' : '#1A202C' }}>{value}</div>
            </div>
          ))"""

# Remplacer la div conteneur par une grille
old_wrap = '<div style={{ maxWidth: 480, margin: \'0 auto\', padding: \'24px\' }}>'
new_wrap = '<div style={{ maxWidth: 480, margin: \'0 auto\', padding: \'24px\' }}><div style={{ display: \'grid\', gridTemplateColumns: \'1fr 1fr\', gap: 10, marginBottom: 16 }}>'

content = content.replace(old, new)
content = content.replace(old_wrap, new_wrap)

# Fermer la grille avant le bloc scan
content = content.replace(
    '<div style={{ marginTop: 20, padding: \'14px\'',
    '</div><div style={{ marginTop: 20, padding: \'14px\''
)

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
