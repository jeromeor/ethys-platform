with open("src/components/modules/QRCodeClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "Ce fil est le r\u00e9sultat de la transformation de coton recycl\u00e9 et vierge par {selected.commande?.filature?.nom ?? 'la filature'}, certifi\u00e9 par la plateforme TEXTILE LOOP.",
    "Ce fil certifi\u00e9 ETHYS est le r\u00e9sultat de la transformation de coton recycl\u00e9 (51\u00a0%) et de coton vierge (49\u00a0%). Il a \u00e9t\u00e9 r\u00e9alis\u00e9 par {selected.commande?.filature?.nom ?? 'la filature'}."
)

with open("src/components/modules/QRCodeClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
