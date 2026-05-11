with open("src/app/(dashboard)/dashboard/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# KPI chiffres en noir sauf ESG
content = content.replace(
    "fontSize: 28, fontWeight: 800, color: '#2d5016'",
    "fontSize: 28, fontWeight: 800, color: '#1a1a1a'"
)
content = content.replace(
    "fontSize: 28, fontWeight: 800, color: '#1E40AF'",
    "fontSize: 28, fontWeight: 800, color: '#1a1a1a'"
)

with open("src/app/(dashboard)/dashboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
