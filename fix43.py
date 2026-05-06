with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Supprimer les lignes dupliquees 95-96 (if !selected et setGenerating)
del lines[94]  # if (!selected) return
del lines[94]  # setGenerating(true)
del lines[94]  # const reference = ...

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
