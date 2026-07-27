const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

document.querySelectorAll("#year").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

const productSelect = document.getElementById("orderProduct");
const quantitySelect = document.getElementById("quantity");
const totalDisplay = document.getElementById("orderTotal");
const totalInput = document.getElementById("orderTotalInput");

function updateOrderTotal() {
  if (!productSelect || !quantitySelect || !totalDisplay || !totalInput) return;
  const option = productSelect.options[productSelect.selectedIndex];
  const price = Number(option?.dataset?.price || 0);
  const quantity = Number(quantitySelect.value || 1);
  if (!price) {
    totalDisplay.textContent = "—";
    totalInput.value = "";
    return;
  }
  const total = (price * quantity) + 89;
  totalDisplay.textContent = `${total.toLocaleString("cs-CZ")} Kč`;
  totalInput.value = `${total} Kč`;
}

if (productSelect) {
  const requestedProduct = new URLSearchParams(window.location.search).get("produkt");
  if (requestedProduct) productSelect.value = requestedProduct;
  productSelect.addEventListener("change", updateOrderTotal);
  quantitySelect.addEventListener("change", updateOrderTotal);
  updateOrderTotal();
}
