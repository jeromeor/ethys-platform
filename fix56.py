with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if i < len(lines) and "const { data } = await sb.from('qr_codes').insert({" in lines[i]:
        lines[i] = "                    const { data: qrData, error: qrError } = await sb.from('qr_codes').insert({\n"
    if i < len(lines) and "}).select().single()" in lines[i] and i > 440:
        lines[i] = "                    }).select().single()\n"
    if i < len(lines) and ".then(({ data, error }) => {" in lines[i]:
        lines[i] = "                    console.log('QR result:', qrData, qrError?.message)\n"
    if i < len(lines) and "console.log('QR insert result:', data, error?.message)" in lines[i]:
        lines[i] = ""
    if i < len(lines) and "if (data) window.location.reload()" in lines[i] and i > 440:
        lines[i] = "                    if (qrData) window.location.reload()\n"
    if i < len(lines) and "else console.error('Insert failed:', error)" in lines[i]:
        lines[i] = "                    else console.error('Insert failed:', qrError)\n"
    if i < len(lines) and "})" in lines[i] and i > 458 and i < 465:
        lines[i] = ""

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
