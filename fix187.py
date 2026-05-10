with open("src/components/modules/QRCodeClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Supprimer la ligne dupliquee 430 (index 429)
if "selectedCert.qr_codes?.length > 0 ? (" in lines[429]:
    del lines[429]
    print("Deleted duplicate line")

with open("src/components/modules/QRCodeClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
