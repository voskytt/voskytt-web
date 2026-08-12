const SHIPPING = 89;
const TEE_PRICE = 799;
const JERSEY_PRICE = 899;

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

    const teeLine = teeQty > 0
      ? `${teeQty} ks · velikost ${teeSize} · ${money(teeQty * TEE_PRICE)}`
      : "Neobjednáno";
    const jerseyLine = jerseyQty > 0
      ? `${jerseyQty} ks · velikost ${jerseySize} · ${money(jerseyQty * JERSEY_PRICE)}`
      : "Neobjednáno";

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:auto;color:#111;line-height:1.55">
        <h1 style="font-size:24px;margin-bottom:4px">Nová objednávka VOSKYTT</h1>
        <p style="margin-top:0;color:#555">BADAMAN DROP</p>
        <hr style="border:0;border-top:1px solid #ddd;margin:24px 0">
        <h2 style="font-size:17px">Produkty</h2>
        <p><strong>BADAMAN TEE:</strong> ${esc(teeLine)}</p>
        <p><strong>BADAMAN JERSEY:</strong> ${esc(jerseyLine)}</p>
        <p><strong>Doprava:</strong> ${money(SHIPPING)}</p>
        <p style="font-size:20px"><strong>CELKEM: ${money(total)}</strong></p>
        <hr style="border:0;border-top:1px solid #ddd;margin:24px 0">
        <h2 style="font-size:17px">Zákazník</h2>
        <p><strong>Jméno:</strong> ${esc(name)}<br>
        <strong>E-mail:</strong> ${esc(email)}<br>
        <strong>Telefon:</strong> ${esc(phone)}<br>
        <strong>Země:</strong> ${esc(country)}<br>
        <strong>Výdejní místo:</strong> ${esc(pickup)}</p>
        <p><strong>Poznámka:</strong><br>${esc(note || "—")}</p>
      </div>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "VOSKYTT Orders <onboarding@resend.dev>",
        to: ["voskytt@icloud.com"],
        subject: `Nová objednávka VOSKYTT — ${name}`,
        html,
      }),
    });

    const resendData = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      console.error("Resend error", resendResponse.status, resendData);
      return json({ success: false, error: "E-mail se nepodařilo odeslat." }, 502);
    }

    return json({ success: true, id: resendData.id || null });
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
