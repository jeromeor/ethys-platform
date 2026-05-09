with open("src/components/modules/CertificationClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "                  {userRole === 'marque' && <option value=\"tissu\">Tissu ETHYS</option>}\n                  {userRole === 'marque' && <option value=\"produit_fini\">Produit fini ETHYS</option>}",
    "                  {userRole === 'marque' && <option value=\"fil\">Fil ETHYS</option>}\n                  {userRole === 'marque' && <option value=\"tissu\">Tissu ETHYS</option>}\n                  {userRole === 'marque' && <option value=\"produit_fini\">Produit fini ETHYS</option>}"
)

with open("src/components/modules/CertificationClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
