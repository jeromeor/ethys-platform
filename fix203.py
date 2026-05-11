from PIL import Image
import os

img = Image.open('/mnt/user-data/uploads/Logo-ETHYS-small.png').convert('RGBA')
data = img.getdata()

new_data = []
for r, g, b, a in data:
    if r > 240 and g > 240 and b > 240:
        new_data.append((r, g, b, 0))  # transparent
    else:
        new_data.append((r, g, b, a))

img.putdata(new_data)
img.save('public/logo_ethys.png', 'PNG')
print("Done")
