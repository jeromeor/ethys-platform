with open('src/components/modules/CommandesClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[40] = "  soumise:                'Soumise',\n"

with open('src/components/modules/CommandesClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
