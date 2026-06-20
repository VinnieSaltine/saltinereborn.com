(() => {
  const accessKey = "saltineRebornAccess";
  const unlockedValue = "granted";

  const hasAccess = () => {
    try {
      return (
        window.localStorage.getItem(accessKey) === unlockedValue ||
        window.sessionStorage.getItem(accessKey) === unlockedValue
      );
    } catch {
      return false;
    }
  };

  const rememberAccess = () => {
    try {
      window.localStorage.setItem(accessKey, unlockedValue);
    } catch {
      window.sessionStorage.setItem(accessKey, unlockedValue);
    }
  };

  const unlock = () => {
    document.documentElement.classList.remove("access-pending");
    document.querySelector(".access-gate")?.remove();
  };

  if (hasAccess()) {
    unlock();
    return;
  }

  const showGate = () => {
    if (hasAccess()) {
      unlock();
      return;
    }

    const gate = document.createElement("section");
    gate.className = "access-gate";
    gate.setAttribute("aria-labelledby", "access-title");
    gate.innerHTML = `
      <div class="access-panel">
        <p class="access-kicker">Private Beta Archive</p>
        <h1 id="access-title">The Saltine Reborn</h1>
        <p class="access-copy">Invited readers may enter the collected record.</p>
        <form class="access-form">
          <label for="site-password">Archive key</label>
          <div class="access-row">
            <input id="site-password" name="password" type="password" autocomplete="current-password" required />
            <button type="submit">Enter</button>
          </div>
          <p class="access-message" role="status" aria-live="polite"></p>
        </form>
      </div>
    `;

    document.body.append(gate);

    const form = gate.querySelector(".access-form");
    const input = gate.querySelector("#site-password");
    const button = gate.querySelector("button");
    const message = gate.querySelector(".access-message");

    input.focus();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      button.disabled = true;
      message.textContent = "Checking the archive key...";

      try {
        const result = await fetch("/api/verify-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ password: input.value })
        });
        const payload = await result.json().catch(() => ({}));

        if (result.ok && payload.ok) {
          rememberAccess();
          unlock();
          return;
        }

        message.textContent = payload.message || "That key does not open this archive.";
        input.select();
      } catch {
        message.textContent = "The archive could not be reached. Try again in a moment.";
      } finally {
        button.disabled = false;
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showGate);
  } else {
    showGate();
  }
})();
