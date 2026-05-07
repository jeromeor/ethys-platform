with open('src/components/modules/AdminClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Deplacer le bouton + Inviter dans la barre d onglets
# Supprimer les lignes 213-214 (flex spacer et bouton)
lines[212] = ""  # <div style={{ flex: 1 }} />
lines[213] = ""  # bouton + Inviter

# Ajouter le bouton dans la barre d onglets avant la fermeture
lines[211] = """        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowInvite(true)} style={{ margin: '4px 0', padding: '5px 12px', borderRadius: 8, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'center' }}>+ Inviter</button>
      </div>\n"""

with open('src/components/modules/AdminClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
