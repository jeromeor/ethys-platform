type ButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  variant?: "primaire" | "toggle";
};

export default function Button({ label, onClick, active = false, variant = "primaire" }: ButtonProps) {
  if (variant === "toggle") {
    return (
      <button onClick={onClick} style={{
        padding: '7px 14px', borderRadius: 8, border: '1.5px solid #1a1a1a',
        background: active ? '#1a1a1a' : '#fff',
        color: active ? '#fff' : '#1a1a1a', fontSize: 12, fontWeight: 700, cursor: 'pointer'
      }}>{label}</button>
    );
  }
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 8, border: 'none',
      background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
    }}>{label}</button>
  );
}
