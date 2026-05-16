'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ticket {
  id: string
  user_id: string
  reference: string
  objet: string
  message: string
  a_piece_jointe: boolean
  statut: 'envoyée' | 'en_cours' | 'clôturée'
  created_at: string
  updated_at: string
}

interface Props {
  userId: string
  isAdmin: boolean
}

const STATUT_STYLE: Record<string, { label: string; background: string; color: string }> = {
  envoyee:  { label: 'Envoyée',   background: '#dbeafe', color: '#1d4ed8' },
  en_cours: { label: 'En cours',  background: '#fef3c7', color: '#b45309' },
  cloturee: { label: 'Clôturée', background: '#dcfce7', color: '#15803d' },
}

function getStatutStyle(statut: string) {
  if (statut === 'envoyée') return STATUT_STYLE.envoyee
  if (statut === 'en_cours') return STATUT_STYLE.en_cours
  if (statut === 'clôturée') return STATUT_STYLE.cloturee
  return { label: statut, background: '#f5f3ef', color: '#4a5568' }
}

function getSupportMailto(ref: string, objet: string) {
  return 'mailto:contact@textile-loop.com?subject=[' + ref + '] ' + encodeURIComponent(objet)
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
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setTickets(data)
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [])

  const handleSubmit = async () => {
    if (!objet.trim() || !message.trim()) {
      setErrorMsg('Veuillez remplir objet et message.')
      return
    }
    setSubmitting(true)
    setErrorMsg('')

    const { data: profil } = await supabase
      .from('profils_utilisateurs')
      .select('entreprise_id, prenom, nom, email')
      .eq('id', userId)
      .single()

    const { data: refData } = await supabase.rpc('generate_ticket_reference', {
      p_entreprise_id: profil?.entreprise_id ?? null,
      p_created_at: new Date().toISOString(),
    })

    const { error } = await supabase.from('support_tickets').insert({
      user_id: userId,
      entreprise_id: profil?.entreprise_id ?? null,
      objet,
      message,
      a_piece_jointe: aPieceJointe,
      reference: refData ?? null,
    })

    if (error) {
      setErrorMsg('Erreur lors de envoi. Veuillez reessayer.')
      setSubmitting(false)
      return
    }

    await fetch('/api/support/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objet,
        message,
        aPieceJointe,
        reference: refData ?? '',
        prenom: profil?.prenom,
        nom: profil?.nom,
        email: profil?.email,
      }),
    })

    setSuccessMsg('Votre demande a bien ete envoyee. Vous recevrez une confirmation par email.')
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
      const ticket = tickets.find(t => t.id === id)
      if (ticket) {
        const { data: profil } = await supabase
          .from('profils_utilisateurs')
          .select('email, prenom')
          .eq('id', ticket.user_id)
          .single()
        if (profil?.email) {
          await fetch('/api/support/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: profil.email,
              prenom: profil.prenom,
              objet: ticket.objet,
              reference: ticket.reference,
              newStatut,
            }),
          })
        }
      }
      fetchTickets()
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Support</h1>
          <p style={{ fontSize: 12, color: '#8b7355', margin: '4px 0 0' }}>
            {isAdmin ? 'Toutes les demandes' : 'Suivez vos demandes assistance'}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => { setShowForm(!showForm); setSuccessMsg(''); setErrorMsg('') }}
            style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {showForm ? 'Annuler' : '+ Nouvelle demande'}
          </button>
        )}
      </div>

      {successMsg && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, color: '#15803d', fontSize: 13 }}>
          {successMsg}
        </div>
      )}

      {showForm && !isAdmin && (
        <div style={{ marginBottom: 24, padding: 20, background: '#fff', border: '1px solid #e8e3d8', borderRadius: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: '0 0 16px' }}>Nouvelle demande</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>Objet</label>
            <input
              type="text"
              value={objet}
              onChange={e => setObjet(e.target.value)}
              placeholder="Ex : Probleme de connexion, Question sur une commande..."
              style={{ width: '100%', border: '1px solid #d4c5b0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Decrivez votre demande en detail..."
              style={{ width: '100%', border: '1px solid #d4c5b0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#4a5568' }}>
              <input
                type="checkbox"
                checked={aPieceJointe}
                onChange={e => setAPieceJointe(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              J ai une piece jointe - je l enverrai par email en reponse a la confirmation
            </label>
          </div>

          {errorMsg && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12 }}>{errorMsg}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 13, color: '#8b7355' }}>Chargement...</p>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#8b7355', fontSize: 13 }}>
          {isAdmin ? 'Aucune demande recue.' : 'Vous navez pas encore soumis de demande.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tickets.map(ticket => {
            const st = getStatutStyle(ticket.statut)
            return (
              <div key={ticket.id} style={{ background: '#fff', border: '1px solid #e8e3d8', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      {ticket.reference && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#8b7355', letterSpacing: 0.5 }}>
                          {ticket.reference}
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: st.background, color: st.color }}>
                        {st.label}
                      </span>
                      {ticket.a_piece_jointe && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f5f3ef', color: '#8b7355' }}>
                          PJ
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px' }}>{ticket.objet}</p>
                    <p style={{ fontSize: 13, color: '#4a5568', margin: '0 0 8px' }}>{ticket.message}</p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <p style={{ fontSize: 11, color: '#a0aec0', margin: 0 }}>
                        {formatDate(ticket.created_at)}
                      </p>
                     {!isAdmin && ticket.reference && (
                        <button
                          onClick={() => { window.location.href = getSupportMailto(ticket.reference, ticket.objet) }}
                          style={{ fontSize: 11, color: '#1a1a1a', fontWeight: 600, border: '1px solid #e8e3d8', borderRadius: 6, background: '#f5f3ef', padding: '4px 10px', cursor: 'pointer' }}
                        >
                          Repondre par email
                        </button>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      {(['envoyée', 'en_cours', 'clôturée'] as const).map(s => {
                        const ss = getStatutStyle(s)
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatut(ticket.id, s)}
                            disabled={ticket.statut === s}
                            style={{
                              fontSize: 11, padding: '4px 10px', borderRadius: 6,
                              border: '1px solid #e8e3d8',
                              cursor: ticket.statut === s ? 'default' : 'pointer',
                              background: ticket.statut === s ? ss.background : '#fff',
                              color: ticket.statut === s ? ss.color : '#4a5568',
                              fontWeight: ticket.statut === s ? 600 : 400,
                            }}
                          >
                            {ss.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
