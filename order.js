const SHIPPING = 89;
const product = document.getElementById("product");
const quantity = document.getElementById("quantity");
const summaryProduct = document.getElementById("summaryProduct");
const summaryUnit = document.getElementById("summaryUnit");
const summaryQuantity = document.getElementById("summaryQuantity");
const summaryTotal = document.getElementById("summaryTotal");
const limitNote = document.getElementById("limitNote");
const hiddenProductPrice = document.getElementById("hiddenProductPrice");
const hiddenTotal = document.getElementById("hiddenTotal");

const productNames = {
  tee: "BADAMAN TEE",
  jersey: "BADAMAN JERSEY"
};

function formatCzk(value) {
  return `${value.toLocaleString("cs-CZ")} Kč`;
}

function updateSummary() {
  const selectedOption = product.options[product.selectedIndex];
  const key = product.value;
  const unitPrice = Number(selectedOption.dataset.price);

  if (key === "jersey" && Number(quantity.value) > 1) {
    quantity.value = "1";
  }

  Array.from(quantity.options).forEach((option) => {
    option.disabled = key === "jersey" && option.value !== "1";
  });

  const count = Number(quantity.value);
  const total = unitPrice * count + SHIPPING;

  summaryProduct.textContent = productNames[key];
  summaryUnit.textContent = formatCzk(unitPrice);
  summaryQuantity.textContent = String(count);
  summaryTotal.textContent = formatCzk(total);
  hiddenProductPrice.value = `${formatCzk(unitPrice)} za kus`;
  hiddenTotal.value = formatCzk(total);

  limitNote.textContent = key === "jersey"
    ? "BADAMAN JERSEY je limitovaný na 15 kusů celkem. V jedné objednávce lze objednat 1 kus."
    : "BADAMAN TEE je dostupné v rámci předobjednávky po dobu dropu.";
}

const params = new URLSearchParams(window.location.search);
const requestedProduct = params.get("produkt");
if (requestedProduct === "jersey" || requestedProduct === "tee") {
  product.value = requestedProduct;
}

product.addEventListener("change", updateSummary);
quantity.addEventListener("change", updateSummary);
updateSummary();
