with open('src/components/modules/CertificationClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[165] = "      setForm({ type_produit: 'fil', volume_recycle_kg: '', volume_vierge_kg: '', provenance_pays: '', filature_nom: '', filature_pays: '', tisseur_nom: '', description: '', declaration_honneur: false })\n"

with open('src/components/modules/CertificationClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
