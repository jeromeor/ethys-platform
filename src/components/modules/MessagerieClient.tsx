'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  auteur_id: string
  destinataire_id: string | null
  contenu: string
  lu: boolean
  created_at: string
  auteur?: { email: string; prenom?: string; nom?: string }
}

interface Utilisateur {
  id: string
  email: string
  prenom?: string
  nom?: string
  role: string
  entreprise?: { nom: string }
}

interface Props {
  currentUser: { id: string; email: string }
  currentRole: string
  adminId: string
  utilisateurs: Utilisateur[]
}

export default function MessagerieClient({ currentUser, currentRole, adminId, utilisateurs }: Props) {
  const supabase = createClient()
  const [dossier, setDossier] = useState<'recus' | 'envoyes'>('recus')
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null)
  const [conversation, setConversation] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isAdmin = currentRole === 'admin'

  const nomAffiche = (u?: Utilisateur | null) => {
    if (!u) return 'Inconnu'
    if (u.prenom && u.nom) return `${u.prenom} ${u.nom}`
    return u.email
  }

  const nomExpediteur = (msg: Message) => {
    if (msg.auteur?.prenom && msg.auteur?.nom) return `${msg.auteur.prenom} ${msg.auteur.nom}`
    return msg.auteur?.email ?? 'Inconnu'
  }

  useEffect(() => {
    chargerMessages()
    const channel = supabase
      .channel('messages_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        chargerMessages()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const chargerMessages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*, auteur:profils_utilisateurs!messages_auteur_id_fkey(email, prenom, nom)')
      .or(`auteur_id.eq.${currentUser.id},destinataire_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setLoading(false)
  }

  const ouvrirConversation = async (user: Utilisateur) => {
    setSelectedUser(user)
    const conv = messages.filter(m =>
      (m.auteur_id === currentUser.id && m.destinataire_id === user.id) ||
      (m.auteur_id === user.id && m.destinataire_id === currentUser.id)
    )
    setConversation(conv)
    const nonLus = conv.filter(m => !m.lu && m.auteur_id === user.id).map(m => m.id)
    if (nonLus.length > 0) {
      await supabase.from('messages').update({ lu: true }).in('id', nonLus)
      setMessages(prev => prev.map(m => nonLus.includes(m.id) ? { ...m, lu: true } : m))
    }
  }

  const envoyerMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return
    setSending(true)
    const destinataireId = isAdmin ? selectedUser.id : adminId
    const { data } = await supabase
      .from('messages')
      .insert({
        auteur_id: currentUser.id,
        destinataire_id: destinataireId,
        contenu: newMessage.trim(),
        lu: false,
      })
      .select('*, auteur:profils_utilisateurs!messages_auteur_id_fkey(email, prenom, nom)')
      .single()
    if (data) {
      setMessages(prev => [...prev, data])
      setConversation(prev => [...prev, data])
      setNewMessage('')
    }
    setSending(false)
  }

  const messagesRecus = messages.filter(m => m.destinataire_id === currentUser.id)
  const messagesEnvoyes = messages.filter(m => m.auteur_id === currentUser.id)

  const nonLusTotal = messagesRecus.filter(m => !m.lu).length

  const interlocuteursRecus = isAdmin
    ? utilisateurs.filter(u => messagesRecus.some(m => m.auteur_id === u.id))
    : [utilisateurs.find(u => u.id === adminId)].filter(Boolean) as Utilisateur[]

  const interlocuteursEnvoyes = isAdmin
    ? utilisateurs.filter(u => messagesEnvoyes.some(m => m.destinataire_id === u.id))
    : [utilisateurs.find(u => u.id === adminId)].filter(Boolean) as Utilisateur[]

  const interlocuteurs = dossier === 'recus' ? interlocuteursRecus : interlocuteursEnvoyes

  const nonLusPourUser = (userId: string) =>
    messagesRecus.filter(m => m.auteur_id === userId && !m.lu).length

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Sidebar gauche */}
      <div style={{ width: 260, minWidth: 260, background: '#fff', borderRight: '1px solid #EEF0F3', display: 'flex', flexDirection: 'column' }}>

        {/* Dossiers */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setDossier('recus'); setSelectedUser(null) }} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: dossier === 'recus' ? '#F0FDF4' : '#F8FAFC', color: dossier === 'recus' ? '#0A3D26' : '#64748B', fontWeight: dossier === 'recus' ? 700 : 400, fontSize: 12, position: 'relative' }}>
              Reçus
              {nonLusTotal > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#DC2626', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {nonLusTotal}
                </span>
              )}
            </button>
            <button onClick={() => { setDossier('envoyes'); setSelectedUser(null) }} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: dossier === 'envoyes' ? '#F0FDF4' : '#F8FAFC', color: dossier === 'envoyes' ? '#0A3D26' : '#64748B', fontWeight: dossier === 'envoyes' ? 700 : 400, fontSize: 12 }}>
              Envoyés
            </button>
          </div>
        </div>

        {/* Liste interlocuteurs */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!isAdmin && dossier === 'recus' && interlocuteursRecus.length === 0 && (
            <div style={{ padding: '20px 14px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
              Aucun message reçu de l'administration.
            </div>
          )}
          {interlocuteurs.map(user => {
            const nonLus = nonLusPourUser(user.id)
            const dernierMsg = messages
              .filter(m => (m.auteur_id === user.id && m.destinataire_id === currentUser.id) || (m.auteur_id === currentUser.id && m.destinataire_id === user.id))
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            const isSelected = selectedUser?.id === user.id
            return (
              <div key={user.id} onClick={() => ouvrirConversation(user)} style={{ padding: '12px 14px', cursor: 'pointer', background: isSelected ? '#F0FDF4' : 'transparent', borderLeft: `3px solid ${isSelected ? '#0A3D26' : 'transparent'}`, borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: nonLus > 0 ? 800 : 600, color: '#1A202C' }}>{nomAffiche(user)}</div>
                  {nonLus > 0 && (
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{nonLus}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>{user.entreprise?.nom ?? user.role}</div>
                {dernierMsg && (
                  <div style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dernierMsg.contenu.slice(0, 40)}{dernierMsg.contenu.length > 40 ? '...' : ''}
                  </div>
                )}
              </div>
            )
          })}

          {/* Bouton nouveau message pour admin */}
          {isAdmin && (
            <div style={{ padding: '12px 14px', borderTop: '1px solid #F1F5F9', marginTop: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' }}>Contacter un utilisateur</div>
              <select onChange={e => {
                const user = utilisateurs.find(u => u.id === e.target.value)
                if (user) { setDossier('envoyes'); ouvrirConversation(user) }
              }} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', color: '#1A202C' }}>
                <option value="">Sélectionner un utilisateur...</option>
                {utilisateurs.filter(u => u.id !== currentUser.id).map(u => (
                  <option key={u.id} value={u.id}>{nomAffiche(u)} — {u.entreprise?.nom ?? u.role}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Bouton contacter admin pour non-admin */}
        {!isAdmin && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid #F1F5F9' }}>
            <button onClick={() => {
              const admin = utilisateurs.find(u => u.id === adminId)
              if (admin) ouvrirConversation(admin)
            }} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Contacter l'administration
            </button>
          </div>
        )}
      </div>

      {/* Zone de conversation */}
      {selectedUser ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEF0F3', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#065F46' }}>
              {nomAffiche(selectedUser).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{nomAffiche(selectedUser)}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{selectedUser.entreprise?.nom ?? selectedUser.role}</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {conversation.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 60 }}>
                Aucun message — démarrez la conversation.
              </div>
            ) : conversation.map(msg => {
              const estMoi = msg.auteur_id === currentUser.id
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: estMoi ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
                  <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: estMoi ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: estMoi ? '#0A3D26' : '#F1F5F9', color: estMoi ? '#fff' : '#1A202C', fontSize: 13, lineHeight: 1.5 }}>
                    {msg.contenu}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, display: 'flex', gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>{nomExpediteur(msg)}</span>
                    <span>·</span>
                    <span>{new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid #EEF0F3', background: '#fff', display: 'flex', gap: 10 }}>
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && envoyerMessage()}
              placeholder={`Écrire à ${nomAffiche(selectedUser)}...`}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none', color: '#1A202C' }}
            />
            <button onClick={envoyerMessage} disabled={sending || !newMessage.trim()} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: sending || !newMessage.trim() ? '#E2E8F0' : '#0A3D26', color: sending || !newMessage.trim() ? '#94A3B8' : '#fff', fontSize: 13, fontWeight: 700, cursor: sending || !newMessage.trim() ? 'default' : 'pointer' }}>
              {sending ? '...' : 'Envoyer'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✉</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sélectionnez une conversation</div>
            <div style={{ fontSize: 12 }}>
              {isAdmin ? 'Choisissez un utilisateur pour démarrer.' : "Cliquez sur \"+ Contacter l'administration\"."}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
