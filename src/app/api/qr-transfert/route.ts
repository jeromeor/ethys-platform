import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const {
    certification_id,
    qr_code_id,
    filature_id,
    filature_nom,
    marque_id,         // null si nouvelle marque
    marque_email,      // email si nouvelle marque non enregistrée
    marque_nom,
    volume_kg,
    certification_reference,
  } = body

  // Guard usage unique : vérifie si ce QR a déjà été transféré
  const { data: transfertsExistants } = await supabase
    .from('transferts_qr')
    .select('id')
    .eq('qr_code_id', qr_code_id)
    .limit(1)

  if (transfertsExistants && transfertsExistants.length > 0) {
    return NextResponse.json(
      { error: 'Ce QR code a déjà été transféré.\nCette opération est unique et définitive.' },
      { status: 409 }
    )
  }

  // --- Cas nouvelle marque non enregistrée ---
  if (!marque_id && marque_email) {
    // Envoie un email d'invitation à la marque
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TEXTILE LOOP <contact@ethys-textileloop.com>',
        to: [marque_email],
        bcc: ['contact@ethys-textileloop.com'],
        subject: 'Invitation à rejoindre ETHYS Platform',
        html: `
          <div style="font-family:'Inter',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#f5f3ef;">
            <div style="background:#1a1a1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
              <img src="https://www.ethys-textileloop.com/logo_ethys.png" alt="ETHYS" style="width:60px;filter:invert(1);" />
              <div style="color:#c2956e;font-size:11px;letter-spacing:2px;margin-top:8px;">ETHYS PLATFORM</div>
            </div>
            <div style="background:#fff;border-radius:8px;border:1px solid #e8e3d8;padding:28px 24px;">
              <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Un QR code ETHYS vous attend</h2>
              <p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">
                Bonjour,<br/><br/>
                La filature <strong>${filature_nom}</strong> souhaite vous transférer un QR code de traçabilité ETHYS
                pour la certification <strong>${certification_reference}</strong> (${volume_kg} kg).
              </p>
              <p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 20px;">
                Pour récupérer ce QR code, vous devez d'abord créer un compte sur la plateforme ETHYS.
                Une fois enregistré et validé par TEXTILE LOOP, vous recevrez un nouveau lien d'accès.
              </p>
              <div style="text-align:center;margin:24px 0;">
                <a href="https://www.ethys-textileloop.com/register" style="display:inline-block;padding:12px 28px;background:#2d5016;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;">
                  Créer mon compte ETHYS
                </a>
              </div>
              <p style="color:#8b7355;font-size:11px;text-align:center;margin:0;">
                Pour toute question : <a href="mailto:contact@ethys-textileloop.com" style="color:#2d5016;">contact@ethys-textileloop.com</a>
              </p>
            </div>
            <div style="text-align:center;margin-top:20px;font-size:11px;color:#d4c5b0;">
              TEXTILE LOOP — 15 rue d'Upsal, 67000 Strasbourg
            </div>
          </div>
        `
      })
    })
    return NextResponse.json({ success: true, nouvelle_marque: true })
  }

  // --- Cas marque existante sur la plateforme ---

  // Crée le transfert en base
  const { data: transfert, error } = await supabase
    .from('transferts_qr')
    .insert({
      qr_code_id,
      certification_id,
      filature_id,
      marque_id,
      volume_kg,
      statut: 'en_attente',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Récupère l'email de la marque
  const { data: marqueUser } = await supabase
    .from('profils_utilisateurs')
    .select('email')
    .eq('entreprise_id', marque_id)
    .eq('role', 'marque')
    .single()

  const emailMarque = marqueUser?.email ?? null
  const lienAcces = `${request.nextUrl.origin}/qr-access/${transfert.code_acces}`

  // Email à la marque
  if (emailMarque) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TEXTILE LOOP <contact@ethys-textileloop.com>',
        to: [emailMarque],
        bcc: ['contact@ethys-textileloop.com'],
        subject: `QR code ETHYS disponible — ${certification_reference}`,
        html: `
          <div style="font-family:'Inter',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#f5f3ef;">
            <div style="background:#1a1a1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
              <img src="https://www.ethys-textileloop.com/logo_ethys.png" alt="ETHYS" style="width:60px;filter:invert(1);" />
              <div style="color:#c2956e;font-size:11px;letter-spacing:2px;margin-top:8px;">ETHYS PLATFORM</div>
            </div>
            <div style="background:#fff;border-radius:8px;border:1px solid #e8e3d8;padding:28px 24px;">
              <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Votre QR code de traçabilité est disponible</h2>
              <p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">
                Bonjour <strong>${marque_nom}</strong>,<br/><br/>
                La filature <strong>${filature_nom}</strong> vous transfère le QR code de traçabilité ETHYS
                pour la certification <strong>${certification_reference}</strong>.
              </p>
              <div style="background:#f5f3ef;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
                <div style="font-size:12px;color:#8b7355;margin-bottom:4px;">Volume certifié</div>
                <div style="font-size:20px;font-weight:800;color:#1a1a1a;">${volume_kg} kg</div>
                <div style="font-size:11px;color:#8b7355;margin-top:4px;">Certification ${certification_reference}</div>
              </div>
              <p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 20px;">
                Ce lien est strictement personnel et lié à votre commande. Il vous permet de télécharger le QR code destiné à vos communications consommateurs.
              </p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${lienAcces}" style="display:inline-block;padding:12px 28px;background:#2d5016;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;">
                  Récupérer mon QR code
                </a>
              </div>
              <p style="color:#8b7355;font-size:11px;text-align:center;margin:0;">
                Pour toute question : <a href="mailto:contact@ethys-textileloop.com" style="color:#2d5016;">contact@ethys-textileloop.com</a>
              </p>
            </div>
            <div style="text-align:center;margin-top:20px;font-size:11px;color:#d4c5b0;">
              TEXTILE LOOP — 15 rue d'Upsal, 67000 Strasbourg
            </div>
          </div>
        `
      })
    })
  }

  // Notification interne à Textile Loop
  const { data: admins } = await supabase
    .from('profils_utilisateurs')
    .select('id')
    .eq('role', 'admin')

  for (const admin of admins ?? []) {
    await supabase.from('notifications').insert({
      user_id: admin.id,
      type: 'transfert_qr',
      titre: 'Transfert QR code',
      contenu: `${filature_nom} a transféré le QR ${certification_reference} (${volume_kg} kg) à ${marque_nom}`,
      lien: '/qrcode',
      lu: false,
    })
  }

  return NextResponse.json({ success: true, transfert })
}
