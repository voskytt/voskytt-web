# VOSKYTT – objednávka V6

Změna oproti V5:
- BADAMAN JERSEY už nemá limit 1 kus na objednávku.
- Počet dresů se zadává číslem bez horního limitu.
- Celková série zůstává limitovaná na 15 kusů.

Nahraj všechny soubory do kořene GitHub repozitáře a přepiš staré verze.


## Galerie BADAMAN TEE
Obsahuje 12 fotografií, ovládání šipkami, swipe na mobilu, náhledy, zvětšení a samostatnou velikostní tabulku.

## V7 objednávky přes Cloudflare + Resend
- Cloudflare Pages secret: `RESEND_API_KEY`
- Endpoint: `/api/order` (`functions/api/order.js`)
- Objednávky se posílají na `voskytt@icloud.com`
- Pro první test se používá odesílatel `onboarding@resend.dev`. To funguje pro testovací odesílání na e-mail vlastníka Resend účtu. Pro ostrý vlastní odesílatel je potřeba ověřit `voskytt.cz` v Resendu a změnit `from` ve funkci.
