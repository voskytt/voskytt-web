const SHIPPING = 89;
const TEE_PRICE = 799;
const JERSEY_PRICE = 899;
const OWNER_EMAIL = "voskytt@icloud.com";
const FROM_EMAIL = "VOSKYTT <orders@voskytt.cz>";
const BANK_ACCOUNT = "7437433003/5500";
const BANK_RECIPIENT = "Dominik Vostrčil";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clampQty(value) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n >= 0 && n <= 5 ? n : null;
}

function validSize(value) {
  return ["S", "M", "L", "XL", "XXL"].includes(value) ? value : "";
}

function createOrderIds() {
  const now = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  const date = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const time = `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  const random = Math.floor(Math.random() * 900 + 100);
  const orderNumber = `BD-${date}-${time}-${random}`;
  // VS must be numeric and max. 10 digits. Timestamp seconds gives a compact unique-ish value.
  const variableSymbol = String(Math.floor(now.getTime() / 1000)).slice(-10);
  return { orderNumber, variableSymbol };
}

function productRows({ teeQty, teeSize, jerseyQty, jerseySize, money }) {
  const rows = [];
  const nameStyle = "padding:14px 0;border-bottom:1px solid #dddddd;color:#111111!important;-webkit-text-fill-color:#111111;font-weight:700;line-height:1.45";
  const qtyStyle = "padding:14px 8px;border-bottom:1px solid #dddddd;text-align:center;color:#111111!important;-webkit-text-fill-color:#111111;white-space:nowrap";
  const priceStyle = "padding:14px 0;border-bottom:1px solid #dddddd;text-align:right;color:#111111!important;-webkit-text-fill-color:#111111;font-weight:700;white-space:nowrap";
  if (teeQty > 0) {
    rows.push(`<tr><td style="${nameStyle}">BADAMAN TEE<br><span style="color:#555555!important;-webkit-text-fill-color:#555555;font-weight:400">Velikost ${esc(teeSize)}</span></td><td style="${qtyStyle}">${teeQty} ks</td><td style="${priceStyle}">${money(teeQty * TEE_PRICE)}</td></tr>`);
  }
  if (jerseyQty > 0) {
    rows.push(`<tr><td style="${nameStyle}">BADAMAN JERSEY<br><span style="color:#555555!important;-webkit-text-fill-color:#555555;font-weight:400">Velikost ${esc(jerseySize)}</span></td><td style="${qtyStyle}">${jerseyQty} ks</td><td style="${priceStyle}">${money(jerseyQty * JERSEY_PRICE)}</td></tr>`);
  }
  return rows.join("");
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    if (!env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return json({ success: false, error: "Server není nakonfigurovaný." }, 500);
    }

    const form = await request.formData();

    // Honeypot: bots often fill hidden fields.
    if (String(form.get("website") || "").trim()) {
      return json({ success: true });
    }

    const name = String(form.get("Jméno a příjmení") || "").trim();
    const email = String(form.get("E-mail") || "").trim();
    const phone = String(form.get("Telefon") || "").trim();
    const country = String(form.get("Země") || "").trim();
    const pickup = String(form.get("Výdejní místo Zásilkovny") || "").trim();
    const note = String(form.get("Poznámka") || "").trim();
    const consent = String(form.get("Souhlas se zpracováním údajů") || "").trim();

    const teeQty = clampQty(form.get("teeQuantity"));
    const jerseyQty = clampQty(form.get("jerseyQuantity"));
    const teeSize = validSize(String(form.get("teeSize") || ""));
    const jerseySize = validSize(String(form.get("jerseySize") || ""));

    if (!name || !email || !phone || !country || !pickup || consent !== "Ano") {
      return json({ success: false, error: "Chybí povinné údaje." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ success: false, error: "Neplatný e-mail." }, 400);
    }
    if (teeQty === null || jerseyQty === null || (teeQty === 0 && jerseyQty === 0)) {
      return json({ success: false, error: "Neplatný počet produktů." }, 400);
    }
    if (jerseyQty > 0) {
      return json({ success: false, error: "BADAMAN JERSEY je vyprodaný." }, 409);
    }
    if (teeQty > 0 && !teeSize) {
      return json({ success: false, error: "Chybí velikost trička." }, 400);
    }
    if (jerseyQty > 0 && !jerseySize) {
      return json({ success: false, error: "Chybí velikost dresu." }, 400);
    }
    if (!["Česko", "Slovensko"].includes(country)) {
      return json({ success: false, error: "Neplatná země." }, 400);
    }

    const subtotal = teeQty * TEE_PRICE + jerseyQty * JERSEY_PRICE;
    const total = subtotal + SHIPPING;
    const money = (n) => `${new Intl.NumberFormat("cs-CZ").format(n)} Kč`;
    const { orderNumber, variableSymbol } = createOrderIds();

    const teeLine = teeQty > 0
      ? `${teeQty} ks · velikost ${teeSize} · ${money(teeQty * TEE_PRICE)}`
      : "Neobjednáno";
    const jerseyLine = jerseyQty > 0
      ? `${jerseyQty} ks · velikost ${jerseySize} · ${money(jerseyQty * JERSEY_PRICE)}`
      : "Neobjednáno";

    const ownerHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:auto;color:#111;line-height:1.55">
        <h1 style="font-size:24px;margin-bottom:4px">Nová objednávka VOSKYTT</h1>
        <p style="margin-top:0;color:#555">BADAMAN DROP · ${esc(orderNumber)}</p>
        <hr style="border:0;border-top:1px solid #ddd;margin:24px 0">
        <h2 style="font-size:17px">Produkty</h2>
        <p><strong>BADAMAN TEE:</strong> ${esc(teeLine)}</p>
        <p><strong>BADAMAN JERSEY:</strong> ${esc(jerseyLine)}</p>
        <p><strong>Doprava:</strong> ${money(SHIPPING)}</p>
        <p style="font-size:20px"><strong>CELKEM: ${money(total)}</strong></p>
        <p><strong>Variabilní symbol:</strong> ${esc(variableSymbol)}</p>
        <hr style="border:0;border-top:1px solid #ddd;margin:24px 0">
        <h2 style="font-size:17px">Zákazník</h2>
        <p><strong>Jméno:</strong> ${esc(name)}<br>
        <strong>E-mail:</strong> ${esc(email)}<br>
        <strong>Telefon:</strong> ${esc(phone)}<br>
        <strong>Země:</strong> ${esc(country)}<br>
        <strong>Výdejní místo:</strong> ${esc(pickup)}</p>
        <p><strong>Poznámka:</strong><br>${esc(note || "—")}</p>
      </div>`;

    const customerHtml = `
      <!doctype html>
      <html lang="cs">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta name="color-scheme" content="light only">
        <meta name="supported-color-schemes" content="light">
        <title>VOSKYTT – Platební údaje</title>
        <style>
          :root { color-scheme: light only; supported-color-schemes: light; }
          body, table, td, div, p, h1, h2, span { color:#111111 !important; -webkit-text-fill-color:#111111 !important; }
          .muted { color:#666666 !important; -webkit-text-fill-color:#666666 !important; }
          .white { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
          @media (prefers-color-scheme: dark) {
            body, .email-bg, .email-card { background:#ffffff !important; }
            .summary-box, .payment-box, .info-box { background:#f5f5f2 !important; }
            body, table, td, div, p, h1, h2, span { color:#111111 !important; -webkit-text-fill-color:#111111 !important; }
            .muted { color:#666666 !important; -webkit-text-fill-color:#666666 !important; }
            .white { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
          }
        </style>
      </head>
      <body class="email-bg" bgcolor="#ffffff" style="margin:0;padding:0;background-color:#ffffff!important;color:#111111!important;-webkit-text-fill-color:#111111;font-family:Arial,Helvetica,sans-serif">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;background-color:#ffffff!important">
          <tr>
            <td align="center" bgcolor="#ffffff" style="padding:24px 12px;background-color:#ffffff!important">
              <table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:680px;background-color:#ffffff!important;border-collapse:collapse">
                <tr>
                  <td bgcolor="#111111" style="padding:28px 24px;background-color:#111111!important">
                    <div class="white" style="font-size:25px;font-weight:800;letter-spacing:4px;color:#ffffff!important;-webkit-text-fill-color:#ffffff">VOSKYTT</div>
                    <div class="white" style="font-size:11px;letter-spacing:3px;color:#ffffff!important;-webkit-text-fill-color:#ffffff;margin-top:7px">BADAMAN DROP</div>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#ffffff" style="padding:32px 24px 10px;background-color:#ffffff!important;color:#111111!important;-webkit-text-fill-color:#111111">
                    <h1 style="margin:0 0 12px;font-size:27px;line-height:1.2;color:#111111!important;-webkit-text-fill-color:#111111">Platební údaje k objednávce</h1>
                    <p class="muted" style="margin:0 0 28px;font-size:14px;line-height:1.5;color:#666666!important;-webkit-text-fill-color:#666666">Objednávka <strong style="color:#111111!important;-webkit-text-fill-color:#111111">${esc(orderNumber)}</strong></p>
                    <p style="margin:0;font-size:16px;line-height:1.7;color:#111111!important;-webkit-text-fill-color:#111111">Ahoj ${esc(name)},<br><br>děkujeme za tvou objednávku v rámci BADAMAN DROPU. Níže najdeš souhrn objednávky a platební údaje k jejímu dokončení.</p>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#ffffff" style="padding:20px 24px;background-color:#ffffff!important">
                    <table class="summary-box" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f5f5f2" style="width:100%;background-color:#f5f5f2!important;border:1px solid #dddddd;border-collapse:separate">
                      <tr>
                        <td style="padding:22px;color:#111111!important;-webkit-text-fill-color:#111111">
                          <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#111111!important;-webkit-text-fill-color:#111111;margin-bottom:12px">SOUHRN OBJEDNÁVKY</div>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;font-size:14px;color:#111111!important">
                            <tr>
                              <td style="padding:0 0 8px;color:#666666!important;-webkit-text-fill-color:#666666;font-size:11px;text-transform:uppercase">Produkt</td>
                              <td style="padding:0 8px 8px;text-align:center;color:#666666!important;-webkit-text-fill-color:#666666;font-size:11px;text-transform:uppercase">Počet</td>
                              <td style="padding:0 0 8px;text-align:right;color:#666666!important;-webkit-text-fill-color:#666666;font-size:11px;text-transform:uppercase">Cena</td>
                            </tr>
                            ${productRows({ teeQty, teeSize, jerseyQty, jerseySize, money })}
                            <tr><td style="padding:14px 0;border-bottom:1px solid #dddddd;color:#111111!important;-webkit-text-fill-color:#111111;font-weight:700">Zásilkovna</td><td style="padding:14px 8px;border-bottom:1px solid #dddddd;text-align:center;color:#111111!important;-webkit-text-fill-color:#111111">—</td><td style="padding:14px 0;border-bottom:1px solid #dddddd;text-align:right;color:#111111!important;-webkit-text-fill-color:#111111;font-weight:700;white-space:nowrap">${money(SHIPPING)}</td></tr>
                            <tr><td colspan="2" style="padding:20px 0 4px;color:#111111!important;-webkit-text-fill-color:#111111;font-weight:800;font-size:16px">CELKEM K ÚHRADĚ</td><td style="padding:20px 0 4px;text-align:right;color:#111111!important;-webkit-text-fill-color:#111111;font-size:21px;font-weight:800;white-space:nowrap">${money(total)}</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#ffffff" style="padding:10px 24px 0;background-color:#ffffff!important">
                    <table class="payment-box" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f5f5f2" style="width:100%;background-color:#f5f5f2!important;border-collapse:separate">
                      <tr>
                        <td style="padding:24px;color:#111111!important;-webkit-text-fill-color:#111111">
                          <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#111111!important;-webkit-text-fill-color:#111111;margin-bottom:14px">PLATEBNÍ ÚDAJE</div>
                          <p style="margin:7px 0;font-size:16px;color:#111111!important;-webkit-text-fill-color:#111111"><strong>Číslo účtu:</strong> ${BANK_ACCOUNT}</p>
                          <p style="margin:7px 0;font-size:16px;color:#111111!important;-webkit-text-fill-color:#111111"><strong>Příjemce:</strong> ${BANK_RECIPIENT}</p>
                          <p style="margin:7px 0;font-size:16px;color:#111111!important;-webkit-text-fill-color:#111111"><strong>Variabilní symbol:</strong> ${esc(variableSymbol)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#ffffff" style="padding:28px 24px 8px;background-color:#ffffff!important;color:#111111!important;-webkit-text-fill-color:#111111">
                    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#111111!important;-webkit-text-fill-color:#111111">Po přijetí platby objednávku potvrdíme a zařadíme do výroby po skončení dropu.</p>
                    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#111111!important;-webkit-text-fill-color:#111111"><strong>Předpokládaná doba dodání:</strong><br>BADAMAN TEE: 2–3 týdny<br>BADAMAN JERSEY: 4–6 týdnů</p>
                    <p style="margin:0;font-size:15px;line-height:1.7;color:#111111!important;-webkit-text-fill-color:#111111">Pokud objednávka obsahuje oba produkty, budou odeslány společně podle delší dodací lhůty.</p>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#ffffff" style="padding:26px 24px 34px;background-color:#ffffff!important;color:#111111!important;-webkit-text-fill-color:#111111">
                    <div style="border-top:1px solid #dddddd;padding-top:22px">
                      <p style="margin:0 0 8px;font-size:15px;color:#111111!important;-webkit-text-fill-color:#111111">Děkujeme za podporu značky.<br><strong>VOSKYTT</strong></p>
                      <p class="muted" style="margin:0;font-size:12px;line-height:1.5;color:#666666!important;-webkit-text-fill-color:#666666">Na tento e-mail můžeš odpovědět — odpověď dorazí na voskytt@icloud.com.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`;

    // Send both emails in one API call: one notification to VOSKYTT and one confirmation to the customer.
    const resendResponse = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `order-${orderNumber}`,
      },
      body: JSON.stringify([
        {
          from: FROM_EMAIL,
          to: [OWNER_EMAIL],
          reply_to: email,
          subject: `Nová objednávka VOSKYTT — ${orderNumber} — ${name}`,
          html: ownerHtml,
        },
        {
          from: FROM_EMAIL,
          to: [email],
          reply_to: OWNER_EMAIL,
          subject: `BADAMAN DROP – Platební údaje k objednávce ${orderNumber}`,
          html: customerHtml,
        },
      ]),
    });

    const resendData = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      console.error("Resend batch error", resendResponse.status, resendData);
      return json({ success: false, error: "E-maily se nepodařilo odeslat." }, 502);
    }

    return json({
      success: true,
      orderNumber,
      variableSymbol,
      ids: Array.isArray(resendData.data) ? resendData.data.map((item) => item.id) : [],
    });
  } catch (error) {
    console.error("Order function error", error);
    return json({ success: false, error: "Objednávku se nepodařilo zpracovat." }, 500);
  }
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }
  return onRequestPost(context);
}
