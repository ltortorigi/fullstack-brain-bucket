(() => {
  if (!window.brainBucketAuth || !window.brainBucketAuth.requireAuth()) {
    return;
  }

  const STORAGE_KEY = 'contentRecords';
  const ideaForm = document.getElementById('idea-form');
  const titleInput = document.getElementById('title');
  const taglineInput = document.getElementById('tagline');
  const authorInput = document.getElementById('author');
  const createdAtDisplay = document.getElementById('createdAtDisplay');
  const modifiedAtDisplay = document.getElementById('modifiedAtDisplay');
  const narrativeInput = document.getElementById('narrative');
  const tagsInput = document.getElementById('tagsInput');
  const userStoryAsA = document.getElementById('userStoryAsA');
  const userStoryIWant = document.getElementById('userStoryIWant');
  const userStorySoThat = document.getElementById('userStorySoThat');
  const linksContainer = document.getElementById('linksContainer');
  const addLinkButton = document.getElementById('addLink');
  const formHeading = document.querySelector('.bb-idea-form-head h1');
  const formSubheading = document.querySelector('.bb-idea-form-head p');
  const saveIdeaButton = ideaForm ? ideaForm.querySelector('button[type="submit"]') : null;
  const queryParams = new URLSearchParams(window.location.search);
  const editId = queryParams.get('editId');

  if (
    !ideaForm ||
    !titleInput ||
    !taglineInput ||
    !authorInput ||
    !createdAtDisplay ||
    !modifiedAtDisplay ||
    !narrativeInput ||
    !tagsInput ||
    !userStoryAsA ||
    !userStoryIWant ||
    !userStorySoThat ||
    !linksContainer ||
    !addLinkButton
  ) {
    return;
  }

  let linkIndex = 0;
  let currentCreatedIso = '';
  let currentModifiedIso = '';
  let editingRecordId = '';

  function toLocalDateTimeInputValue(date) {
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
  }

  function initializeMetadata() {
    const now = new Date();
    currentCreatedIso = now.toISOString();
    currentModifiedIso = currentCreatedIso;
    createdAtDisplay.value = toLocalDateTimeInputValue(now);
    modifiedAtDisplay.value = toLocalDateTimeInputValue(now);

    const sessionUser = window.brainBucketAuth.getSessionUser() || 'guest';
    authorInput.value = sessionUser;
  }

  function parseTags(rawTags) {
    return String(rawTags || '')
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);
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

  function saveRecord(record) {
    const records = readStoredRecords();
    records.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function saveAllRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function loadRecordForEdit(recordId) {
    const records = readStoredRecords();
    const record = records.find((entry) => String(entry && entry.id ? entry.id : '') === String(recordId));
    if (!record) {
      return;
    }

    editingRecordId = String(record.id || '');
    currentCreatedIso = String(record.createdAt || record.date || new Date().toISOString());
    currentModifiedIso = String(record.modifiedAt || currentCreatedIso);

    titleInput.value = String(record.title || '');
    taglineInput.value = String(record.tagline || '');
    authorInput.value = String(record.author || window.brainBucketAuth.getSessionUser() || 'guest');
    narrativeInput.value = String(record.narrative || record.description || '');
    tagsInput.value = Array.isArray(record.tags) ? record.tags.join(', ') : '';

    const userStory = record && typeof record.userStory === 'object' ? record.userStory : {};
    userStoryAsA.value = String(userStory.asA || '');
    userStoryIWant.value = String(userStory.iWant || '');
    userStorySoThat.value = String(userStory.soThat || '');

    createdAtDisplay.value = toLocalDateTimeInputValue(new Date(currentCreatedIso));
    modifiedAtDisplay.value = toLocalDateTimeInputValue(new Date(currentModifiedIso));

    linksContainer.innerHTML = '';
    const links = Array.isArray(record.links) ? record.links : [];
    if (!links.length) {
      addLinkRow('', '', 'resource');
    } else {
      links.forEach((link) => {
        addLinkRow(
          String(link && link.url ? link.url : ''),
          String(link && link.description ? link.description : ''),
          String(link && link.type ? link.type : 'resource')
        );
      });
    }

    if (formHeading) {
      formHeading.innerHTML = '<i class="bi bi-pencil-square me-1" aria-hidden="true"></i>Edit Idea';
    }
    if (formSubheading) {
      formSubheading.textContent = 'Update this idea and save your changes.';
    }
    if (saveIdeaButton instanceof HTMLButtonElement) {
      saveIdeaButton.innerHTML = '<i class="bi bi-check2-circle me-1" aria-hidden="true"></i>Update Idea';
    }
  }

  function navigateToHome() {
    if (window.brainBucketAuth && typeof window.brainBucketAuth.getHomeUrl === 'function') {
      window.location.assign(window.brainBucketAuth.getHomeUrl());
      return;
    }

    window.location.assign('../index.html');
  }

  function buildLinkRow(urlValue = '', descriptionValue = '', typeValue = 'resource') {
    const row = document.createElement('div');
    row.className = 'bb-link-row';
    row.dataset.index = String(linkIndex);

    const topRow = document.createElement('div');
    topRow.className = 'bb-link-top';

    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.className = 'form-control';
    urlInput.name = `linkUrl-${linkIndex}`;
    urlInput.placeholder = 'URL https://...';
    urlInput.value = urlValue;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn btn-outline-danger bb-link-remove';
    removeButton.setAttribute('aria-label', 'Remove link');
    removeButton.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';

    topRow.append(urlInput, removeButton);

    const bottomRow = document.createElement('div');
    bottomRow.className = 'bb-link-bottom';

    const descriptionInput = document.createElement('input');
    descriptionInput.type = 'text';
    descriptionInput.className = 'form-control';
    descriptionInput.name = `linkDescription-${linkIndex}`;
    descriptionInput.placeholder = 'Description';
    descriptionInput.value = descriptionValue;

    const typeCol = document.createElement('div');
    typeCol.className = 'bb-link-type-col';

    const typeHiddenInput = document.createElement('input');
    typeHiddenInput.type = 'hidden';
    typeHiddenInput.name = `linkType-${linkIndex}`;
    typeHiddenInput.value = typeValue;

    const typeGroup = document.createElement('div');
    typeGroup.className = 'bb-link-type-group';

    const typeOptions = ['img', 'repo', 'app', 'idea', 'resource'];
    typeOptions.forEach((option) => {
      const typeButton = document.createElement('button');
      typeButton.type = 'button';
      typeButton.className = `btn btn-sm bb-link-type-btn ${option === typeValue ? 'is-active' : ''}`;
      typeButton.setAttribute('data-type', option);
      typeButton.textContent = option;
      typeGroup.appendChild(typeButton);
    });

    bottomRow.appendChild(descriptionInput);
    typeCol.append(typeHiddenInput, typeGroup);
    bottomRow.appendChild(typeCol);
    row.append(topRow, bottomRow);
    linkIndex += 1;

    return row;
  }

  function addLinkRow(urlValue, descriptionValue, typeValue) {
    linksContainer.appendChild(buildLinkRow(urlValue, descriptionValue, typeValue));
  }

  function autofillDemoData() {
    const now = new Date();
    const created = new Date(now.getTime() - 1000 * 60 * 60 * 26);
    currentCreatedIso = created.toISOString();
    currentModifiedIso = now.toISOString();

    createdAtDisplay.value = toLocalDateTimeInputValue(created);
    modifiedAtDisplay.value = toLocalDateTimeInputValue(now);

    titleInput.value = 'Neighborhood Skill Swap';
    taglineInput.value = 'Match people who can teach with neighbors who want to learn.';
    narrativeInput.value = 'Build a lightweight local exchange where community members post mini-lessons and request help. Focus on simple scheduling, trust, and quick onboarding.';
    tagsInput.value = 'community, marketplace, learning, scheduling';

    if (!authorInput.value.trim()) {
      authorInput.value = window.brainBucketAuth.getSessionUser() || 'guest';
    }

    userStoryAsA.value = 'busy parent';
    userStoryIWant.value = 'to find short local classes and trade skills with neighbors';
    userStorySoThat.value = 'I can learn practical things without expensive courses';

    linksContainer.innerHTML = '';
    addLinkRow('https://github.com/example/skill-swap', 'Prototype repository', 'repo');
    addLinkRow('https://dribbble.com/shots/skill-swap-ui', 'UI inspiration board', 'resource');
    addLinkRow('https://picsum.photos/seed/skill-swap/640/360', 'Mock preview image', 'img');

    ideaForm.classList.remove('was-validated');
  }

  function readLinks() {
    return Array.from(linksContainer.querySelectorAll('.bb-link-row'))
      .map((row) => {
        const urlInput = row.querySelector('input[name^="linkUrl-"]');
        const descriptionInput = row.querySelector('input[name^="linkDescription-"]');
        const typeInput = row.querySelector('input[name^="linkType-"]');

        const url = urlInput instanceof HTMLInputElement ? urlInput.value.trim() : '';
        const description = descriptionInput instanceof HTMLInputElement ? descriptionInput.value.trim() : '';
        const type = typeInput instanceof HTMLInputElement ? typeInput.value.trim().toLowerCase() || 'resource' : 'resource';

        return {
          type,
          description,
          url,
        };
      })
      .filter((link) => link.description.length > 0 || link.url.length > 0);
  }

  addLinkButton.addEventListener('click', () => {
    addLinkRow('', '', 'resource');
  });

  linksContainer.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const typeButton = target.closest('[data-type]');
    if (typeButton instanceof HTMLButtonElement) {
      const row = typeButton.closest('.bb-link-row');
      if (!(row instanceof HTMLElement)) {
        return;
      }

      const nextType = typeButton.getAttribute('data-type');
      if (!nextType) {
        return;
      }

      const hiddenTypeInput = row.querySelector('input[name^="linkType-"]');
      if (hiddenTypeInput instanceof HTMLInputElement) {
        hiddenTypeInput.value = nextType;
      }

      row.querySelectorAll('[data-type]').forEach((btn) => {
        btn.classList.toggle('is-active', btn === typeButton);
      });

      return;
    }

    const removeButton = target.closest('.bb-link-remove');
    if (!removeButton) {
      return;
    }

    const row = removeButton.closest('.bb-link-row');
    if (!row) {
      return;
    }

    row.remove();
  });

  ideaForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!ideaForm.checkValidity()) {
      ideaForm.classList.add('was-validated');
      return;
    }

    const saveTime = new Date();
    currentModifiedIso = saveTime.toISOString();
    modifiedAtDisplay.value = toLocalDateTimeInputValue(saveTime);

    const links = readLinks();
    const tags = parseTags(tagsInput.value);
    const narrative = narrativeInput.value.trim();
    const userStory = {
      asA: userStoryAsA.value.trim(),
      iWant: userStoryIWant.value.trim(),
      soThat: userStorySoThat.value.trim(),
    };

    const imageLink = links.find((link) => link.type === 'img' && link.url);

    if (editingRecordId) {
      const records = readStoredRecords();
      let didUpdate = false;

      const nextRecords = records.map((record) => {
        if (String(record && record.id ? record.id : '') !== editingRecordId) {
          return record;
        }

        didUpdate = true;
        return {
          ...record,
          id: editingRecordId,
          title: titleInput.value.trim(),
          tagline: taglineInput.value.trim(),
          author: authorInput.value.trim(),
          date: currentCreatedIso,
          createdAt: currentCreatedIso,
          modifiedAt: currentModifiedIso,
          narrative,
          description: narrative,
          tags,
          userStory,
          links,
          image: imageLink ? imageLink.url : '',
        };
      });

      if (didUpdate) {
        saveAllRecords(nextRecords);
      }
    } else {
      const data = {
        id: `idea-${Date.now()}`,
        title: titleInput.value.trim(),
        tagline: taglineInput.value.trim(),
        author: authorInput.value.trim(),
        date: currentCreatedIso,
        createdAt: currentCreatedIso,
        modifiedAt: currentModifiedIso,
        narrative,
        description: narrative,
        tags,
        userStory,
        links,
        image: imageLink ? imageLink.url : '',
        favorite: false,
        status: 'active',
      };

      saveRecord(data);
    }

    navigateToHome();
  });

  ideaForm.addEventListener('reset', () => {
    ideaForm.classList.remove('was-validated');
    linksContainer.innerHTML = '';
    addLinkRow('', '', 'resource');
    initializeMetadata();
  });

  // Global helper for DevTools: run demo() on form page to prefill sample content.
  window.demo = function demo() {
    autofillDemoData();
  };

  initializeMetadata();
  addLinkRow('', '', 'resource');
  if (editId) {
    loadRecordForEdit(editId);
  }
})();
