with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "      {/* Table */}\n      <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>",
    "      {/* Table */}\n      {activeTab === 'factures' && <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>"
)

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
