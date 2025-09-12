document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map").setView([51.505, -0.09], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  let marker;
  map.on("click", e => {
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
    document.querySelector("[name=latitude]").value = e.latlng.lat;
    document.querySelector("[name=longitude]").value = e.latlng.lng;
    document.getElementById("submit-btn").disabled = !document.getElementById("order-form").checkValidity();
  });

  const orderDetails = document.getElementById("order-details");
  if (orderDetails) {
    const lastOrder = sessionStorage.getItem("lastOrder");
    if (lastOrder) {
      const order = JSON.parse(lastOrder);
      orderDetails.innerHTML = \`<pre>\${JSON.stringify(order, null, 2)}</pre>\`;
    }
  }
});