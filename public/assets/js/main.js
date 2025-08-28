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
    fetch('assets/content/hound/index.json')
      .then(r => r.json())
      .then(data => {
        const container = document.createElement('div');
        container.className = 'hound-list';
        (data.entries || []).forEach(entry => {
          const item = document.createElement('article');
          item.className = 'hound-entry';
          item.innerHTML = `
            <header class="hound-entry__header">
              <h2 class="hound-entry__title">${entry.title}</h2>
              <time class="hound-entry__date">${entry.date}</time>
            </header>
            <section class="hound-entry__body">${entry.html}</section>
          `;
          container.appendChild(item);
        });
        contentRoot.appendChild(container);
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
