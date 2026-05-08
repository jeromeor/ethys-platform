with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Trouver la fonction qui contient l update
for i in range(68, 92):
    print(str(i+1) + ': ' + lines[i].rstrip())
