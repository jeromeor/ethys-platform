with open("src/components/modules/ReportingClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter margin top au BarChart volumes
content = content.replace(
    '<BarChart data={parMois}>\n                <CartesianGrid',
    '<BarChart data={parMois} margin={{ top: 25, right: 10, left: 10, bottom: 0 }}>\n                <CartesianGrid'
)

# Meme chose pour le graphique CA
content = content.replace(
    '<BarChart data={parMois} margin={{ top: 25',
    '<BarChart data={parMois} margin={{ top: 30'
)

with open("src/components/modules/ReportingClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
