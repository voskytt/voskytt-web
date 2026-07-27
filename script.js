const modal = document.getElementById("orderModal");
const form = document.getElementById("orderForm");
const productInput = document.getElementById("product");
const priceInput = document.getElementById("price");
const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const totalPrice = document.getElementById("totalPrice");

function openModal(product, price) {
  const delivery = 89;
  productInput.value = product;
  priceInput.value = price;
  modalTitle.textContent = product;
  modalPrice.textContent = `${price} Kč + doprava ${delivery} Kč`;
  totalPrice.textContent = `${Number(price) + delivery} Kč`;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setTimeout(() => document.getElementById("name").focus(), 100);
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

document.querySelectorAll(".order-button").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".product");
    openModal(card.dataset.product, card.dataset.price);
  });
});

document.querySelectorAll("[data-close-modal]").forEach((el) => {
  el.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = {
    product: productInput.value,
    price: Number(priceInput.value),
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    size: document.getElementById("size").value,
    pickup: document.getElementById("pickup").value.trim(),
    note: document.getElementById("note").value.trim()
  };

  const total = data.price + 89;
  const subject = `Objednávka VOSKYTT — ${data.product} / ${data.size}`;
  const body = [
    "NOVÁ OBJEDNÁVKA VOSKYTT",
    "",
    `Produkt: ${data.product}`,
    `Velikost: ${data.size}`,
    `Cena produktu: ${data.price} Kč`,
    "Doprava — Zásilkovna: 89 Kč",
    `Celkem: ${total} Kč`,
    "",
    `Jméno: ${data.name}`,
    `E-mail: ${data.email}`,
    `Telefon: ${data.phone}`,
    `Výdejní místo Zásilkovny: ${data.pickup}`,
    `Poznámka: ${data.note || "—"}`,
    "",
    "Prosím o potvrzení objednávky a zaslání údajů k platbě bankovním převodem."
  ].join("\n");

  window.location.href =
    `mailto:voskytt@icloud.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
document.getElementById("year").textContent = new Date().getFullYear();
