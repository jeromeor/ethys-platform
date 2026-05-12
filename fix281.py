for f in ['src/app/(auth)/login/page.tsx','src/app/(auth)/register/page.tsx','src/app/mentions-legales/page.tsx']:
    c = open(f,'r',encoding='utf-8').read()
    ouv = c.count('<a href="/login">')
    ferm = c.count('</a>')
    print(f, '- ouv:', ouv, 'ferm:', ferm)
