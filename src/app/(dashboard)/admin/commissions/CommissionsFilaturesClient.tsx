"use client";

import { useState } from "react";
import { COLORS } from "@/lib/theme";
import Button from "@/components/ui/Button";

type Niveau = "standard" | "partenaire" | "privilege";

interface Filature {
  id: string;
  nom: string;
  niveau: Niveau | null;
  personnalise: boolean | null;
  tranches_personnalisees: unknown;
}

interface Tranche {
  niveau: Niveau;
  tranche_min: number;
  tranche_max: number | null;
  taux_eur_kg: number;
}

const NIVEAUX_LABELS: Record<Niveau, string> = {
  standard: "Standard",
  partenaire: "Partenaire",
  privilege: "Privilège",
};

export default function CommissionsFilaturesClient({
  filatures,
  defauts,
}: {
  filatures: Filature[];
  defauts: Tranche[];
}) {
  const [filatureId, setFilatureId] = useState("");
  const [filatureNom, setFilatureNom] = useState("");
  const [niveau, setNiveau] = useState<Niveau>("standard");
  const [personnalise, setPersonnalise] = useState(false);
  const [tranches, setTranches] = useState<Tranche[]>(
    defauts.filter((d) => d.niveau === "standard")
  );
  const [message, setMessage] = useState("");

  // Sélection via le champ texte (autocomplétion native par datalist)
  function handleFilatureInput(nom: string) {
    setFilatureNom(nom);
    const f = filatures.find((f) => f.nom === nom);
    if (!f) {
      setFilatureId("");
      return;
    }

    setFilatureId(f.id);
    const niveauActuel = f.niveau ?? "standard";
    setNiveau(niveauActuel);
    setPersonnalise(f.personnalise ?? false);

    let tranchesPerso = f.tranches_personnalisees;
    if (typeof tranchesPerso === "string") {
      try {
        tranchesPerso = JSON.parse(tranchesPerso);
      } catch {
        tranchesPerso = null;
      }
    }

    if (f.personnalise && Array.isArray(tranchesPerso)) {
      setTranches(tranchesPerso as Tranche[]);
    } else {
      setTranches(defauts.filter((d) => d.niveau === niveauActuel));
    }
  }

  function handleNiveauChange(n: Niveau) {
    setNiveau(n);
    if (!personnalise) {
      setTranches(defauts.filter((d) => d.niveau === n));
    }
  }

  async function handleSubmit() {
    if (!filatureId) return;
    setMessage("");
    const res = await fetch("/api/commissions-filatures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filature_id: filatureId,
        niveau,
        personnalise,
        tranches_personnalisees: personnalise ? tranches : null,
      }),
    });

    if (res.ok) {
      setMessage("Barème mis à jour");
    } else {
      const data = await res.json();
      setMessage("Erreur : " + data.error);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.noir,
  };

  const inputStyle: React.CSSProperties = {
    border: `1.5px solid ${COLORS.bordure}`,
    borderRadius: 8,
    padding: "10px 12px",
    width: "100%",
    fontSize: 14,
    color: COLORS.noir,
    background: "#fff",
    marginBottom: 20,
    boxSizing: "border-box",
  };

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.noir, marginBottom: 20 }}>
        Commissions filatures
      </h1>

      <label style={labelStyle}>Filature</label>
      <input
        list="filatures-list"
        style={inputStyle}
        placeholder="Tape pour rechercher..."
        value={filatureNom}
        onChange={(e) => handleFilatureInput(e.target.value)}
      />
      <datalist id="filatures-list">
        {filatures.map((f) => (
          <option key={f.id} value={f.nom} />
        ))}
      </datalist>

      <label style={labelStyle}>Niveau</label>
      <select
        style={inputStyle}
        value={niveau}
        onChange={(e) => handleNiveauChange(e.target.value as Niveau)}
      >
        <option value="standard">Standard</option>
        <option value="partenaire">Partenaire</option>
        <option value="privilege">Privilège</option>
      </select>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: COLORS.noir }}>
        <input
          type="checkbox"
          checked={personnalise}
          onChange={(e) => setPersonnalise(e.target.checked)}
        />
        Tarif personnalisé (forcé, hors barème standard du niveau)
      </label>

      {personnalise && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 10px", background: COLORS.creme, color: COLORS.noir, fontSize: 12, fontWeight: 700, borderBottom: `2px solid ${COLORS.bordure}` }}>
                Tranche
              </th>
              <th style={{ textAlign: "left", padding: "8px 10px", background: COLORS.creme, color: COLORS.noir, fontSize: 12, fontWeight: 700, borderBottom: `2px solid ${COLORS.bordure}` }}>
                Taux €/kg
              </th>
            </tr>
          </thead>
          <tbody>
            {tranches.map((t, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.bordure}` }}>
                <td style={{ padding: "10px" }}>
                  {t.tranche_min} - {t.tranche_max ?? "∞"} t
                </td>
                <td style={{ padding: "10px" }}>
                  <input
                    type="number"
                    step="0.0001"
                    style={{
                      border: `1.5px solid ${COLORS.bordure}`,
                      borderRadius: 6,
                      padding: "6px 8px",
                      width: 110,
                      fontSize: 13,
                    }}
                    value={t.taux_eur_kg}
                    onChange={(e) => {
                      const copy = [...tranches];
                      copy[i] = { ...copy[i], taux_eur_kg: parseFloat(e.target.value) };
                      setTranches(copy);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Button label="Valider" onClick={handleSubmit} />

      {message && (
        <p style={{ marginTop: 14, fontSize: 13, color: COLORS.vert, fontWeight: 600 }}>
          {message}
        </p>
      )}
    </div>
  );
}
