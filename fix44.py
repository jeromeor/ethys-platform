with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[66] = "  const [source, setSource] = useState<'lots' | 'certs'>(certificationIdActif ? 'certs' : 'lots')\n"
lines.insert(67, "  console.log('certifications:', certifications?.length)\n")

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
