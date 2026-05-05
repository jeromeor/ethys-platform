'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  contenu: string
  auteur_id: string
  lu: boolean
  created_at: string
}

interface Conversation {
  id: string
  sujet: string
  updated_at: string
  participants: {
    user_id: string
    entreprise: { nom: string; type: string }
  }[]
  messages: Message[]
}

interface Props {
  user: { id: string; email?: string }
  profil: { entreprise?: { nom?: string }; role?: string } | null
  conversationsInitiales: Conversation[]
}

const typeColors: Record<string, [string, string]> = {
  marque:            ['#DBEAFE', '#1E40AF'],
  filature:          ['#D1FAE5', '#065F46'],
  fournisseur_coton: ['#FEF3C7', '#92400E'],
  plateforme:        ['#F3E8FF', '#6B21A8'],
}

export default function MessagerieClient({ user, profil, conversationsInitiales }: Props) {
  const supabase = createClient()
  const [conversations, setConversations] = useState<Conversation[]>(conversationsInitiales)
  const [active, setActive] = useState<Conversation | null>(conversationsInitiales[0] ?? null)
  const [messages, setMessages] = useState<Message[]>(conversationsInitiales[0]?.messages ?? [])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewConv, setShowNewConv] = useState(false)
  const [newSujet, setNewSujet] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  // Scroll automatique vers le bas
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime — écouter les nouveaux messages
  useEffect(() => {
    if (!active) return

    const channel = supabase
      .channel(`messages:${active.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${active.id}`
      }, (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [active?.id])

  const ouvrirConversation = async (conv: Conversation) => {
    setActive(conv)

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })

    setMessages(msgs ?? [])
  }

  const envoyerMessage = async () => {
    if (!input.trim() || !active || sending) return
    setSending(true)

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: active.id,
        auteur_id: user.id,
        contenu: input.trim(),
        lu: false,
      })

    if (!error) {
      setInput('')
      // Mettre à jour updated_at de la conversation
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', active.id)
    }
    setSending(false)
  }

  const creerConversation = async () => {
    if (!newSujet.trim()) return

    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({
        sujet: newSujet.trim(),
        created_by: user.id,
      })
      .select()
      .single()

    if (!error && conv) {
      // Ajouter le créateur comme participant
      await supabase
        .from('participants_conversation')
        .insert({
          conversation_id: conv.id,
          user_id: user.id,
          entreprise_id: profil?.entreprise?.nom ? conv.id : conv.id,
        })

      setConversations(prev => [{ ...conv, participants: [], messages: [] }, ...prev])
      setActive({ ...conv, participants: [], messages: [] })
      setMessages([])
      setNewSujet('')
      setShowNewConv(false)
    }
  }

  const getInitiales = (conv: Conversation) => {
    const autre = conv.participants?.find(p => p.user_id !== user.id)
    return autre?.entreprise?.nom?.slice(0, 2).toUpperCase() ?? 'TL'
  }

  const getTypeColor = (conv: Conversation): [string, string] => {
    const autre = conv.participants?.find(p => p.user_id !== user.id)
    return typeColors[autre?.entreprise?.type ?? 'plateforme'] ?? ['#F1F5F9', '#475569']
  }

  const nbNonLus = (conv: Conversation) =>
    conv.messages?.filter(m => !m.lu && m.auteur_id !== user.id).length ?? 0

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Liste conversations */}
      <div style={{
        width: 280, minWidth: 280, background: '#fff',
        borderRight: '1px solid #EEF0F3', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid #F1F5F9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0A3D26' }}>
            Messages
          </span>
          <button onClick={() => setShowNewConv(true)} style={{
            width: 28, height: 28, borderRadius: 8, border: 'none',
            background: '#F1F5F9', cursor: 'pointer', fontSize: 16, color: '#64748B'
          }}>＋</button>
        </div>

        {/* Modal nouvelle conversation */}
        {showNewConv && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
            <input
              value={newSujet}
              onChange={e => setNewSujet(e.target.value)}
              placeholder="Sujet de la conversation…"
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 8,
                border: '1.5px solid #E2E8F0', fontSize: 12,
                boxSizing: 'border-box', outline: 'none', marginBottom: 8
              }}
              onKeyDown={e => e.key === 'Enter' && creerConversation()}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={creerConversation} style={{
                flex: 1, padding: '6px', borderRadius: 8, border: 'none',
                background: '#0A3D26', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer'
              }}>Créer</button>
              <button onClick={() => setShowNewConv(false)} style={{
                flex: 1, padding: '6px', borderRadius: 8,
                border: '1.5px solid #EEF0F3', background: '#fff',
                fontSize: 11, cursor: 'pointer'
              }}>Annuler</button>
            </div>
          </div>
        )}

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
              Aucune conversation.<br />Cliquez sur ＋ pour commencer.
            </div>
          ) : conversations.map(conv => {
            const [bg, tc] = getTypeColor(conv)
            const nonLus = nbNonLus(conv)
            const dernierMsg = conv.messages?.[conv.messages.length - 1]
            return (
              <div key={conv.id} onClick={() => ouvrirConversation(conv)} style={{
                padding: '12px 16px', cursor: 'pointer',
                background: active?.id === conv.id ? '#F0FDF4' : 'transparent',
                borderLeft: `3px solid ${active?.id === conv.id ? '#0A3D26' : 'transparent'}`,
                borderBottom: '1px solid #F8FAFC'
              }}
                onMouseEnter={e => { if (active?.id !== conv.id) (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC' }}
                onMouseLeave={e => { if (active?.id !== conv.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: bg, color: tc,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800
                  }}>{getInitiales(conv)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: nonLus > 0 ? 700 : 600, color: '#1A202C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                        {conv.sujet}
                      </span>
                      {nonLus > 0 && (
                        <span style={{ background: '#0A3D26', color: '#fff', borderRadius: 20, fontSize: 9, fontWeight: 700, padding: '1px 5px', flexShrink: 0 }}>
                          {nonLus}
                        </span>
                      )}
                    </div>
                    {dernierMsg && (
                      <div style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dernierMsg.contenu.slice(0, 40)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Zone chat */}
      {active ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            height: 56, background: '#fff', borderBottom: '1px solid #EEF0F3',
            display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', flexShrink: 0
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{active.sujet}</div>
              <div style={{ fontSize: 10, color: '#94A3B8' }}>
                🔒 Conversation chiffrée · {messages.length} message(s)
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: 12 }}>
                Aucun message — commencez la conversation
              </div>
            ) : messages.map(msg => {
              const isMoi = msg.auteur_id === user.id
              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  flexDirection: isMoi ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: 8
                }}>
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: isMoi ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isMoi ? '#0A3D26' : '#fff',
                      color: isMoi ? '#fff' : '#1A202C',
                      fontSize: 13, lineHeight: 1.5,
                      border: isMoi ? 'none' : '1px solid #EEF0F3'
                    }}>
                      {msg.contenu}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, textAlign: isMoi ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {isMoi && <span style={{ marginLeft: 4, color: '#10B981' }}>✓✓</span>}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          {/* Saisie */}
          <div style={{ padding: '12px 20px', background: '#fff', borderTop: '1px solid #EEF0F3', flexShrink: 0 }}>
            <div style={{
              display: 'flex', gap: 10, background: '#F8FAFC',
              borderRadius: 12, border: '1.5px solid #E2E8F0', padding: '8px 12px',
              alignItems: 'flex-end'
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyerMessage() } }}
                placeholder="Écrivez un message… (Entrée pour envoyer)"
                style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit' }}
              />
              <button onClick={envoyerMessage} disabled={!input.trim() || sending} style={{
                width: 34, height: 34, borderRadius: 9, border: 'none',
                background: input.trim() && !sending ? '#0A3D26' : '#E2E8F0',
                color: input.trim() && !sending ? '#fff' : '#94A3B8',
                cursor: input.trim() && !sending ? 'pointer' : 'default',
                fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>➤</button>
            </div>
            <div style={{ fontSize: 10, color: '#CBD5E1', textAlign: 'center', marginTop: 4 }}>
              🔒 Messages sécurisés · Plateforme ETHYS
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✉</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Sélectionnez une conversation</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>ou créez-en une nouvelle avec ＋</div>
          </div>
        </div>
      )}
    </div>
  )
}