with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'GénérerQR' in line or 'G\u00e9n\u00e9rerQR' in line:
        print(str(i+1) + ': ' + line.strip())
