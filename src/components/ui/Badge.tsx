import { COLORS } from "@/lib/theme";

type BadgeProps = {
  label: string;
  background: string;
  color: string;
};

// Badge statut réutilisable (factures, tickets, entreprises, etc.)
export default function Badge({ label, background, color }: BadgeProps) {
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background, color }}>
      {label}
    </span>
  );
}

export { COLORS };
