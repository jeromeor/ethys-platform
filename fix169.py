with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "    const dataEncodee = qrCode.data_encodee as Record<string, unknown> ?? {}",
    "    const dataEncodee: Record<string, unknown> = typeof qrCode.data_encodee === 'string' ? JSON.parse(qrCode.data_encodee) : (qrCode.data_encodee as Record<string, unknown> ?? {})"
)

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
