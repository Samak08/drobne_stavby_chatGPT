document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("order-form");
  const submitBtn = document.getElementById("submit-btn");

  form.addEventListener("input", () => {
    submitBtn.disabled = !form.checkValidity();
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());
    body.checkbox = form.querySelector("[name=checkbox]").checked;

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("lastOrder", JSON.stringify(data.order));
      location.href = "/order";
    } else {
      alert("Submit failed");
    }
  });
});