const SHIPPING = 89;
const TEE_PRICE = 799;
const JERSEY_PRICE = 899;

const form = document.getElementById("orderForm");
const teeQuantity = document.getElementById("teeQuantity");
const teeSize = document.getElementById("teeSize");
const jerseyQuantity = document.getElementById("jerseyQuantity");
const jerseySize = document.getElementById("jerseySize");
const productError = document.getElementById("productError");
const hiddenTee = document.getElementById("hiddenTee");
const hiddenJersey = document.getElementById("hiddenJersey");
const hiddenTotal = document.getElementById("hiddenTotal");
const teeSummaryValue = document.getElementById("teeSummaryValue");
const jerseySummaryValue = document.getElementById("jerseySummaryValue");
const summarySubtotal = document.getElementById("summarySubtotal");
const summaryShipping = document.getElementById("summaryShipping");
const summaryTotal = document.getElementById("summaryTotal");
const modal = document.getElementById("confirmModal");
const modalTotal = document.getElementById("modalTotal");
const cancelSubmit = document.getElementById("cancelSubmit");
const confirmSubmit = document.getElementById("confirmSubmit");
let submissionConfirmed = false;

function formatCzk(value) {
  return `${value.toLocaleString("cs-CZ")} Kč`;
}

function selectedOrder() {
  const teeCount = Number(teeQuantity.value);
  const jerseyCount = Number(jerseyQuantity.value);
  const subtotal = teeCount * TEE_PRICE + jerseyCount * JERSEY_PRICE;
  const shipping = subtotal > 0 ? SHIPPING : 0;
  return { teeCount, jerseyCount, subtotal, shipping, total: subtotal + shipping };
}

function updateRequiredSizes() {
  teeSize.required = Number(teeQuantity.value) > 0;
  jerseySize.required = Number(jerseyQuantity.value) > 0;
  teeSize.disabled = Number(teeQuantity.value) === 0;
  jerseySize.disabled = Number(jerseyQuantity.value) === 0;
  if (teeSize.disabled) teeSize.value = "";
  if (jerseySize.disabled) jerseySize.value = "";
}

function updateSummary() {
  updateRequiredSizes();
  const order = selectedOrder();

  teeSummaryValue.textContent = order.teeCount > 0
    ? `${order.teeCount} ks · ${teeSize.value || "bez velikosti"}`
    : "0 ks";
  jerseySummaryValue.textContent = order.jerseyCount > 0
    ? `${order.jerseyCount} ks · ${jerseySize.value || "bez velikosti"}`
    : "0 ks";
  summarySubtotal.textContent = formatCzk(order.subtotal);
  summaryShipping.textContent = formatCzk(order.shipping);
  summaryTotal.textContent = formatCzk(order.total);
  modalTotal.textContent = formatCzk(order.total);

  hiddenTee.value = order.teeCount > 0
    ? `${order.teeCount} ks, velikost ${teeSize.value}, ${formatCzk(order.teeCount * TEE_PRICE)}`
    : "Neobjednáno";
  hiddenJersey.value = order.jerseyCount > 0
    ? `${order.jerseyCount} ks, velikost ${jerseySize.value}, ${formatCzk(order.jerseyCount * JERSEY_PRICE)}`
    : "Neobjednáno";
  hiddenTotal.value = formatCzk(order.total);
  productError.textContent = "";
}

function validateProducts() {
  const order = selectedOrder();
  if (order.teeCount === 0 && order.jerseyCount === 0) {
    productError.textContent = "Vyber alespoň jeden produkt.";
    teeQuantity.focus();
    return false;
  }
  if (order.teeCount > 0 && !teeSize.value) {
    productError.textContent = "Vyber velikost trička.";
    teeSize.focus();
    return false;
  }
  if (order.jerseyCount > 0 && !jerseySize.value) {
    productError.textContent = "Vyber velikost dresu.";
    jerseySize.focus();
    return false;
  }
  productError.textContent = "";
  return true;
}

function openModal() {
  modal.hidden = false;
  document.body.classList.add("modal-open");
  confirmSubmit.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

[teeQuantity, teeSize, jerseyQuantity, jerseySize].forEach((element) => {
  element.addEventListener("change", updateSummary);
});

const requestedProduct = new URLSearchParams(window.location.search).get("produkt");
if (requestedProduct === "jersey") jerseyQuantity.value = "1";
else if (requestedProduct === "tee") teeQuantity.value = "1";

form.addEventListener("submit", (event) => {
  updateSummary();
  if (!validateProducts()) {
    event.preventDefault();
    return;
  }
  if (!submissionConfirmed) {
    event.preventDefault();
    openModal();
  }
});

confirmSubmit.addEventListener("click", () => {
  submissionConfirmed = true;
  closeModal();
  form.requestSubmit();
});

cancelSubmit.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-modal")) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

updateSummary();
