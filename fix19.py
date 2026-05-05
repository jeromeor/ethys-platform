with open('src/components/modules/ReportingClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('CA (EUR)', 'CA en euros')

with open('src/components/modules/ReportingClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
