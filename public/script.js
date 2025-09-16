document.addEventListener("DOMContentLoaded", async () => {
  const authArea = document.getElementById("auth-area");

  // Fetch current user
  const meRes = await fetch("/api/me", { credentials: "include" }); // 👈 added
  const user = await meRes.json();

  if (user && user.id) {
    authArea.innerHTML = `Hello, ${user.username} <button id="logout-btn">Logout</button>`;
    document.getElementById("logout-btn").addEventListener("click", async () => {
      await fetch("/api/logout", { method: "POST", credentials: "include" }); // 👈 added
      location.reload();
    });
  } else {
    authArea.innerHTML = '<a href="/login" id="login-btn">Login</a> | <a href="/register" id="register-btn">Register</a>';
  }

  // Attach login form if exists
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(loginForm).entries());
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 👈 added
        body: JSON.stringify(data)
      });
      if (res.ok) location.href = "/";
      else alert("Login failed");
    });
  }

  // Attach register form if exists
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(registerForm).entries());
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 👈 added
        body: JSON.stringify(data)
      });
      if (res.ok) location.href = "/";
      else alert("Register failed");
    });
  }
});
