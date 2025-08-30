(function () {
  // Music player toggle
  const musicPlayer = document.querySelector(".music-player");
  const bgm = document.getElementById("bgm");
  if (musicPlayer && bgm) {
    let isPlaying = false;
    musicPlayer.addEventListener("click", function () {
      if (isPlaying) {
        bgm.pause();
        isPlaying = false;
      } else {
        const p = bgm.play();
        if (p && typeof p.catch === "function") {
          p.catch((err) => console.warn("BGM play blocked or failed:", err));
        }
        isPlaying = true;
      }
    });
  }

  // Icon click-to-play sounds (runs on all pages)
  (function setupIconSounds() {
    const filenameToSound = {
      "music-dog.png": "assets/music/bagpipe.mp3",
      "donkey-harp.png": "assets/music/harp.mp3",
      "cat-pipe.png": "assets/music/organ.mp3",
      "music-bear.png": "assets/music/oboe.mp3",
    };
    let currentAudio = null;

    const imgs = Array.from(document.querySelectorAll("img"));
    imgs.forEach((img) => {
      const srcAttr = img.getAttribute("src") || "";
      const filename = srcAttr.split("/").pop();
      const sound = filenameToSound[filename];
      if (!sound) return;
      img.addEventListener("click", () => {
        if (currentAudio) {
          try {
            currentAudio.pause();
          } catch (_) {}
        }
        const audio = new Audio(sound);
        currentAudio = audio;
        const p = audio.play();
        if (p && typeof p.catch === "function") {
          p.catch((err) =>
            console.warn("Sound play blocked or failed:", sound, err)
          );
        }
      });
    });
  })();

  // Data-driven rendering
  const page = document.body.getAttribute("data-page");
  const contentRoot = document.querySelector(".page-content");
  if (!page || !contentRoot) return;

  if (page === "hound") {
    const leftPane = document.getElementById("page-left");
    const rightPane = document.getElementById("page-right");
    if (!leftPane || !rightPane) return;

    const listContainer = leftPane.querySelector(".hound-list");
    const pager = leftPane.querySelector(".hound-pager");
    const tagsContainer = leftPane.querySelector(".hound-tags");

    const readerTitle = rightPane.querySelector(".reader-title");
    const readerMetaTime = rightPane.querySelector(".reader-meta time");
    const readerTags = rightPane.querySelector(".reader-tags");
    const readerContent = rightPane.querySelector(".reader-content");

    // Pagination settings
    const ENTRIES_PER_PAGE = 3;
    let currentPage = 1;
    let filteredEntries = [];
    let entries = []; // Move entries to outer scope

    // Helper function to get active tags
    function getActiveTags() {
      if (!tagsContainer) return [];
      return Array.from(
        tagsContainer.querySelectorAll('.tag-chip[aria-pressed="true"]')
      ).map((b) => b.textContent || "");
    }

    // Helper to load and render a post into the right pane
    function loadPost(entry) {
      if (!entry || !entry.id) return;
      const url = `assets/content/hound/posts/${entry.id}.html`;
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
          return r.text();
        })
        .then((html) => {
          // Use the post HTML as-is; don't duplicate header/meta in the right pane
          if (readerTitle) readerTitle.textContent = "";
          if (readerMetaTime) readerMetaTime.textContent = "";
          if (readerTags) readerTags.innerHTML = "";
          if (readerContent) readerContent.innerHTML = html;
        })
        .catch((err) => console.error("Failed to load post:", err));
    }

    // Pagination functions
    function getPageEntries(page, entriesList) {
      const start = (page - 1) * ENTRIES_PER_PAGE;
      const end = start + ENTRIES_PER_PAGE;
      return entriesList.slice(start, end);
    }

    function updatePager(currentPage, totalPages) {
      if (!pager) return;

      // Find buttons by text content (same method as event listeners)
      const allButtons = pager.querySelectorAll(".btn");
      const prevBtn = Array.from(allButtons).find(
        (btn) => btn.textContent === "Previous"
      );
      const nextBtn = Array.from(allButtons).find(
        (btn) => btn.textContent === "Next"
      );
      const indicator = pager.querySelector(".page-indicator");

      if (prevBtn) {
        prevBtn.setAttribute("aria-disabled", currentPage <= 1);
        prevBtn.disabled = currentPage <= 1;
      }
      if (nextBtn) {
        nextBtn.setAttribute("aria-disabled", currentPage >= totalPages);
        nextBtn.disabled = currentPage >= totalPages;
      }
      if (indicator) indicator.textContent = `${currentPage} / ${totalPages}`;
    }

    function renderList() {
      if (!listContainer) return;

      console.log("renderList called, entries:", entries); // Debug log

      const activeTags = getActiveTags();
      filteredEntries = activeTags.length
        ? entries.filter((e) =>
            (e.tags || []).some((t) => activeTags.includes(t))
          )
        : entries;

      console.log("filteredEntries:", filteredEntries); // Debug log

      const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
      currentPage = Math.min(currentPage, totalPages || 1);

      const pageEntries = getPageEntries(currentPage, filteredEntries);

      console.log("pageEntries:", pageEntries); // Debug log

      listContainer.innerHTML = "";
      pageEntries.forEach((entry) => {
        const item = document.createElement("article");
        item.className = "hound-entry";
        item.innerHTML = `
          <div class="hound-entry__header">
            <h3 class="hound-entry__title"><a href="#${entry.id}">${
          entry.title
        }</a></h3>
            <time class="hound-entry__date">${entry.date}</time>
          </div>
          <div class="hound-entry__body">
            <p>${entry.summary || ""}</p>
          </div>
        `;
        // Click through to load post
        item.addEventListener("click", () => {
          location.hash = `#${entry.id}`;
          loadPost(entry);
        });
        listContainer.appendChild(item);
      });

      updatePager(currentPage, totalPages);
    }

    // Pager event listeners
    if (pager) {
      // Find buttons by text content
      const allButtons = pager.querySelectorAll(".btn");
      const prevBtn = Array.from(allButtons).find(
        (btn) => btn.textContent === "Previous"
      );
      const nextBtn = Array.from(allButtons).find(
        (btn) => btn.textContent === "Next"
      );

      console.log("Pager found:", pager); // Debug
      console.log("Previous button:", prevBtn); // Debug
      console.log("Next button:", nextBtn); // Debug

      if (prevBtn) {
        console.log("Adding click listener to Previous button"); // Debug
        prevBtn.addEventListener("click", () => {
          console.log("Previous clicked, currentPage:", currentPage); // Debug
          if (currentPage > 1) {
            currentPage--;
            console.log("Going to page:", currentPage); // Debug
            renderList();
          }
        });
      }

      if (nextBtn) {
        console.log("Adding click listener to Next button"); // Debug
        nextBtn.addEventListener("click", () => {
          console.log("Next clicked, currentPage:", currentPage); // Debug
          const totalPages = Math.ceil(
            filteredEntries.length / ENTRIES_PER_PAGE
          );
          if (currentPage < totalPages) {
            currentPage++;
            console.log("Going to page:", currentPage); // Debug
            renderList();
          }
        });
      }
    }

    // Fetch index and render list
    console.log("Starting fetch for hound entries..."); // Debug log
    fetch("assets/content/hound/index.json")
      .then((r) => {
        console.log("Fetch response:", r.status, r.ok); // Debug log
        if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        console.log("Fetched data:", data); // Debug log
        entries = Array.isArray(data.entries) ? data.entries : [];
        console.log("Processed entries:", entries); // Debug log

        // Populate tags (unique list across entries)
        if (tagsContainer) {
          const allTags = new Set();
          entries.forEach((e) => (e.tags || []).forEach((t) => allTags.add(t)));
          tagsContainer.innerHTML = "";
          Array.from(allTags).forEach((tag) => {
            const btn = document.createElement("button");
            btn.className = "tag-chip";
            btn.setAttribute("aria-pressed", "false");
            btn.textContent = tag;
            btn.addEventListener("click", () => {
              // Simple tag toggle filter
              const active = btn.getAttribute("aria-pressed") === "true";
              btn.setAttribute("aria-pressed", active ? "false" : "true");
              currentPage = 1; // Reset to first page when filtering
              renderList();
            });
            tagsContainer.appendChild(btn);
          });
        }

        // Initial render
        renderList();

        // Load initial post from hash or first entry
        const initialId = (location.hash || "").replace("#", "");
        const initial = entries.find((e) => e.id === initialId) || entries[0];
        if (initial) loadPost(initial);

        // Handle hash changes (back/forward navigation)
        window.addEventListener("hashchange", () => {
          const id = (location.hash || "").replace("#", "");
          const entry = entries.find((e) => e.id === id);
          if (entry) loadPost(entry);
        });
      })
      .catch((err) => console.error("Failed to load hound entries:", err));
  }

  if (page === "hare") {
    fetch("assets/content/hare/index.json")
      .then((r) => r.json())
      .then((data) => {
        const grid = document.createElement("div");
        grid.className = "hare-grid";
        (data.artworks || []).forEach((art) => {
          const fig = document.createElement("figure");
          fig.className = "hare-item";
          fig.innerHTML = `
            <img src="${art.image}" alt="${art.title}">
            <figcaption>
              <strong class="hare-item__title">${art.title}</strong>
              <span class="hare-item__date">${art.date}</span>
              <div class="hare-item__caption">${art.caption || ""}</div>
            </figcaption>
          `;
          grid.appendChild(fig);
        });
        contentRoot.appendChild(grid);
      })
      .catch((err) => console.error("Failed to load hare artworks:", err));
  }
})();
