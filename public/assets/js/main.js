(function(){
  // Music player toggle
  const musicPlayer = document.querySelector('.music-player');
  const bgm = document.getElementById('bgm');
  if (musicPlayer && bgm) {
    let isPlaying = false;
    musicPlayer.addEventListener('click', function() {
      if (isPlaying) {
        bgm.pause();
        isPlaying = false;
      } else {
        const p = bgm.play();
        if (p && typeof p.catch === 'function') {
          p.catch(err => console.warn('BGM play blocked or failed:', err));
        }
        isPlaying = true;
      }
    });
  }

  // Icon click-to-play sounds (runs on all pages)
  (function setupIconSounds(){
    const filenameToSound = {
      'music-dog.png': 'assets/music/bagpipe.mp3',
      'donkey-harp.png': 'assets/music/harp.mp3',
      'cat-pipe.png': 'assets/music/organ.mp3',
      'music-bear.png': 'assets/music/oboe.mp3'
    };
    let currentAudio = null;

    const imgs = Array.from(document.querySelectorAll('img'));
    imgs.forEach(img => {
      const srcAttr = img.getAttribute('src') || '';
      const filename = srcAttr.split('/').pop();
      const sound = filenameToSound[filename];
      if (!sound) return;
      img.addEventListener('click', () => {
        if (currentAudio) {
          try { currentAudio.pause(); } catch (_) {}
        }
        const audio = new Audio(sound);
        currentAudio = audio;
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(err => console.warn('Sound play blocked or failed:', sound, err));
        }
      });
    });
  })();

  // Data-driven rendering
  const page = document.body.getAttribute('data-page');
  const contentRoot = document.querySelector('.page-content');
  if (!page || !contentRoot) return;

  if (page === 'hound') {
    const leftPane = document.getElementById('page-left');
    const rightPane = document.getElementById('page-right');
    if (!leftPane || !rightPane) return;

    const listContainer = leftPane.querySelector('.hound-list');
    const pager = leftPane.querySelector('.hound-pager');
    const tagsContainer = leftPane.querySelector('.hound-tags');

    const readerTitle = rightPane.querySelector('.reader-title');
    const readerMetaTime = rightPane.querySelector('.reader-meta time');
    const readerTags = rightPane.querySelector('.reader-tags');
    const readerContent = rightPane.querySelector('.reader-content');

    // Helper to load and render a post into the right pane
    function loadPost(entry) {
      if (!entry || !entry.id) return;
      const url = `assets/content/hound/posts/${entry.id}.html`;
      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
          return r.text();
        })
        .then(html => {
          // Use the post HTML as-is; don't duplicate header/meta in the right pane
          if (readerTitle) readerTitle.textContent = '';
          if (readerMetaTime) readerMetaTime.textContent = '';
          if (readerTags) readerTags.innerHTML = '';
          if (readerContent) readerContent.innerHTML = html;
        })
        .catch(err => console.error('Failed to load post:', err));
    }

    // Fetch index and render list
    fetch('assets/content/hound/index.json')
      .then(r => r.json())
      .then(data => {
        const entries = Array.isArray(data.entries) ? data.entries : [];

        // Populate tags (unique list across entries)
        if (tagsContainer) {
          const allTags = new Set();
          entries.forEach(e => (e.tags || []).forEach(t => allTags.add(t)));
          tagsContainer.innerHTML = '';
          Array.from(allTags).forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'tag-chip';
            btn.setAttribute('aria-pressed', 'false');
            btn.textContent = tag;
            btn.addEventListener('click', () => {
              // Simple tag toggle filter
              const active = btn.getAttribute('aria-pressed') === 'true';
              btn.setAttribute('aria-pressed', active ? 'false' : 'true');
              renderList();
            });
            tagsContainer.appendChild(btn);
          });
        }

        function getActiveTags() {
          if (!tagsContainer) return [];
          return Array.from(tagsContainer.querySelectorAll('.tag-chip[aria-pressed="true"]')).map(b => b.textContent || '');
        }

        function renderList() {
          if (!listContainer) return;
          const activeTags = getActiveTags();
          listContainer.innerHTML = '';
          const filtered = activeTags.length
            ? entries.filter(e => (e.tags || []).some(t => activeTags.includes(t)))
            : entries;
          filtered.forEach(entry => {
            const item = document.createElement('article');
            item.className = 'hound-entry';
            item.innerHTML = `
              <div class="hound-entry__header">
                <h3 class="hound-entry__title"><a href="#${entry.id}">${entry.title}</a></h3>
                <time class="hound-entry__date">${entry.date}</time>
              </div>
              <div class="hound-entry__body">
                <p>${entry.summary || ''}</p>
              </div>
            `;
            // Click through to load post
            item.addEventListener('click', () => {
              location.hash = `#${entry.id}`;
              loadPost(entry);
            });
            listContainer.appendChild(item);
          });

          // Simple pager indicator update (single page for now)
          if (pager) {
            const indicator = pager.querySelector('.page-indicator');
            if (indicator) indicator.textContent = '1';
          }
        }

        // Initial render
        renderList();

        // Load initial post from hash or first entry
        const initialId = (location.hash || '').replace('#', '');
        const initial = entries.find(e => e.id === initialId) || entries[0];
        if (initial) loadPost(initial);

        // Handle hash changes (back/forward navigation)
        window.addEventListener('hashchange', () => {
          const id = (location.hash || '').replace('#', '');
          const entry = entries.find(e => e.id === id);
          if (entry) loadPost(entry);
        });
      })
      .catch(err => console.error('Failed to load hound entries:', err));
  }

  if (page === 'hare') {
    fetch('assets/content/hare/index.json')
      .then(r => r.json())
      .then(data => {
        const grid = document.createElement('div');
        grid.className = 'hare-grid';
        (data.artworks || []).forEach(art => {
          const fig = document.createElement('figure');
          fig.className = 'hare-item';
          fig.innerHTML = `
            <img src="${art.image}" alt="${art.title}">
            <figcaption>
              <strong class="hare-item__title">${art.title}</strong>
              <span class="hare-item__date">${art.date}</span>
              <div class="hare-item__caption">${art.caption || ''}</div>
            </figcaption>
          `;
          grid.appendChild(fig);
        });
        contentRoot.appendChild(grid);
      })
      .catch(err => console.error('Failed to load hare artworks:', err));
  }
})();
