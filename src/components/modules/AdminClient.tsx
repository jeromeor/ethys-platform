'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Utilisateur {
  id: string
  email: string
  role: string
  statut: string
  entreprise_id: string | null
  created_at: string
  derniere_connexion: string | null
  entreprise: { nom: string; type: string } | null
}

interface AuditEntry {
  id: string
  user_email: string | null
  action: string
  cible: string | null
  ip_address: string | null
  niveau: string
  created_at: string
}

interface Entreprise {
  id: string
  nom: string
  type: string
  statut: string
}

interface Props {
  utilisateurs: Utilisateur[]
  audit: AuditEntry[]
  entreprises: Entreprise[]
  currentUserId: string
}

const ROLE_COLORS: Record<string, [string, string]> = {
  admin:       ['#F3E8FF', '#6B21A8'],
  marque:      ['#DBEAFE', '#1E40AF'],
  filature:    ['#D1FAE5', '#065F46'],
  fournisseur: ['#FEF3C7', '#92400E'],
}

const NIVEAU_STYLE: Record<string, { bg: string; tc: string; icon: string }> = {
  info:    { bg: '#EFF6FF', tc: '#2563EB', icon: 'ℹ' },
  warning: { bg: '#FFFBEB', tc: '#D97706', icon: '⚠' },
  alert:   { bg: '#FEF2F2', tc: '#DC2626', icon: '✕' },
}

const TABS = ['Utilisateurs', 'Rôles & Droits', 'Journal d\'audit', 'Sécurité']

const ROLES_DEF = [
  {
    role: 'admin', couleur: '#6B21A8', bg: '#F3E8FF',
    desc: 'Accès total à toutes les fonctionnalités.',
    permissions: ['Dashboard', 'Profil', 'Annuaire', 'Messagerie', 'Commandes', 'Production', 'QR Code', 'Facturation', 'Reporting', 'ESG', 'Administration'],
  },
  {
    role: 'marque', couleur: '#1E40AF', bg: '#DBEAFE',
    desc: 'Accès aux commandes, suivi et reporting ESG.',
    permissions: ['Dashboard', 'Profil', 'Annuaire', 'Messagerie', 'Commandes', 'Production (lecture)', 'QR Code (lecture)', 'Reporting ESG'],
  },
  {
    role: 'filature', couleur: '#065F46', bg: '#D1FAE5',
    desc: 'Accès aux commandes assignées et production.',
    permissions: ['Dashboard', 'Profil', 'Messagerie', 'Commandes (assignées)', 'Production', 'QR Code'],
  },
  {
    role: 'fournisseur', couleur: '#92400E', bg: '#FEF3C7',
    desc: 'Accès limité aux commandes et messagerie.',
    permissions: ['Dashboard', 'Profil', 'Messagerie', 'Commandes (validation)'],
  },
]

export default function AdminClient({ utilisateurs: initial = [], audit = [], entreprises = [], currentUserId }: Props) {
  const supabase = createClient()
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(initial ?? [])
  const [activeTab, setActiveTab] = useState('Utilisateurs')
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null)
  const [inviteModal, setInviteModal] = useState(false)
  const [params, setParams] = useState([
    { label: 'Authentification 2FA', actif: true, desc: 'Obligatoire pour les comptes Admin' },
    { label: 'Sessions auto-expirées (8h)', actif: true, desc: 'Déconnexion après inactivité' },
    { label: 'Chiffrement TLS 1.3', actif: true, desc: 'Toutes les communications API' },
    { label: 'IP Whitelist Admin', actif: false, desc: 'Restreindre l\'accès Admin par IP' },
    { label: 'Audit log complet', actif: true, desc: 'Toutes les actions journalisées' },
    { label: 'Backups chiffrés AES-256', actif: true, desc: 'Sauvegarde quotidienne' },
  ])


