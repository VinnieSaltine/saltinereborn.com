(() => {
  const root = document.querySelector("[data-chapter-discussion]");

  if (!root) {
    return;
  }

  const tokenKey = "saltineReaderToken";
  const readerKey = "saltineReaderName";
  const chapterSlug = root.dataset.chapterSlug || "";
  const authPanel = root.querySelector("[data-discussion-auth]");
  const loginForm = root.querySelector("[data-login-form]");
  const authMessage = root.querySelector("[data-auth-message]");
  const room = root.querySelector("[data-discussion-room]");
  const readerLabel = root.querySelector("[data-reader-label]");
  const logoutButton = root.querySelector("[data-reader-logout]");
  const commentList = root.querySelector("[data-comment-list]");
  const commentForm = root.querySelector("[data-comment-form]");
  const commentMessage = root.querySelector("[data-comment-message]");

  const getToken = () => {
    try {
      return window.localStorage.getItem(tokenKey) || "";
    } catch {
      return "";
    }
  };

  const setReader = (token, name) => {
    try {
      window.localStorage.setItem(tokenKey, token);
      window.localStorage.setItem(readerKey, name);
    } catch {
      window.sessionStorage.setItem(tokenKey, token);
      window.sessionStorage.setItem(readerKey, name);
    }
  };

  const clearReader = () => {
    try {
      window.localStorage.removeItem(tokenKey);
      window.localStorage.removeItem(readerKey);
      window.sessionStorage.removeItem(tokenKey);
      window.sessionStorage.removeItem(readerKey);
    } catch {
      // Storage can fail in private browsing; the next request will ask for sign-in again.
    }
  };

  const getReaderName = () => {
    try {
      return window.localStorage.getItem(readerKey) || window.sessionStorage.getItem(readerKey) || "";
    } catch {
      return "";
    }
  };

  const formatTime = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  };

  const setMessage = (element, message) => {
    if (element) {
      element.textContent = message;
    }
  };

  const showRoom = () => {
    authPanel?.setAttribute("hidden", "");
    room?.removeAttribute("hidden");
    const name = getReaderName();

    if (readerLabel && name) {
      readerLabel.textContent = `Signed in as ${name}`;
    }
  };

  const showAuth = (message) => {
    room?.setAttribute("hidden", "");
    authPanel?.removeAttribute("hidden");
    setMessage(authMessage, message);
  };

  const renderComments = (comments) => {
    if (!commentList) {
      return;
    }

    commentList.innerHTML = "";

    if (!comments.length) {
      const empty = document.createElement("li");
      empty.className = "comment-empty";
      empty.textContent = "No comments yet.";
      commentList.append(empty);
      return;
    }

    comments.forEach((comment) => {
      const item = document.createElement("li");
      item.className = "comment-item";

      const header = document.createElement("div");
      header.className = "comment-meta";

      const name = document.createElement("strong");
      name.textContent = comment.reader_name || "Reader";

      const time = document.createElement("time");
      time.dateTime = comment.created_at || "";
      time.textContent = formatTime(comment.created_at);

      const body = document.createElement("p");
      body.textContent = comment.body || "";

      header.append(name, time);
      item.append(header, body);
      commentList.append(item);
    });
  };

  const loadComments = async () => {
    const token = getToken();

    if (!token) {
      showAuth("Sign in with your reader name and password to join the discussion.");
      return;
    }

    showRoom();
    setMessage(commentMessage, "Loading discussion...");

    const response = await fetch(`/api/chapter-comments?chapter=${encodeURIComponent(chapterSlug)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json().catch(() => ({}));

    if (response.status === 401) {
      clearReader();
      showAuth("Please sign in again to join the discussion.");
      return;
    }

    if (!response.ok || payload.configured === false) {
      renderComments([]);
      setMessage(
        commentMessage,
        payload.message || "Discussion storage is not configured yet."
      );
      return;
    }

    renderComments(payload.comments || []);
    setMessage(commentMessage, "");
  };

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    setMessage(authMessage, "Checking reader access...");

    const response = await fetch("/api/reader-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: formData.get("name"),
        password: formData.get("password")
      })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.token) {
      setMessage(authMessage, payload.message || "That reader password did not work.");
      return;
    }

    setReader(payload.token, payload.reader?.name || String(formData.get("name") || "Reader"));
    loginForm.reset();
    await loadComments();
  });

  commentForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const token = getToken();
    const formData = new FormData(commentForm);
    const body = String(formData.get("body") || "").trim();

    if (!body) {
      setMessage(commentMessage, "Add a comment before posting.");
      return;
    }

    setMessage(commentMessage, "Posting...");

    const response = await fetch("/api/chapter-comments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ chapter: chapterSlug, body })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(commentMessage, payload.message || "The comment could not be posted.");
      return;
    }

    commentForm.reset();
    renderComments(payload.comments || []);
    setMessage(commentMessage, "");
  });

  logoutButton?.addEventListener("click", () => {
    clearReader();
    showAuth("Sign in with your reader name and password to join the discussion.");
  });

  loadComments().catch(() => {
    setMessage(commentMessage, "The discussion could not be loaded.");
  });
})();
