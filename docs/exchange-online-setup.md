# Exchange Online + Microsoft Graph — Setup-Anleitung

Diese Anleitung beschreibt, wie der E-Mail-Versand von Barbier Berlin
über Microsoft Exchange Online (Graph API) eingerichtet wird.

## Voraussetzungen

- Microsoft-365-Tenant mit Berechtigung zur App-Registrierung
- Mailbox-Lizenz für `info@barbier.berlin` (z. B. **Exchange Online Plan 1** ~3,40 €/Monat
  oder **Microsoft 365 Business Basic** ~6 €/Monat)
- Zugriff auf die DNS-Verwaltung der Domain `barbier.berlin`
- Cloudflare-Pages-Projekt-Admin (für Secrets)

## 1) Mailbox in Exchange Online anlegen

1. Microsoft 365 Admin Center → **Benutzer** → **Aktive Benutzer** → **Benutzer hinzufügen**
2. Anzeigename: „Barbier Berlin Info"
3. Benutzername: `info@barbier.berlin`
4. Lizenz: Exchange Online Plan 1 oder M365 Business Basic
5. Senden- und Empfangstest direkt in Outlook Web App durchführen

## 2) DNS-Records setzen

| Typ | Host | Wert | TTL |
|---|---|---|---|
| MX | `@` | `barbier-berlin.mail.protection.outlook.com` (Priorität 0) | 3600 |
| TXT | `@` | `v=spf1 include:spf.protection.outlook.com -all` | 3600 |
| CNAME | `selector1._domainkey` | `selector1-barbier-berlin._domainkey.<tenant>.onmicrosoft.com` | 3600 |
| CNAME | `selector2._domainkey` | `selector2-barbier-berlin._domainkey.<tenant>.onmicrosoft.com` | 3600 |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:info@barbier.berlin` | 3600 |
| TXT | `@` | `MS=ms…` (Domain-Verifizierung, wird im EXO-Admin angezeigt) | 3600 |
| CNAME | `autodiscover` | `autodiscover.outlook.com` | 3600 |

Die exakten DKIM-Selector-Werte zeigt das EXO Admin Center unter
**Mailflow → DKIM → Domain wählen → Aktivieren**.

Verifikation:
```bash
dig MX barbier.berlin +short
dig TXT barbier.berlin +short
dig CNAME selector1._domainkey.barbier.berlin +short
```

## 3) App-Registrierung in Azure AD (Entra ID)

1. Azure Portal → **Microsoft Entra ID** → **App-Registrierungen** → **Neue Registrierung**
2. Name: `Barbier-Berlin-Mailer`
3. Unterstützte Kontotypen: **Nur Konten in diesem Verzeichnis (Single-Tenant)**
4. **Registrieren**
5. **Übersicht** öffnen → notieren:
   - Anwendungs-ID (Client) → `MS_CLIENT_ID`
   - Verzeichnis-ID (Tenant) → `MS_TENANT_ID`
6. **Zertifikate & Geheimnisse** → **Neuer geheimer Clientschlüssel**
   - Name: `prod-cf-pages`
   - Gültigkeit: 24 Monate (Kalender-Eintrag für Rotation setzen!)
   - **Wert** sofort kopieren (nur einmal sichtbar) → `MS_CLIENT_SECRET`
7. **API-Berechtigungen** → **Berechtigung hinzufügen** →
   **Microsoft Graph** → **Anwendungsberechtigungen** → **Mail.Send**
8. **Administratorzustimmung für \<Tenant\> erteilen**

## 4) Zugriff auf eine einzelne Mailbox beschränken (Application Access Policy)

Damit die App **ausschließlich** aus `info@barbier.berlin` senden darf
(und nicht aus jeder Mailbox des Tenants), wird eine
Application Access Policy gesetzt.

PowerShell mit Exchange-Online-Modul:

```powershell
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
Connect-ExchangeOnline -UserPrincipalName admin@<tenant>.onmicrosoft.com

# Mail-aktivierte Sicherheitsgruppe für berechtigte Absender (einmalig)
New-DistributionGroup -Name "BarbierMailSenders" -Type Security `
  -PrimarySmtpAddress "barbier-mail-senders@<tenant>.onmicrosoft.com"
Add-DistributionGroupMember -Identity "BarbierMailSenders" `
  -Member "info@barbier.berlin"

# Policy: App darf nur Mitglieder dieser Gruppe als Absender nutzen
New-ApplicationAccessPolicy `
  -AppId "<MS_CLIENT_ID>" `
  -PolicyScopeGroupId "barbier-mail-senders@<tenant>.onmicrosoft.com" `
  -AccessRight RestrictAccess `
  -Description "Barbier Berlin Mailer: nur info@barbier.berlin"

# Test (sollte 'Granted' zurückgeben für info@, 'Denied' für alle anderen)
Test-ApplicationAccessPolicy -Identity "info@barbier.berlin" -AppId "<MS_CLIENT_ID>"
Test-ApplicationAccessPolicy -Identity "admin@<tenant>.onmicrosoft.com" -AppId "<MS_CLIENT_ID>"
```

> Hinweis: Policy-Änderungen brauchen oft bis zu 30 Minuten, bis sie greifen.

## 5) Cloudflare-Pages-Secrets setzen

CF Dashboard → **Pages** → `barbier-berlin` → **Settings** → **Environment variables**
→ **Production**:

| Variable | Wert | Typ |
|---|---|---|
| `MS_TENANT_ID` | Verzeichnis-ID aus Schritt 3 | Encrypt |
| `MS_CLIENT_ID` | Anwendungs-ID aus Schritt 3 | Encrypt |
| `MS_CLIENT_SECRET` | Wert des Client Secret | **Encrypt** |
| `MAIL_SENDER` | `info@barbier.berlin` | Plain |
| `CRON_SECRET` | beliebige zufällige Zeichenkette (≥32 Zeichen) | **Encrypt** |

Nach dem Setzen einmalig „Re-Deploy" auslösen (oder per Git-Push triggern).

## 6) Test

Nach Deploy:

```bash
# Health-Check
curl https://barbier.berlin/api/health
# Erwartet: { "status": "ok", "hasDb": true, "hasMailConfig": true }
```

Test-Mail (nur für eingeloggte Admins):
```
GET https://barbier.berlin/api/test/email
```
sendet eine Willkommens-Mail an die hinterlegte Admin-Adresse.

## 7) Token-Rotation

- **Client Secret läuft nach 24 Monaten ab.** Kalender-Erinnerung 4 Wochen vorher.
- Rotation: Schritt 3 Punkt 6 wiederholen, neuen Secret in CF Pages eintragen,
  alten Secret im Azure-Portal löschen.

## 8) Troubleshooting

| Symptom | Ursache | Lösung |
|---|---|---|
| `401 Unauthorized` beim Token-Endpoint | Client Secret falsch oder abgelaufen | Neuen Secret erstellen, CF-Var aktualisieren |
| `403 Forbidden` bei `sendMail` | Application Access Policy blockiert | `Test-ApplicationAccessPolicy` ausführen, Gruppen-Mitgliedschaft prüfen |
| Mails landen im Spam | DKIM/DMARC nicht aktiv | DKIM im EXO-Admin aktivieren, Records publizieren, 24h warten |
| `400 Bad Request – Recipient address rejected` | `MAIL_SENDER` ist keine echte Mailbox | Mailbox-Lizenz prüfen |

## Sicherheitshinweis

Das Client Secret hat Mail-Versand-Rechte für die zugewiesene Mailbox.
Niemals ins Repo committen, niemals in Logs ausgeben, ausschließlich
als verschlüsseltes Secret in Cloudflare Pages hinterlegen.
