with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[71] = """  const updateAvancement = async (lotId: string, pct: number) => {
    const lot = selected?.lots.find(l => l.id === lotId)
    if (lot && pct < lot.avancement_pct) {
      const confirm = window.confirm(
        'Attention : vous essayez de réduire l\\'avancement. Un retour en arrière nécessite une validation admin. Voulez-vous soumettre une demande de correction ?'
      )
      if (!confirm) return
    }
    setUpdatingLot(lotId)
    const { error } = await supabase
      .from('lots')
      .update({ avancement_pct: pct })
      .eq('id', lotId)

    if (!error) {
      setCommandes(prev => prev.map(c => ({
        ...c,
        lots: c.lots.map(l => l.id === lotId ? { ...l, avancement_pct: pct } : l)
      })))
      if (selected) {
        setSelected(prev => prev ? {
          ...prev,
          lots: prev.lots.map(l => l.id === lotId ? { ...l, avancement_pct: pct } : l)
        } : null)
      }
    }
    setUpdatingLot(null)
  }\n"""

# Supprimer les anciennes lignes 73-92
del lines[72:92]

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
