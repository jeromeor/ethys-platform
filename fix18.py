with open('src/components/modules/ReportingClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('CA (\u20ac)', 'CA (EUR)')

with open('src/components/modules/ReportingClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
