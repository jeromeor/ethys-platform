import glob, os

files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'contact@textile-loop.com' in content:
            content = content.replace('contact@textile-loop.com', 'contact@ethys-textileloop.com')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")
    except:
        pass
print("Done")
