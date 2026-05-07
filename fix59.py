with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

del lines[459]  # },
del lines[459]  # console.log QR result
del lines[459]  # else console.error Insert failed

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
