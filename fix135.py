with open("src/components/modules/ReportingClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter LabelList dans les imports
content = content.replace(
    "BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,",
    "BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, LabelList,"
)

# Ajouter LabelList sur le graphique volumes
content = content.replace(
    '<Bar dataKey="volume" name="Volume (T)" fill="#0A3D26" radius={[4, 4, 0, 0]} />',
    '<Bar dataKey="volume" name="Volume (milliers de kg)" fill="#0A3D26" radius={[4, 4, 0, 0]}><LabelList dataKey="volume" position="top" style={{ fontSize: 10, fill: \'#475569\', fontWeight: 600 }} formatter={(v: number) => v > 0 ? `${Math.round(v * 1000).toLocaleString(\'fr-FR\')} kg` : \'\'} /></Bar>'
)

# Ajouter LabelList sur le graphique CA
content = content.replace(
    '<Bar dataKey="ca" name="CA en euros" fill="#0A3D26" radius={[6, 6, 0, 0]} />',
    '<Bar dataKey="ca" name="CA en euros" fill="#0A3D26" radius={[6, 6, 0, 0]}><LabelList dataKey="ca" position="top" style={{ fontSize: 10, fill: \'#475569\', fontWeight: 600 }} formatter={(v: number) => v > 0 ? `${v.toLocaleString(\'fr-FR\', { style: \'currency\', currency: \'EUR\', maximumFractionDigits: 0 })}` : \'\'} /></Bar>'
)

with open("src/components/modules/ReportingClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
