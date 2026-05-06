with open('src/components/modules/CertificationClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter les zones apres les imports
zones_code = """
const ZONES: Record<string, number[]> = {
  'France': [1], 'Espagne': [1], 'Italie': [1], 'Portugal': [1],
  'Allemagne': [1], 'Belgique': [1], 'Pays-Bas': [1], 'Royaume-Uni': [1],
  'Suisse': [1], 'Autriche': [1], 'Pologne': [1], 'Roumanie': [1],
  'Turquie': [1, 5],
  'Maroc': [1, 4], 'Tunisie': [1, 4], 'Algerie': [1, 4], 'Egypte': [1, 4], 'Libye': [1, 4],
  'Senegal': [4], 'Mali': [4], 'Burkina Faso': [4], 'Cote Ivoire': [4],
  'Nigeria': [4], 'Ethiopie': [4], 'Kenya': [4], 'Tanzanie': [4],
  'Afrique du Sud': [4], 'Zimbabwe': [4], 'Mozambique': [4],
  'Etats-Unis': [2], 'Canada': [2], 'Mexique': [2],
  'Bresil': [3], 'Argentine': [3], 'Colombie': [3], 'Perou': [3],
  'Inde': [5], 'Bangladesh': [5], 'Chine': [5], 'Vietnam': [5],
  'Pakistan': [5], 'Indonesie': [5], 'Cambodge': [5], 'Myanmar': [5],
  'Sri Lanka': [5], 'Nepal': [5],
  'Australie': [6], 'Nouvelle-Zelande': [6],
}

const ZONE_LABELS: Record<number, string> = {
  1: 'Europe', 2: 'Amerique du Nord', 3: 'Amerique du Sud',
  4: 'Afrique', 5: 'Asie', 6: 'Oceanie',
}

const PAYS_CODES: Record<string, string> = {
  'France': 'FR', 'Espagne': 'ES', 'Italie': 'IT', 'Portugal': 'PT',
  'Allemagne': 'DE', 'Belgique': 'BE', 'Pays-Bas': 'NL', 'Royaume-Uni': 'GB',
  'Suisse': 'CH', 'Autriche': 'AT', 'Pologne': 'PL', 'Roumanie': 'RO',
  'Turquie': 'TR', 'Maroc': 'MA', 'Tunisie': 'TN', 'Algerie': 'DZ',
  'Egypte': 'EG', 'Libye': 'LY', 'Senegal': 'SN', 'Mali': 'ML',
  'Nigeria': 'NG', 'Ethiopie': 'ET', 'Kenya': 'KE', 'Afrique du Sud': 'ZA',
  'Etats-Unis': 'US', 'Canada': 'CA', 'Mexique': 'MX',
  'Bresil': 'BR', 'Argentine': 'AR', 'Colombie': 'CO', 'Perou': 'PE',
  'Inde': 'IN', 'Bangladesh': 'BD', 'Chine': 'CN', 'Vietnam': 'VN',
  'Pakistan': 'PK', 'Indonesie': 'ID', 'Cambodge': 'KH',
  'Australie': 'AU', 'Nouvelle-Zelande': 'NZ',
}

const zonesCompatibles = (pays1: string, pays2: string): boolean => {
  const z1 = ZONES[pays1] ?? []
  const z2 = ZONES[pays2] ?? []
  return z1.some(z => z2.includes(z))
}

const getZoneLabel = (pays: string): string => {
  const zones = ZONES[pays]
  if (!zones) return 'Zone inconnue'
  return zones.map(z => ZONE_LABELS[z]).join(' / ')
}

"""

# Inserer apres les imports
content = content.replace(
    "interface Declaration {",
    zones_code + "interface Declaration {"
)

with open('src/components/modules/CertificationClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
