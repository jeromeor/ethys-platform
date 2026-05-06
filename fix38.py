with open('src/components/modules/CertificationClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines.append("    </div>\n")
lines.append("  )\n")
lines.append("}\n")

with open('src/components/modules/CertificationClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
