"use client";

import { useState } from "react";

type Niveau = "standard" | "partenaire" | "privilege";

interface Filature {
  id: string;
  nom: string;
  bareme_commissions_filatures: {
    niveau: Niveau;
    personnalise: boolean;
    tranches_personnalisees: unknown;
  }[];
}

export default function CommissionsFilaturesClient({
  filatures,
  defauts,
}: {
  filatures: Filature[];
  defauts: { niveau: Niveau; tranche_min: number; tranche_max: number | null; taux_eur_kg: number }[];
}) {
  const [filatureId, setFilatureId] = useState("");
  const [niveau, setNiveau] = useState<Niveau>("standard");
  const [personnalise, setPersonnalise] = useState(false);
  const [tranches, setTranches] = useState(
    defauts.filter((d) => d.niveau === "standard")
  );
  const [message, setMessage] = useState("");

  // Changement de filature sélectionnée : pré-remplit avec son barème actuel
  function handleFilatureChange(id: string) {
    setFilatureId(id);
    const f = filatures.find((f) => f.id === id);
    const bareme = f?.bareme_commissions_filatures?.[0];
    setNiveau(bareme?.niveau ?? "standard");
    setPersonnalise(bareme?.personnalise ?? false);
  }

  // Changement de niveau : recharge les tranches par défaut de ce niveau
  function handleNiveauChange(n: Niveau) {
    setNiveau(n);
    setTranches(defauts.filter((d) => d.niveau === n));
  }

  async function handleSubmit() {
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

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Commissions filatures</h1>

      <label className="block mb-1">Filature</label>
      <select
        className="border p-2 w-full mb-4"
        value={filatureId}
        onChange={(e) => handleFilatureChange(e.target.value)}
      >
        <option value="">-- Sélectionner --</option>
        {filatures.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nom}
          </option>
        ))}
      </select>

      <label className="block mb-1">Niveau</label>
      <select
        className="border p-2 w-full mb-4"
        value={niveau}
        onChange={(e) => handleNiveauChange(e.target.value as Niveau)}
      >
        <option value="standard">Standard</option>
        <option value="partenaire">Partenaire</option>
        <option value="privilege">Privilège</option>
      </select>

      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={personnalise}
          onChange={(e) => setPersonnalise(e.target.checked)}
        />
        Tarif personnalisé (forcé, hors barème standard du niveau)
      </label>

      {personnalise && (
        <div className="mb-4 space-y-2">
          {tranches.map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="w-32">
                {t.tranche_min} - {t.tranche_max ?? "∞"} t
              </span>
              <input
                type="number"
                step="0.0001"
                className="border p-1 w-28"
                value={t.taux_eur_kg}
                onChange={(e) => {
                  const copy = [...tranches];
                  copy[i] = { ...copy[i], taux_eur_kg: parseFloat(e.target.value) };
                  setTranches(copy);
                }}
              />
              <span>€/kg</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!filatureId}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-40"
      >
        Valider (admin)
      </button>

      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}
