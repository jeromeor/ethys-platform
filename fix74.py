with open('src/components/modules/AdminClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[210] = "          }}>{t}</button>\n"
lines[211] = "        ))}\n"

with open('src/components/modules/AdminClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
