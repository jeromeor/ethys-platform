// Conversion tonnes vers kg pour affichage
export function tToKg(tonnes: number | null | undefined): string {
  if (tonnes == null) return '-'
  const kg = Math.round(tonnes * 1000)
  if (kg >= 1000) {
    return new Intl.NumberFormat('fr-FR').format(kg) + ' kg'
  }
  return kg + ' kg'
}

export function tToKgRaw(tonnes: number | null | undefined): number {
  if (tonnes == null) return 0
  return Math.round(tonnes * 1000)
}
