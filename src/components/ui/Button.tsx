type ButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  variant?: "primaire" | "secondaire";
};

export default function Button({ label, onClick, active = false, variant = "secondaire" }: ButtonProps) {
  const isPrimaire = variant === "primaire";
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 6,
        border: isPrimaire ? 'none' : '1px solid #e8e3d8',
        background: active || isPrimaire ? '#1a1a1a' : '#fff',
        color: active || isPrimaire ? '#fff' : '#4a5568',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
