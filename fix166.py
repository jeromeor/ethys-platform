with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "const pctRecycl\u00e9 = Number(decl?.pct_recycl\u00e9 ?? 51)",
    "const pctRecycl\u00e9 = Number(decl?.pct_recycle ?? 51)"
)

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
