with open("src/components/modules/MessagerieClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Verifier que la mise a jour lu=true est bien persistee
lines[93] = "    if (nonLus.length > 0) {\n"
lines[94] = "      const { error } = await supabase.from('messages').update({ lu: true }).in('id', nonLus)\n"
lines[95] = "      if (!error) {\n"
lines[96] = "        setMessages(prev => prev.map(m => nonLus.includes(m.id) ? { ...m, lu: true } : m))\n"

# Inserer la fermeture de if error
lines.insert(97, "      }\n")

with open("src/components/modules/MessagerieClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
