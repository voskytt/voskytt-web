const select = document.getElementById('productSelect');
const total = document.getElementById('totalPrice');
const params = new URLSearchParams(window.location.search);
const preset = params.get('produkt');
if (preset === 'tee') select.value = 'BADAMAN TEE';
if (preset === 'jersey') select.value = 'BADAMAN JERSEY';
function updateTotal() {
  const option = select.options[select.selectedIndex];
  const price = Number(option?.dataset.price || 0);
  total.textContent = price ? `${price + 89} Kč` : '—';
}
select.addEventListener('change', updateTotal);
updateTotal();
