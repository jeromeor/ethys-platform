with open('src/components/modules/CertificationClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Bloc 51% recycle - fond vert -> ocre
content = content.replace(
    "flex: d.pct_recycle, background: '#2d5016', borderRadius: 8",
    "flex: d.pct_recycle, background: '#8b7355', borderRadius: 4"
)

# Titre certification obtenue
content = content.replace(
    "fontSize: 14, fontWeight: 900, color: '#2d5016', marginBottom: 8, textAlign: 'center'",
    "fontSize: 14, fontWeight: 900, color: '#c2956e', marginBottom: 8, textAlign: 'center'"
)

# Numero certification
content = content.replace(
    "fontSize: 12, color: '#2d5016', fontWeight: 700",
    "fontSize: 12, color: '#1a1a1a', fontWeight: 700"
)

# Barre de progression eligible
content = content.replace(
    "background: d.eligible_ethys ? '#2d5016' : '#F59E0B'",
    "background: d.eligible_ethys ? '#8b7355' : '#b8860b'"
)
content = content.replace(
    "background: eligible ? '#2d5016' : '#F59E0B'",
    "background: eligible ? '#8b7355' : '#b8860b'"
)

# Textes eligible
content = content.replace(
    "color: d.eligible_ethys ? '#2d5016' : '#b8860b'",
    "color: d.eligible_ethys ? '#2d5016' : '#b8860b'"
)
content = content.replace(
    "color: eligible ? '#2d5016' : '#b8860b'",
    "color: eligible ? '#2d5016' : '#b8860b'"
)

# Fond certification obtenue - vert -> lin
content = content.replace(
    "certifiee:      ['#f0f4ec', '#2d5016']",
    "certifiee:      ['#f5f3ef', '#1a1a1a']"
)

with open('src/components/modules/CertificationClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
