// HTML E-Mail Templates fuer Barbier Berlin
// Responsive, mobile-friendly, mit Brand-Farben Gold (#c8a55a) und Dark (#1a1a2e)

const BRAND_GOLD = '#c8a55a';
const BRAND_DARK = '#1a1a2e';
const BRAND_DARK_LIGHT = '#2a2a4e';
const TEXT_LIGHT = '#e0e0e0';
const TEXT_MUTED = '#a0a0a0';
const BG_BODY = '#121212';
const WHITE = '#ffffff';

function baseLayout(content: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="de" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Barbier Berlin</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: ${BG_BODY}; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 0 16px !important; }
      .content-cell { padding: 24px 20px !important; }
      .header-cell { padding: 24px 20px !important; }
      .detail-table { width: 100% !important; }
      .detail-label { display: block !important; width: 100% !important; padding-bottom: 4px !important; }
      .detail-value { display: block !important; width: 100% !important; }
      h1 { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${BG_BODY}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preheader Text -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${preheader}</div>
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BG_BODY};">
    <tr>
      <td align="center" style="padding: 24px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" class="container" style="max-width:560px; width:100%;">
          <!-- Header -->
          <tr>
            <td class="header-cell" align="center" style="padding: 32px 40px 24px; background-color:${BRAND_DARK}; border-radius: 12px 12px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="font-size:28px; font-weight:700; color:${BRAND_GOLD}; letter-spacing:2px; text-transform:uppercase;">
                      &#9986; Barbier Berlin
                    </div>
                    <div style="font-size:12px; color:${TEXT_MUTED}; letter-spacing:3px; text-transform:uppercase; margin-top:6px;">
                      Ihr Barbershop in Berlin
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content-cell" style="padding: 32px 40px; background-color:${BRAND_DARK_LIGHT};">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color:${BRAND_DARK}; border-radius: 0 0 12px 12px; text-align:center;">
              <p style="margin:0 0 8px; color:${TEXT_MUTED}; font-size:13px;">
                Barbier Berlin &middot; Ihr Premium Barbershop
              </p>
              <p style="margin:0 0 8px; color:${TEXT_MUTED}; font-size:12px;">
                Mo-Fr 10:00&ndash;18:00 &middot; Sa 10:00&ndash;17:00
              </p>
              <p style="margin:0; color:${TEXT_MUTED}; font-size:12px;">
                <a href="https://barbier.berlin" style="color:${BRAND_GOLD}; text-decoration:none;">barbier.berlin</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td class="detail-label" style="padding: 8px 12px; color:${TEXT_MUTED}; font-size:14px; white-space:nowrap; vertical-align:top; width:120px;">
      ${label}
    </td>
    <td class="detail-value" style="padding: 8px 12px; color:${WHITE}; font-size:14px; font-weight:600; vertical-align:top;">
      ${value}
    </td>
  </tr>`;
}

function detailsTable(rows: Array<{ label: string; value: string }>): string {
  const rowsHtml = rows.map((r) => detailRow(r.label, r.value)).join('');
  return `<table role="presentation" class="detail-table" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND_DARK}; border-radius:8px; margin: 20px 0;">
    ${rowsHtml}
  </table>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
    <tr>
      <td align="center" style="background-color:${BRAND_GOLD}; border-radius:6px;">
        <a href="${url}" target="_blank" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:700; color:${BRAND_DARK}; text-decoration:none; letter-spacing:0.5px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

// ---------- Datentypen ----------

export interface BookingEmailData {
  customerName: string;
  serviceName: string;
  date: string;       // z.B. "2026-04-15"
  startTime: string;  // z.B. "14:30"
  endTime: string;    // z.B. "15:00"
  price: number;
  bookingId: string;
}

export interface CancellationEmailData {
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  bookingId: string;
}

export interface ReminderEmailData {
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}

export interface WelcomeEmailData {
  customerName: string;
}

// ---------- Helper ----------

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

function formatPrice(price: number): string {
  return `${price.toFixed(2).replace('.', ',')} \u20AC`;
}

// ---------- Templates ----------

export function bookingConfirmationHtml(data: BookingEmailData): string {
  const content = `
    <h1 style="margin:0 0 8px; color:${BRAND_GOLD}; font-size:24px; font-weight:700;">
      Buchung best&auml;tigt
    </h1>
    <p style="margin:0 0 20px; color:${TEXT_LIGHT}; font-size:15px; line-height:1.6;">
      Hallo ${data.customerName},<br>
      vielen Dank f&uuml;r Ihre Buchung! Hier sind Ihre Termindetails:
    </p>

    ${detailsTable([
      { label: 'Service', value: data.serviceName },
      { label: 'Datum', value: formatDate(data.date) },
      { label: 'Uhrzeit', value: `${data.startTime} &ndash; ${data.endTime} Uhr` },
      { label: 'Preis', value: formatPrice(data.price) },
      { label: 'Buchungs-Nr.', value: data.bookingId.substring(0, 8).toUpperCase() },
    ])}

    ${ctaButton('Meine Termine ansehen', 'https://barbier.berlin/dashboard')}

    <div style="margin-top:24px; padding:16px; background-color:${BRAND_DARK}; border-radius:8px; border-left:3px solid ${BRAND_GOLD};">
      <p style="margin:0; color:${TEXT_MUTED}; font-size:13px; line-height:1.5;">
        <strong style="color:${BRAND_GOLD};">Stornierungspolicy:</strong> Kostenlose Stornierung bis 24 Stunden vor dem Termin.
        Sp&auml;tere Stornierungen sind leider nicht m&ouml;glich. Sie k&ouml;nnen Ihren Termin
        jederzeit &uuml;ber Ihr <a href="https://barbier.berlin/dashboard" style="color:${BRAND_GOLD}; text-decoration:underline;">Dashboard</a> verwalten.
      </p>
    </div>
  `;

  return baseLayout(content, `Ihr Termin am ${formatDate(data.date)} um ${data.startTime} Uhr ist bestaetigt.`);
}

export function bookingConfirmationText(data: BookingEmailData): string {
  return `Buchung bestaetigt

Hallo ${data.customerName},
vielen Dank fuer Ihre Buchung!

Termindetails:
- Service: ${data.serviceName}
- Datum: ${formatDate(data.date)}
- Uhrzeit: ${data.startTime} - ${data.endTime} Uhr
- Preis: ${formatPrice(data.price)}
- Buchungs-Nr.: ${data.bookingId.substring(0, 8).toUpperCase()}

Stornierungspolicy: Kostenlose Stornierung bis 24 Stunden vor dem Termin.

Termine verwalten: https://barbier.berlin/dashboard

Barbier Berlin - Ihr Barbershop in Berlin
https://barbier.berlin`;
}

export function bookingCancellationHtml(data: CancellationEmailData): string {
  const content = `
    <h1 style="margin:0 0 8px; color:${BRAND_GOLD}; font-size:24px; font-weight:700;">
      Termin storniert
    </h1>
    <p style="margin:0 0 20px; color:${TEXT_LIGHT}; font-size:15px; line-height:1.6;">
      Hallo ${data.customerName},<br>
      Ihr Termin wurde erfolgreich storniert.
    </p>

    ${detailsTable([
      { label: 'Service', value: data.serviceName },
      { label: 'Datum', value: formatDate(data.date) },
      { label: 'Uhrzeit', value: `${data.startTime} Uhr` },
      { label: 'Buchungs-Nr.', value: data.bookingId.substring(0, 8).toUpperCase() },
      { label: 'Status', value: '<span style="color:#e74c3c;">Storniert</span>' },
    ])}

    <p style="margin:20px 0 0; color:${TEXT_LIGHT}; font-size:15px; line-height:1.6;">
      M&ouml;chten Sie einen neuen Termin buchen? Wir freuen uns auf Ihren Besuch!
    </p>

    ${ctaButton('Neuen Termin buchen', 'https://barbier.berlin/booking')}
  `;

  return baseLayout(content, `Ihr Termin am ${formatDate(data.date)} wurde storniert.`);
}

export function bookingCancellationText(data: CancellationEmailData): string {
  return `Termin storniert

Hallo ${data.customerName},
Ihr Termin wurde erfolgreich storniert.

Details:
- Service: ${data.serviceName}
- Datum: ${formatDate(data.date)}
- Uhrzeit: ${data.startTime} Uhr
- Buchungs-Nr.: ${data.bookingId.substring(0, 8).toUpperCase()}
- Status: Storniert

Neuen Termin buchen: https://barbier.berlin/booking

Barbier Berlin - Ihr Barbershop in Berlin
https://barbier.berlin`;
}

export function bookingReminderHtml(data: ReminderEmailData): string {
  const content = `
    <h1 style="margin:0 0 8px; color:${BRAND_GOLD}; font-size:24px; font-weight:700;">
      Erinnerung: Morgen ist Ihr Termin
    </h1>
    <p style="margin:0 0 20px; color:${TEXT_LIGHT}; font-size:15px; line-height:1.6;">
      Hallo ${data.customerName},<br>
      wir m&ouml;chten Sie an Ihren morgigen Termin erinnern:
    </p>

    ${detailsTable([
      { label: 'Service', value: data.serviceName },
      { label: 'Datum', value: formatDate(data.date) },
      { label: 'Uhrzeit', value: `${data.startTime} &ndash; ${data.endTime} Uhr` },
      { label: 'Preis', value: formatPrice(data.price) },
    ])}

    <div style="margin:20px 0; padding:16px; background-color:${BRAND_DARK}; border-radius:8px; text-align:center;">
      <p style="margin:0; color:${BRAND_GOLD}; font-size:15px; font-weight:600;">
        &#128345; Bitte kommen Sie p&uuml;nktlich &mdash; wir freuen uns auf Sie!
      </p>
    </div>

    ${ctaButton('Meine Termine ansehen', 'https://barbier.berlin/dashboard')}

    <div style="margin-top:16px; padding:12px 16px; background-color:${BRAND_DARK}; border-radius:8px; border-left:3px solid ${BRAND_GOLD};">
      <p style="margin:0; color:${TEXT_MUTED}; font-size:13px; line-height:1.5;">
        <strong style="color:${BRAND_GOLD};">Hinweis:</strong> Kostenlose Stornierung ist nur bis 24 Stunden vor dem Termin m&ouml;glich.
      </p>
    </div>
  `;

  return baseLayout(content, `Erinnerung: Ihr Termin morgen um ${data.startTime} Uhr bei Barbier Berlin.`);
}

export function bookingReminderText(data: ReminderEmailData): string {
  return `Erinnerung: Morgen ist Ihr Termin

Hallo ${data.customerName},
wir moechten Sie an Ihren morgigen Termin erinnern:

- Service: ${data.serviceName}
- Datum: ${formatDate(data.date)}
- Uhrzeit: ${data.startTime} - ${data.endTime} Uhr
- Preis: ${formatPrice(data.price)}

Bitte kommen Sie puenktlich - wir freuen uns auf Sie!

Termine verwalten: https://barbier.berlin/dashboard

Barbier Berlin - Ihr Barbershop in Berlin
https://barbier.berlin`;
}

export function welcomeEmailHtml(data: WelcomeEmailData): string {
  const content = `
    <h1 style="margin:0 0 8px; color:${BRAND_GOLD}; font-size:24px; font-weight:700;">
      Willkommen bei Barbier Berlin!
    </h1>
    <p style="margin:0 0 20px; color:${TEXT_LIGHT}; font-size:15px; line-height:1.6;">
      Hallo ${data.customerName},<br>
      sch&ouml;n, dass Sie sich bei uns registriert haben! Ab sofort k&ouml;nnen Sie bequem online Termine buchen und verwalten.
    </p>

    <div style="margin:24px 0; padding:20px; background-color:${BRAND_DARK}; border-radius:8px;">
      <h2 style="margin:0 0 12px; color:${BRAND_GOLD}; font-size:18px; font-weight:700;">
        &#11088; Bonuspunkte-Programm
      </h2>
      <p style="margin:0 0 12px; color:${TEXT_LIGHT}; font-size:14px; line-height:1.6;">
        Mit jedem Besuch sammeln Sie Punkte, die Sie f&uuml;r kostenlose Services einl&ouml;sen k&ouml;nnen:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND_DARK_LIGHT}; border-radius:6px;">
              <tr>
                <td style="padding:12px 16px; text-align:center; width:33%;">
                  <div style="color:${BRAND_GOLD}; font-size:24px; font-weight:700;">1&times;</div>
                  <div style="color:${TEXT_MUTED}; font-size:12px; margin-top:4px;">Besuch = Punkte</div>
                </td>
                <td style="padding:12px 16px; text-align:center; width:33%;">
                  <div style="color:${BRAND_GOLD}; font-size:24px; font-weight:700;">&#8594;</div>
                  <div style="color:${TEXT_MUTED}; font-size:12px; margin-top:4px;">Sammeln</div>
                </td>
                <td style="padding:12px 16px; text-align:center; width:33%;">
                  <div style="color:${BRAND_GOLD}; font-size:24px; font-weight:700;">&#127873;</div>
                  <div style="color:${TEXT_MUTED}; font-size:12px; margin-top:4px;">Gratis-Service</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 8px; color:${TEXT_LIGHT}; font-size:15px; line-height:1.6;">
      Buchen Sie jetzt Ihren ersten Termin:
    </p>

    ${ctaButton('Jetzt Termin buchen', 'https://barbier.berlin/booking')}

    <p style="margin:24px 0 0; color:${TEXT_MUTED}; font-size:13px; line-height:1.5; text-align:center;">
      Bei Fragen erreichen Sie uns jederzeit unter
      <a href="mailto:info@barbier.berlin" style="color:${BRAND_GOLD}; text-decoration:none;">info@barbier.berlin</a>
    </p>
  `;

  return baseLayout(content, `Willkommen bei Barbier Berlin, ${data.customerName}! Buchen Sie jetzt Ihren ersten Termin.`);
}

export function welcomeEmailText(data: WelcomeEmailData): string {
  return `Willkommen bei Barbier Berlin!

Hallo ${data.customerName},
schoen, dass Sie sich bei uns registriert haben!

Ab sofort koennen Sie bequem online Termine buchen und verwalten.

Bonuspunkte-Programm:
Mit jedem Besuch sammeln Sie Punkte, die Sie fuer kostenlose Services einloesen koennen.

Jetzt Termin buchen: https://barbier.berlin/booking

Bei Fragen: info@barbier.berlin

Barbier Berlin - Ihr Barbershop in Berlin
https://barbier.berlin`;
}
