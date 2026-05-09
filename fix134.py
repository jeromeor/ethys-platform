with open("src/components/modules/CommandesClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

lines[362] = "              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer' }}>x</button>\n"

with open("src/components/modules/CommandesClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
