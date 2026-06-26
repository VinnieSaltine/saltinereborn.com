(() => {
  const roots = document.querySelectorAll("[data-release-at]");

  if (!roots.length) {
    return;
  }

  const pad = (value) => String(value).padStart(2, "0");

  roots.forEach((root) => {
    const releaseAt = new Date(root.dataset.releaseAt || "");
    const releaseLinks = root.querySelectorAll("[data-release-link]");
    const countdownState = root.querySelector("[data-countdown-state]");
    const homeRelease = root.hasAttribute("data-home-release");
    const days = root.querySelector("[data-countdown-days]");
    const hours = root.querySelector("[data-countdown-hours]");
    const minutes = root.querySelector("[data-countdown-minutes]");
    const seconds = root.querySelector("[data-countdown-seconds]");

    if (Number.isNaN(releaseAt.getTime())) {
      countdownState?.setAttribute("hidden", "");
      return;
    }

    const unlockRelease = () => {
      countdownState?.setAttribute("hidden", "");
      releaseLinks.forEach((link) => link.removeAttribute("hidden"));

      if (homeRelease) {
        document.querySelectorAll("[data-before-release]").forEach((element) => {
          element.setAttribute("hidden", "");
        });
        document.querySelectorAll("[data-after-release]").forEach((element) => {
          element.removeAttribute("hidden");
        });
      }
    };

    const lockHomeRelease = () => {
      if (!homeRelease) {
        return;
      }

      document.querySelectorAll("[data-after-release]").forEach((element) => {
        element.setAttribute("hidden", "");
      });
    };

    const render = () => {
      const remaining = releaseAt.getTime() - Date.now();

      if (remaining <= 0) {
        unlockRelease();
        return false;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const dayCount = Math.floor(totalSeconds / 86400);
      const hourCount = Math.floor((totalSeconds % 86400) / 3600);
      const minuteCount = Math.floor((totalSeconds % 3600) / 60);
      const secondCount = totalSeconds % 60;

      if (days) days.textContent = String(dayCount);
      if (hours) hours.textContent = pad(hourCount);
      if (minutes) minutes.textContent = pad(minuteCount);
      if (seconds) seconds.textContent = pad(secondCount);

      return true;
    };

    if (render()) {
      lockHomeRelease();

      const timer = window.setInterval(() => {
        if (!render()) {
          window.clearInterval(timer);
        }
      }, 1000);
    }
  });
})();
