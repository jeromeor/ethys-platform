'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ticket {
  id: string
  objet: string
  message: string
  a_piece_jointe: boolean
  statut: 'envoyée' | 'en_cours' | 'clôturée'
  created_at: string
  updated_at: string
  profils_utilisateurs?: {
    prenom: string
    nom: string
    email: string
  }
  entreprises?: {
    nom: string
  }
}

interface Props {
  userId: string
  isAdmin: boolean
}

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  'envoyée':   { label: 'Envoyée',   color: 'bg-blue-100 text-blue-700' },
  'en_cours':  { label: 'En cours',  color: 'bg-yellow-100 text-yellow-700' },
  'clôturée':  { label: 'Clôturée', color: 'bg-green-100 text-green-700' },
}

export default function SupportClient({ userId, isAdmin }: Props) {
  const supabase = createClient()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [objet, setObjet] = useState('')
  const [message, setMessage] = useState('')
  const [aPieceJointe, setAPieceJointe] = useState(false)

  const fetchTickets = async () => {
    setLoading(true)
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        profils_utilisateurs (prenom, nom, email),
        entreprises (nom)
      `)
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (!error && data) setTickets(data)
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [])

  const handleSubmit = async () => {
    if (!objet.trim() || !message.trim()) {
      setErrorMsg('Veuillez remplir l\'objet et le message.')
      return
    }
    setSubmitting(true)
    setErrorMsg('')

    // Récupérer entreprise_id de l'utilisateur
    const { data: profil } = await supabase
      .from('profils_utilisateurs')
      .select('entreprise_id, prenom, nom, email')
      .eq('id', userId)
      .single()

    const { error } = await supabase.from('support_tickets').insert({
      user_id: userId,
      entreprise_id: profil?.entreprise_id ?? null,
      objet,
      message,
      a_piece_jointe: aPieceJointe,
    })

    if (error) {
      setErrorMsg('Erreur lors de l\'envoi. Veuillez réessayer.')
      setSubmitting(false)
      return
    }

    // Envoi email via API route
    await fetch('/api/support/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objet,
        message,
        aPieceJointe,
        prenom: profil?.prenom,
        nom: profil?.nom,
        email: profil?.email,
      }),
    })

    setSuccessMsg('Votre demande a bien été envoyée. Vous recevrez une confirmation par email.')
    setObjet('')
    setMessage('')
    setAPieceJointe(false)
    setShowForm(false)
    setSubmitting(false)
    fetchTickets()
  }

  const handleStatut = async (id: string, newStatut: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ statut: newStatut })
      .eq('id', id)

    if (!error) {
      // Notifier l'utilisateur par email
      const ticket = tickets.find(t => t.id === id)
      if (ticket?.profils_utilisateurs?.email) {
        await fetch('/api/support/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: ticket.profils_utilisateurs.email,
            prenom: ticket.profils_utilisateurs.prenom,
            objet: ticket.objet,
            newStatut,
          }),
        })
      }
      fetchTickets()
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Support</h1>
        {!isAdmin && (
          <button
            onClick={() => { setShowForm(!showForm); setSuccessMsg(''); setErrorMsg('') }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            {showForm ? 'Annuler' : '+ Nouvelle demande'}
          </button>
        )}
      </div>

      {/* Message succès */}
      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {/* Formulaire nouvelle demande */}
      {showForm && !isAdmin && (
        <div className="mb-6 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nouvelle demande</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Objet *</label>
            <input
              type="text"
              value={objet}
              onChange={e => setObjet(e.target.value)}
              placeholder="Ex : Problème de connexion, Question sur une commande..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Message *</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Décrivez votre demande en détail..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="mb-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aPieceJointe}
                onChange={e => setAPieceJointe(e.target.checked)}
                className="w-4 h-4 accent-green-600"
              />
              <span className="text-sm text-gray-600">
                J'ai une pièce jointe à envoyer — je l'enverrai par email en réponse à la confirmation
              </span>
            </label>
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm mb-3">{errorMsg}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </div>
      )}

      {/* Liste des tickets */}
      {loading ? (
        <p className="text-gray-500 text-sm">Chargement...</p>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {isAdmin ? 'Aucune demande reçue.' : 'Vous n\'avez pas encore soumis de demande.'}
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">{ticket.objet}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_LABELS[ticket.statut]?.color}`}>
                      {STATUT_LABELS[ticket.statut]?.label}
                    </span>
                    {ticket.a_piece_jointe && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        📎 Pièce jointe
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <p className="text-xs text-gray-500 mb-1">
                      {ticket.profils_utilisateurs?.prenom} {ticket.profils_utilisateurs?.nom}
                      {ticket.entreprises?.nom ? ` — ${ticket.entreprises.nom}` : ''}
                      {' · '}{ticket.profils_utilisateurs?.email}
                    </p>
                  )}

                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-line line-clamp-3">
                    {ticket.message}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    Envoyée le {formatDate(ticket.created_at)}
                    {ticket.updated_at !== ticket.created_at && ` · Mise à jour le ${formatDate(ticket.updated_at)}`}
                  </p>
                </div>

                {/* Changement statut admin */}
                {isAdmin && (
                  <div className="flex flex-col gap-1 shrink-0">
                    {['envoyée', 'en_cours', 'clôturée'].map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatut(ticket.id, s)}
                        disabled={ticket.statut === s}
                        className={`text-xs px-3 py-1 rounded-lg border transition ${
                          ticket.statut === s
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {STATUT_LABELS[s].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
