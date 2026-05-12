with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "<button onClick={() => setOpen(v => !v)}",
    """      {open && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid #e8e3d8' }}>
          <a href="/mentions-legales" style={{ fontSize: 10, color: '#d4c5b0', textDecoration: 'none', display: 'block', textAlign: 'center' }}>Mentions légales & RGPD</a>
        </div>
      )}
      <button onClick={() => setOpen(v => !v)}"""
)

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done sidebar")
