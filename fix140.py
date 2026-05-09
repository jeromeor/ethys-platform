with open("src/components/modules/ReportingClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

lines[145] = '                  <BarChart data={parMois} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>\n'
lines[274] = '                <BarChart data={parMois} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>\n'

with open("src/components/modules/ReportingClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
