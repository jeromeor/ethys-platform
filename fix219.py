import glob

files = glob.glob('src/components/modules/*.tsx')

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    
    # Supprimer tous les emojis restants
    import re
    # Emojis courants
    emojis = ['\U0001f3c6', '\u267b', '\U0001f33f', '\u2605', '\u26a1', 
              '\u2699', '\U0001f4cb', '\u2713', '\u2714', '\u26a0',
              '\u2728', '\U0001f4b0', '\U0001f4c8', '\U0001f4ca',
              '\U0001f310', '\U0001f4e7', '\u23f3', '\U0001f3c5']
    for emoji in emojis:
        content = content.replace(emoji, '')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

print("Done")
