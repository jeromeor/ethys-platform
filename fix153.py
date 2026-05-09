with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter l interface AccordCommercial
content = content.replace(
    "interface Entreprise { id: string; nom: string; type: string }",
    """interface Entreprise { id: string; nom: string; type: string }

interface AccordCommercial {
  id: string
  entreprise_id: string
  prix_base_kg: number
  remise_volume_annuel_pct: number
  seuil_volume_annuel_tonnes: number
  date_debut: string
  date_fin: string | null
  notes: string | null
  entreprise: { nom: string } | null
}"""
)

# Ajouter accords et profil dans Props
content = content.replace(
    "interface Props {\n  factures: Facture[]\n  commandes: Commande[]\n  entreprises: Entreprise[]\n  user: { id: string }\n}",
    """interface Props {
  factures: Facture[]
  commandes: Commande[]
  entreprises: Entreprise[]
  accords: AccordCommercial[]
  profil: { role: string; entreprise_id: string }
  user: { id: string }
}"""
)

# Mettre a jour la signature de la fonction
content = content.replace(
    "export default function FacturationClient({ factures: initial, commandes, entreprises, user }: Props) {",
    "export default function FacturationClient({ factures: initial, commandes, entreprises, accords: accordsInitial, profil, user }: Props) {"
)

# Ajouter les states pour accords
content = content.replace(
    "  const [loading, setLoading] = useState(false)",
    """  const [loading, setLoading] = useState(false)
  const [accords, setAccords] = useState<AccordCommercial[]>(accordsInitial)
  const [showAccordForm, setShowAccordForm] = useState(false)
  const [accordForm, setAccordForm] = useState({
    entreprise_id: '',
    prix_base_kg: '0.60',
    remise_volume_annuel_pct: '0',
    seuil_volume_annuel_tonnes: '0',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    notes: ''
  })
  const isAdmin = profil.role === 'admin'"""
)

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
