with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fermer le div avant </header>
lines[120] = "          </div>\n        </header>\n"

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
