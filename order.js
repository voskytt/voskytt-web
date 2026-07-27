const product = document.getElementById("product");
const quantity = document.getElementById("quantity");
const totalPrice = document.getElementById("totalPrice");
const hiddenTotal = document.getElementById("hiddenTotal");

function updateTotal() {
  const selected = product.options[product.selectedIndex];
  const unitPrice = Number(selected.dataset.price);
  const count = Number(quantity.value);
  const total = unitPrice * count + 89;
  const text = `${total.toLocaleString("cs-CZ")} Kč`;
  totalPrice.textContent = text;
  hiddenTotal.value = text;
}

const params = new URLSearchParams(window.location.search);
if (params.get("produkt") === "jersey") product.selectedIndex = 1;
product.addEventListener("change", updateTotal);
quantity.addEventListener("change", updateTotal);
updateTotal();
