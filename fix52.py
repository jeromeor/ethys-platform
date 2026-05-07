with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const { createClient } = await import('@/lib/supabase/client')" in line:
        lines[i] = ''
    if 'const sb = createClient()' in line:
        lines[i] = line.replace('const sb = createClient()', 'const sb = supabase')

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
