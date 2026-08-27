(() => {
  const STORAGE_KEY = 'contentRecords';

  if (!window.brainBucketAuth || !window.brainBucketAuth.requireAuth()) {
    return;
  }

  const contentRoot = document.getElementById('content-list');
  const cardTemplate = document.getElementById('content-card-template');

  if (!contentRoot || !(cardTemplate instanceof HTMLTemplateElement)) {
    return;
  }

  function readStoredRecords() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function formatDate(isoDate) {
    if (!isoDate) {
      return 'No date';
    }

    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      return isoDate;
    }

    return parsed.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function renderEmptyState() {
    contentRoot.innerHTML = `
      <div class="col-12">
        <div class="alert alert-light border mb-0" role="status">
          No saved content yet. Add an entry from the form page.
        </div>
      </div>
    `;
  }

  function buildLinksMarkup(links, linksRoot) {
    linksRoot.innerHTML = '';

    (links || []).forEach((link) => {
      const url = String(link.url || '#');
      const label = String(link.description || link.url || 'Open link');

      if (!link.url) {
        const span = document.createElement('span');
        span.className = 'badge text-bg-light border';
        span.textContent = label;
        linksRoot.appendChild(span);
        return;
      }

      const anchor = document.createElement('a');
      anchor.className = 'badge text-bg-light border text-decoration-none';
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = label;
      linksRoot.appendChild(anchor);
    });
  }

  function renderCards(records) {
    if (!records.length) {
      renderEmptyState();
      return;
    }

    contentRoot.innerHTML = '';

    records.forEach((record) => {
      const fragment = cardTemplate.content.cloneNode(true);
      const titleEl = fragment.querySelector('[data-field="title"]');
      const metaEl = fragment.querySelector('[data-field="meta"]');
      const imageEl = fragment.querySelector('[data-field="image"]');
      const descriptionEl = fragment.querySelector('[data-field="description"]');
      const linksRoot = fragment.querySelector('[data-field="links"]');

      if (!titleEl || !metaEl || !imageEl || !descriptionEl || !linksRoot) {
        return;
      }

      const safeTitle = String(record.title || 'Untitled');
      const safeAuthor = String(record.author || 'Unknown author');
      const safeDate = String(formatDate(record.date));
      const safeDescription = String(record.description || '');
      const safeImage = String(record.image || 'https://picsum.photos/800/420?grayscale');

      titleEl.textContent = safeTitle;
      metaEl.textContent = `by ${safeAuthor} | ${safeDate}`;
      imageEl.setAttribute('src', safeImage);
      imageEl.setAttribute('alt', safeTitle);
      descriptionEl.textContent = safeDescription;
      buildLinksMarkup(record.links || [], linksRoot);

      contentRoot.appendChild(fragment);
    });
  }

  renderCards(readStoredRecords());
})();
