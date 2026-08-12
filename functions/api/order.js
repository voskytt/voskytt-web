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
  if (teeQty > 0) {
    rows.push(`<tr><td style="padding:10px 0;border-bottom:1px solid #e7e7e7">BADAMAN TEE<br><span style="color:#666">Velikost ${esc(teeSize)}</span></td><td style="padding:10px 0;border-bottom:1px solid #e7e7e7;text-align:center">${teeQty} ks</td><td style="padding:10px 0;border-bottom:1px solid #e7e7e7;text-align:right">${money(teeQty * TEE_PRICE)}</td></tr>`);
  }
  if (jerseyQty > 0) {
    rows.push(`<tr><td style="padding:10px 0;border-bottom:1px solid #e7e7e7">BADAMAN JERSEY<br><span style="color:#666">Velikost ${esc(jerseySize)}</span></td><td style="padding:10px 0;border-bottom:1px solid #e7e7e7;text-align:center">${jerseyQty} ks</td><td style="padding:10px 0;border-bottom:1px solid #e7e7e7;text-align:right">${money(jerseyQty * JERSEY_PRICE)}</td></tr>`);
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
      <body style="margin:0;padding:0;background:#0a0a0a;color:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
        <div style="max-width:680px;margin:0 auto;padding:42px 22px">
          <div style="border-bottom:1px solid #2b2b2b;padding-bottom:24px;margin-bottom:32px">
            <div style="font-size:24px;font-weight:800;letter-spacing:3px">VOSKYTT</div>
            <div style="font-size:11px;letter-spacing:3px;color:#999;margin-top:8px">BADAMAN DROP</div>
          </div>

          <h1 style="font-size:28px;line-height:1.15;margin:0 0 20px">Platební údaje k objednávce</h1>
          <p style="color:#bdbdbd;margin:0 0 28px">Objednávka <strong style="color:#fff">${esc(orderNumber)}</strong></p>
          <p style="font-size:16px;line-height:1.7">Ahoj ${esc(name)},<br><br>děkujeme za tvou objednávku v rámci BADAMAN DROPU. Níže najdeš souhrn objednávky a platební údaje k jejímu dokončení.</p>

          <div style="border:1px solid #2c2c2c;padding:22px;margin:30px 0">
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#aaa;margin-bottom:14px">SOUHRN OBJEDNÁVKY</div>
            <table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px;color:#f5f5f5">
              ${productRows({ teeQty, teeSize, jerseyQty, jerseySize, money })}
              <tr><td style="padding:10px 0;border-bottom:1px solid #e7e7e7">Zásilkovna</td><td></td><td style="padding:10px 0;border-bottom:1px solid #e7e7e7;text-align:right">${money(SHIPPING)}</td></tr>
              <tr><td colspan="2" style="padding:18px 0 4px;font-weight:800">CELKEM K ÚHRADĚ</td><td style="padding:18px 0 4px;text-align:right;font-size:20px;font-weight:800">${money(total)}</td></tr>
            </table>
          </div>

          <div style="background:#f4f4f1;color:#0a0a0a;padding:24px;margin:30px 0">
            <div style="font-size:11px;font-weight:800;letter-spacing:2px;margin-bottom:16px">PLATEBNÍ ÚDAJE</div>
            <p style="margin:6px 0"><strong>Číslo účtu:</strong> ${BANK_ACCOUNT}</p>
            <p style="margin:6px 0"><strong>Příjemce:</strong> ${BANK_RECIPIENT}</p>
            <p style="margin:6px 0"><strong>Variabilní symbol:</strong> ${esc(variableSymbol)}</p>
          </div>

          <p style="color:#bdbdbd;line-height:1.7">Po přijetí platby objednávku potvrdíme a zařadíme do výroby po skončení dropu.</p>
          <p style="color:#bdbdbd;line-height:1.7"><strong style="color:#fff">Předpokládaná doba dodání:</strong><br>BADAMAN TEE: 2–3 týdny<br>BADAMAN JERSEY: 4–6 týdnů</p>
          <p style="color:#bdbdbd;line-height:1.7">Pokud objednávka obsahuje oba produkty, budou odeslány společně podle delší dodací lhůty.</p>
          <p style="margin-top:32px">Děkujeme za podporu značky.<br><strong>VOSKYTT</strong></p>
          <p style="font-size:12px;color:#777;margin-top:28px">Na tento e-mail můžeš odpovědět — odpověď dorazí na voskytt@icloud.com.</p>
        </div>
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
