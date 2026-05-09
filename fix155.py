with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Ajouter state pour onglet actif
for i, line in enumerate(lines):
    if "const [loading, setLoading] = useState(false)" in line:
        lines[i] = line + "  const [activeTab, setActiveTab] = useState<'factures' | 'accords'>('factures')\n"
        break

# Ajouter bouton Accords commerciaux et onglets dans la barre outils (ligne 250)
for i, line in enumerate(lines):
    if "Nouvelle facture" in line and "button" in line:
        lines[i] = """        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <button onClick={() => setActiveTab(activeTab === 'accords' ? 'factures' : 'accords')} style={{
              padding: '7px 14px', borderRadius: 8, border: '1.5px solid #0A3D26',
              background: activeTab === 'accords' ? '#0A3D26' : '#fff',
              color: activeTab === 'accords' ? '#fff' : '#0A3D26', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}>\u2605 Accords commerciaux</button>
          )}
          <button onClick={() => setShowForm(true)} style={{
            padding: '7px 14px', borderRadius: 8, border: 'none',
            background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
          }}>\uff0b Nouvelle facture</button>
        </div>\n"""
        break

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
