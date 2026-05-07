content = open('fix51_content.txt', 'r', encoding='utf-8').read()
with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
