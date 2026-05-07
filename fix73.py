with open('src/components/modules/AdminClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Ligne 211 contient maintenant ")}" en double - supprimer le premier
lines[210] = "        )}\n"  # fermeture du map TABS - enlever le premier ))}

with open('src/components/modules/AdminClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
