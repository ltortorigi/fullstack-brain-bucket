(() => {
	if (!window.brainBucketAuth || !window.brainBucketAuth.requireAuth()) {
		return;
	}

	const STORAGE_KEY = 'contentRecords';
	const INTERNAL_DATA_PATH = 'assets/data/ideas.json';
	const RECENT_SEARCHES_KEY = 'recentIdeaSearches';
	const MAX_RECENT_SEARCHES = 8;
	const navProfileName = document.getElementById('navProfileName');
	const logoutButton = document.getElementById('logoutBtn');
	const ideaList = document.getElementById('ideaList');
	const ideaCardTemplate = document.getElementById('ideaCardTemplate');
	const ideaSearch = document.getElementById('ideaSearch');
	const sortButtons = document.getElementById('sortButtons');
	const favoriteIdeasButton = document.getElementById('favoriteIdeasBtn');
	const randomIdeaButton = document.getElementById('randomIdeaBtn');
	const adminAreaButton = document.getElementById('adminAreaBtn');
	const tagFilterButtons = document.getElementById('tagFilterButtons');
	const recentSearches = document.getElementById('recentSearches');
	const activeFiltersSummary = document.getElementById('activeFiltersSummary');
	const ideaDetailModalEl = document.getElementById('ideaDetailModal');
	const ideaDetailTitle = document.getElementById('ideaDetailTitle');
	const ideaDetailTagline = document.getElementById('ideaDetailTagline');
	const ideaDetailAuthor = document.getElementById('ideaDetailAuthor');
	const ideaDetailCreated = document.getElementById('ideaDetailCreated');
	const ideaDetailModified = document.getElementById('ideaDetailModified');
	const ideaDetailImage = document.getElementById('ideaDetailImage');
	const ideaDetailNarrative = document.getElementById('ideaDetailNarrative');
	const ideaDetailUserStory = document.getElementById('ideaDetailUserStory');
	const ideaDetailTags = document.getElementById('ideaDetailTags');
	const ideaDetailLinks = document.getElementById('ideaDetailLinks');
	const ideaDetailNotes = document.getElementById('ideaDetailNotes');
	const ideaNoteForm = document.getElementById('ideaNoteForm');
	const ideaNoteRecordId = document.getElementById('ideaNoteRecordId');
	const ideaNoteAuthor = document.getElementById('ideaNoteAuthor');
	const ideaNoteDate = document.getElementById('ideaNoteDate');
	const ideaNoteTitle = document.getElementById('ideaNoteTitle');
	const ideaNoteText = document.getElementById('ideaNoteText');
	const ideaNoteCancelEdit = document.getElementById('ideaNoteCancelEdit');
	const ideaEditBtn = document.getElementById('ideaEditBtn');
	const ideaDeleteBtn = document.getElementById('ideaDeleteBtn');
	const ideaRestoreBtn = document.getElementById('ideaRestoreBtn');
	const sessionUser = window.brainBucketAuth.getSessionUser() || 'Guest';
	let activeSort = 'created';
	let activeTag = 'all';
	let showFavoritesOnly = false;
	let showAdminArea = false;
	let randomRecordId = '';
	let ideaDetailModal = null;
	let activeModalRecordId = '';

	if (!ideaList || !(ideaCardTemplate instanceof HTMLTemplateElement) || !ideaSearch || !sortButtons || !favoriteIdeasButton || !randomIdeaButton || !tagFilterButtons || !recentSearches || !activeFiltersSummary) {
		return;
	}

	if (navProfileName) {
		navProfileName.textContent = sessionUser;
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

	function saveAllRecords(records) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
	}

	async function seedRecordsFromInternalData() {
		const existingRecords = readStoredRecords();
		if (existingRecords.length) {
			return;
		}

		try {
			const dataUrl = window.brainBucketAuth && typeof window.brainBucketAuth.buildAppUrl === 'function'
				? window.brainBucketAuth.buildAppUrl(INTERNAL_DATA_PATH)
				: INTERNAL_DATA_PATH;
			const response = await fetch(dataUrl, { cache: 'no-store' });
			if (!response.ok) {
				return;
			}

			const parsed = await response.json();
			if (!Array.isArray(parsed) || !parsed.length) {
				return;
			}

			saveAllRecords(parsed);
		} catch (error) {
			// Keep app functional even if seed data is unavailable.
		}
	}

	function ensureRecordIds(records) {
		let didChange = false;
		records.forEach((record, index) => {
			if (!record.id) {
				record.id = `idea-${record.createdAt || Date.now()}-${index}`;
				didChange = true;
			}
		});

		if (didChange) {
			saveAllRecords(records);
		}
	}

	function formatDate(isoDate) {
		if (!isoDate) {
			return 'No date';
		}

		const parsed = new Date(isoDate);
		if (Number.isNaN(parsed.getTime())) {
			return String(isoDate);
		}

		return parsed.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	function getRecordStatus(record) {
		const status = String(record && record.status ? record.status : 'active').toLowerCase();
		return status === 'deleted' ? 'deleted' : 'active';
	}

	function formatDateTime(isoDate) {
		if (!isoDate) {
			return 'No date';
		}

		const parsed = new Date(isoDate);
		if (Number.isNaN(parsed.getTime())) {
			return String(isoDate);
		}

		return parsed.toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}

	function renderEmptyState(message) {
		ideaList.innerHTML = `
			<div class="alert alert-light border mb-0" role="status">${message}</div>
		`;
	}

	function formatLabel(value) {
		const text = String(value || '').trim();
		if (!text) {
			return 'none';
		}

		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	function updateActiveFiltersSummary() {
		const query = ideaSearch.value.trim();
		const queryLabel = query ? query : 'none';
		const tagLabel = activeTag === 'all' ? 'all' : activeTag;
		const favoritesLabel = showFavoritesOnly ? 'on' : 'off';
		const randomLabel = randomRecordId ? 'on' : 'off';
		const adminLabel = showAdminArea ? 'on' : 'off';

		activeFiltersSummary.textContent = `Sort: ${formatLabel(activeSort)} | Tag: ${tagLabel} | Favorites: ${favoritesLabel} | Admin: ${adminLabel} | Random: ${randomLabel} | Query: ${queryLabel}`;
	}

	function updateActionButtonState() {
		favoriteIdeasButton.classList.toggle('is-active', showFavoritesOnly);
		favoriteIdeasButton.innerHTML = showFavoritesOnly
			? '<i class="bi bi-heart-fill me-1" aria-hidden="true"></i>Favorites only'
			: '<i class="bi bi-heart me-1" aria-hidden="true"></i>Favorites only';

		randomIdeaButton.classList.toggle('is-active', Boolean(randomRecordId));
		randomIdeaButton.innerHTML = randomRecordId
			? '<i class="bi bi-shuffle me-1" aria-hidden="true"></i>Random one'
			: '<i class="bi bi-shuffle me-1" aria-hidden="true"></i>Random one';

		if (adminAreaButton) {
			adminAreaButton.classList.toggle('is-active', showAdminArea);
			adminAreaButton.innerHTML = showAdminArea
				? '<i class="bi bi-shield-lock-fill me-1" aria-hidden="true"></i>Admin area'
				: '<i class="bi bi-shield-lock me-1" aria-hidden="true"></i>Admin area';
		}
	}

	function readRecentSearches() {
		const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
		if (!raw) {
			return [];
		}

		try {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) {
				return [];
			}

			return parsed
				.map((item) => String(item || '').trim())
				.filter((item) => item.length > 0);
		} catch (error) {
			return [];
		}
	}

	function saveRecentSearches(items) {
		localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items.slice(0, MAX_RECENT_SEARCHES)));
	}

	function renderRecentSearches() {
		const items = readRecentSearches();

		if (!items.length) {
			recentSearches.innerHTML = '';
			return;
		}

		recentSearches.innerHTML = items
			.map(
				(item) => `
					<span class="bb-recent-chip">
						<button type="button" class="bb-recent-text" data-action="apply" data-query="${item.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}">${item.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</button>
						<button type="button" class="bb-recent-remove" aria-label="Delete recent search" data-action="delete" data-query="${item.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}">x</button>
					</span>
				`
			)
			.join('');
	}

	function storeRecentSearch(query) {
		const normalized = String(query || '').trim();
		if (!normalized) {
			return;
		}

		const existing = readRecentSearches();
		const deduped = existing.filter((item) => item.toLowerCase() !== normalized.toLowerCase());
		deduped.unshift(normalized);
		saveRecentSearches(deduped);
		renderRecentSearches();
	}

	function deleteRecentSearch(query) {
		const normalized = String(query || '').trim().toLowerCase();
		if (!normalized) {
			return;
		}

		const nextItems = readRecentSearches().filter((item) => item.toLowerCase() !== normalized);
		saveRecentSearches(nextItems);
		renderRecentSearches();
	}

	function extractTags(record) {
		const explicitTags = Array.isArray(record.tags) ? record.tags : [];
		const tagSet = new Set(
			explicitTags
				.map((tag) => String(tag || '').trim().toLowerCase())
				.filter((tag) => tag.length > 0)
		);

		const hashtagMatches = `${String(record.title || '')} ${String(record.description || '')}`.match(/#[a-z0-9_-]+/gi) || [];
		hashtagMatches.forEach((hashTag) => {
			tagSet.add(hashTag.replace('#', '').toLowerCase());
		});

		return Array.from(tagSet);
	}

	function buildRecordSearchText(record) {
		const tags = extractTags(record);
		const notesText = Array.isArray(record.notes)
			? record.notes
				.map((note) => [note && note.title, note && note.text, note && note.author].join(' '))
				.join(' ')
			: '';
		return [
			record.title || '',
			record.description || '',
			record.author || '',
			record.date || '',
			formatDate(record.date),
			tags.join(' '),
			notesText,
		]
			.join(' ')
			.toLowerCase();
	}

	function getRecordNotes(record) {
		if (!record || !Array.isArray(record.notes)) {
			return [];
		}

		return record.notes
			.map((note) => {
				const normalized = note && typeof note === 'object' ? note : {};
				return {
					id: String(normalized.id || ''),
					title: String(normalized.title || '').trim(),
					text: String(normalized.text || '').trim(),
					author: String(normalized.author || '').trim(),
					date: String(normalized.date || '').trim(),
				};
			})
			.filter((note) => note.title || note.text);
	}

	function renderIdeaNotes(record) {
		if (!ideaDetailNotes) {
			return;
		}

		ideaDetailNotes.innerHTML = '';
		const notes = getRecordNotes(record)
			.slice()
			.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

		if (!notes.length) {
			const emptyState = document.createElement('p');
			emptyState.className = 'text-muted small mb-0';
			emptyState.textContent = 'No notes yet. Add one below.';
			ideaDetailNotes.appendChild(emptyState);
			return;
		}

		notes.forEach((note) => {
			const card = document.createElement('article');
			card.className = 'border rounded p-2 bg-body-tertiary';
			card.setAttribute('data-note-id', note.id);

			const heading = document.createElement('div');
			heading.className = 'd-flex flex-wrap justify-content-between align-items-center gap-2 mb-1';

			const title = document.createElement('strong');
			title.textContent = note.title || 'Untitled note';

			const meta = document.createElement('span');
			meta.className = 'small text-muted';
			meta.textContent = `${note.author || 'unknown'} | ${formatDateTime(note.date)}`;

			const controls = document.createElement('div');
			controls.className = 'd-inline-flex gap-1';

			const editButton = document.createElement('button');
			editButton.type = 'button';
			editButton.className = 'btn btn-sm btn-outline-secondary py-0 px-2';
			editButton.setAttribute('data-note-action', 'edit');
			editButton.setAttribute('data-note-id', note.id);
			editButton.textContent = 'Edit';

			const deleteButton = document.createElement('button');
			deleteButton.type = 'button';
			deleteButton.className = 'btn btn-sm btn-outline-danger py-0 px-2';
			deleteButton.setAttribute('data-note-action', 'delete');
			deleteButton.setAttribute('data-note-id', note.id);
			deleteButton.textContent = 'Delete';

			controls.append(editButton, deleteButton);

			heading.append(title, meta, controls);

			const text = document.createElement('p');
			text.className = 'mb-0 small';
			text.textContent = note.text || '';

			card.append(heading, text);
			ideaDetailNotes.appendChild(card);
		});
	}

	function resetNoteFormState() {
		if (ideaNoteTitle instanceof HTMLInputElement) {
			ideaNoteTitle.value = '';
		}
		if (ideaNoteText instanceof HTMLTextAreaElement) {
			ideaNoteText.value = '';
		}
		if (ideaNoteDate instanceof HTMLInputElement) {
			ideaNoteDate.value = formatDateTime(new Date().toISOString());
		}
		if (ideaNoteForm instanceof HTMLFormElement) {
			ideaNoteForm.dataset.editNoteId = '';
			ideaNoteForm.classList.remove('was-validated');
			const submitButton = ideaNoteForm.querySelector('button[type="submit"]');
			if (submitButton) {
				submitButton.innerHTML = '<i class="bi bi-journal-plus me-1" aria-hidden="true"></i>Add Note';
			}
		}
		if (ideaNoteCancelEdit instanceof HTMLButtonElement) {
			ideaNoteCancelEdit.classList.add('d-none');
		}
	}

	function saveNoteToRecord(recordId, noteData) {
		const records = readStoredRecords();
		ensureRecordIds(records);
		let didChange = false;

		const nextRecords = records.map((record) => {
			if (String(record.id || '') !== String(recordId)) {
				return record;
			}

			didChange = true;
			const existingNotes = getRecordNotes(record);
			const nowIso = new Date().toISOString();
			return {
				...record,
				modifiedAt: nowIso,
				notes: [
					{
						id: `note-${Date.now()}`,
						title: String(noteData.title || '').trim(),
						text: String(noteData.text || '').trim(),
						author: String(noteData.author || '').trim() || sessionUser,
						date: nowIso,
					},
					...existingNotes,
				],
			};
		});

		if (!didChange) {
			return false;
		}

		saveAllRecords(nextRecords);
		return true;
	}

	function updateNoteInRecord(recordId, noteId, noteData) {
		const records = readStoredRecords();
		ensureRecordIds(records);
		let didChange = false;

		const nextRecords = records.map((record) => {
			if (String(record.id || '') !== String(recordId)) {
				return record;
			}

			const existingNotes = getRecordNotes(record);
			const nowIso = new Date().toISOString();
			const updatedNotes = existingNotes.map((note) => {
				if (String(note.id || '') !== String(noteId)) {
					return note;
				}

				didChange = true;
				return {
					...note,
					title: String(noteData.title || '').trim(),
					text: String(noteData.text || '').trim(),
					author: note.author || String(noteData.author || '').trim() || sessionUser,
					date: nowIso,
				};
			});

			if (!didChange) {
				return record;
			}

			return {
				...record,
				modifiedAt: nowIso,
				notes: updatedNotes,
			};
		});

		if (!didChange) {
			return false;
		}

		saveAllRecords(nextRecords);
		return true;
	}

	function deleteNoteFromRecord(recordId, noteId) {
		const records = readStoredRecords();
		ensureRecordIds(records);
		let didChange = false;

		const nextRecords = records.map((record) => {
			if (String(record.id || '') !== String(recordId)) {
				return record;
			}

			const existingNotes = getRecordNotes(record);
			const filteredNotes = existingNotes.filter((note) => String(note.id || '') !== String(noteId));
			if (filteredNotes.length === existingNotes.length) {
				return record;
			}

			didChange = true;
			return {
				...record,
				modifiedAt: new Date().toISOString(),
				notes: filteredNotes,
			};
		});

		if (!didChange) {
			return false;
		}

		saveAllRecords(nextRecords);
		return true;
	}

	function compareRecords(a, b) {
		if (activeSort === 'title') {
			return String(a.title || '').localeCompare(String(b.title || ''));
		}

		if (activeSort === 'author') {
			return String(a.author || '').localeCompare(String(b.author || ''));
		}

		if (activeSort === 'modified') {
			const aTime = new Date(a.modifiedAt || a.date || a.createdAt || 0).getTime();
			const bTime = new Date(b.modifiedAt || b.date || b.createdAt || 0).getTime();
			return bTime - aTime;
		}

		const aTime = new Date(a.createdAt || a.date || a.modifiedAt || 0).getTime();
		const bTime = new Date(b.createdAt || b.date || b.modifiedAt || 0).getTime();
		return bTime - aTime;
	}

	function renderTagFilters(records) {
		const tagCounts = new Map();
		records
			.filter((record) => {
				const status = getRecordStatus(record);
				if (showAdminArea) {
					return status === 'deleted';
				}

				return status !== 'deleted';
			})
			.forEach((record) => {
			extractTags(record).forEach((tag) => {
				tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
			});
		});

		const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
		tagFilterButtons.innerHTML = '';

		const allButton = document.createElement('button');
		allButton.type = 'button';
		allButton.className = `btn btn-sm bb-filter-toggle ${activeTag === 'all' ? 'is-active' : ''}`;
		allButton.setAttribute('data-tag', 'all');
		allButton.textContent = 'All tags';
		tagFilterButtons.appendChild(allButton);

		sortedTags.slice(0, 12).forEach(([tag, count]) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = `btn btn-sm bb-filter-toggle ${activeTag === tag ? 'is-active' : ''}`;
			button.setAttribute('data-tag', tag);
			button.textContent = `${tag} (${count})`;
			tagFilterButtons.appendChild(button);
		});
	}

	function renderRecords(records) {
		if (!records.length) {
			renderEmptyState('No matching ideas yet.');
			return;
		}

		ideaList.innerHTML = '';

		records.forEach((record) => {
			const fragment = ideaCardTemplate.content.cloneNode(true);
			const cardEl = fragment.querySelector('.bb-idea-card');
			const titleEl = fragment.querySelector('[data-field="title"]');
			const dateEl = fragment.querySelector('[data-field="date"]');
			const authorEl = fragment.querySelector('[data-field="author"]');
			const descEl = fragment.querySelector('[data-field="description"]');
			const imageEl = fragment.querySelector('[data-field="image"]');
			const tagsEl = fragment.querySelector('[data-field="tags"]');
			const statusEl = fragment.querySelector('[data-field="status"]');
			const favoriteButton = fragment.querySelector('[data-field="favorite"]');

			if (!cardEl || !titleEl || !dateEl || !authorEl || !descEl || !imageEl || !tagsEl || !statusEl || !favoriteButton) {
				return;
			}

			const title = String(record.title || 'Untitled idea');
			titleEl.textContent = title;
			dateEl.textContent = formatDate(record.date);
			authorEl.textContent = `by ${String(record.author || 'unknown')}`;
			descEl.textContent = String(record.description || 'No description yet.');
			imageEl.setAttribute('src', String(record.image || 'https://picsum.photos/seed/brainbucket/280/180'));
			imageEl.setAttribute('alt', title);
			favoriteButton.setAttribute('data-id', String(record.id || ''));
			favoriteButton.classList.toggle('is-active', Boolean(record.favorite));
			favoriteButton.innerHTML = record.favorite
				? '<i class="bi bi-heart-fill" aria-hidden="true"></i>'
				: '<i class="bi bi-heart" aria-hidden="true"></i>';
			cardEl.setAttribute('data-record-id', String(record.id || ''));
			cardEl.setAttribute('tabindex', '0');
			cardEl.setAttribute('role', 'button');
			cardEl.setAttribute('aria-label', `Open details for ${title}`);
			cardEl.classList.add('is-clickable');

			const isDeleted = getRecordStatus(record) === 'deleted';
			statusEl.classList.toggle('d-none', !isDeleted);
			statusEl.textContent = isDeleted ? 'Deleted' : 'Active';

			const tags = extractTags(record);
			tags.slice(0, 5).forEach((tag) => {
				const tagChip = document.createElement('span');
				tagChip.className = 'bb-idea-tag';
				tagChip.textContent = `#${tag}`;
				tagsEl.appendChild(tagChip);
			});

			ideaList.appendChild(fragment);
		});
	}

	function updateIdeaStatus(recordId, nextStatus) {
		const records = readStoredRecords();
		ensureRecordIds(records);
		let didChange = false;
		const nowIso = new Date().toISOString();

		const nextRecords = records.map((record) => {
			if (String(record.id || '') !== String(recordId)) {
				return record;
			}

			didChange = true;
			if (nextStatus === 'deleted') {
				return {
					...record,
					status: 'deleted',
					deletedAt: nowIso,
					deletedBy: sessionUser,
					modifiedAt: nowIso,
				};
			}

			return {
				...record,
				status: 'active',
				deletedAt: '',
				deletedBy: '',
				modifiedAt: nowIso,
			};
		});

		if (!didChange) {
			return false;
		}

		saveAllRecords(nextRecords);
		return true;
	}

	function buildUserStoryText(record) {
		const story = record && typeof record.userStory === 'object' ? record.userStory : null;
		if (!story) {
			return 'No user story provided.';
		}

		const asA = String(story.asA || '').trim();
		const iWant = String(story.iWant || '').trim();
		const soThat = String(story.soThat || '').trim();

		if (!asA && !iWant && !soThat) {
			return 'No user story provided.';
		}

		const parts = [];
		if (asA) {
			parts.push(`As a ${asA}`);
		}
		if (iWant) {
			parts.push(`I want ${iWant}`);
		}
		if (soThat) {
			parts.push(`so that ${soThat}`);
		}

		const sentence = parts.join(', ');
		return sentence.endsWith('.') ? sentence : `${sentence}.`;
	}

	function openIdeaDetails(recordId) {
		if (!recordId || !ideaDetailModalEl || !ideaDetailTitle || !ideaDetailTagline || !ideaDetailAuthor || !ideaDetailCreated || !ideaDetailModified || !ideaDetailImage || !ideaDetailNarrative || !ideaDetailUserStory || !ideaDetailTags || !ideaDetailLinks || !window.bootstrap) {
			return;
		}

		const records = readStoredRecords();
		ensureRecordIds(records);
		const record = records.find((entry) => String(entry.id || '') === String(recordId));
		if (!record) {
			return;
		}

		activeModalRecordId = String(record.id || '');

		ideaDetailTitle.textContent = String(record.title || 'Untitled idea');
		ideaDetailTagline.textContent = String(record.tagline || 'No tagline provided.');
		ideaDetailAuthor.textContent = String(record.author || 'unknown');
		ideaDetailCreated.textContent = formatDateTime(record.createdAt || record.date);
		ideaDetailModified.textContent = formatDateTime(record.modifiedAt || record.createdAt || record.date);
		ideaDetailNarrative.textContent = String(record.narrative || record.description || 'No narrative provided.');
		ideaDetailUserStory.textContent = buildUserStoryText(record);
		ideaDetailImage.setAttribute('src', String(record.image || 'https://picsum.photos/seed/brainbucket/640/360'));
		ideaDetailImage.setAttribute('alt', String(record.title || 'Idea image'));

		const isDeleted = getRecordStatus(record) === 'deleted';
		if (ideaDeleteBtn instanceof HTMLButtonElement) {
			ideaDeleteBtn.classList.toggle('d-none', isDeleted);
		}
		if (ideaRestoreBtn instanceof HTMLButtonElement) {
			ideaRestoreBtn.classList.toggle('d-none', !isDeleted);
		}
		if (ideaEditBtn instanceof HTMLButtonElement) {
			ideaEditBtn.disabled = isDeleted;
		}

		ideaDetailTags.innerHTML = '';
		const tags = extractTags(record);
		if (!tags.length) {
			const emptyTag = document.createElement('span');
			emptyTag.className = 'text-muted small';
			emptyTag.textContent = 'No tags provided.';
			ideaDetailTags.appendChild(emptyTag);
		} else {
			tags.forEach((tag) => {
				const tagChip = document.createElement('span');
				tagChip.className = 'bb-idea-tag';
				tagChip.textContent = `#${tag}`;
				ideaDetailTags.appendChild(tagChip);
			});
		}

		ideaDetailLinks.innerHTML = '';
		const links = Array.isArray(record.links) ? record.links : [];
		if (!links.length) {
			const emptyLink = document.createElement('li');
			emptyLink.className = 'text-muted';
			emptyLink.textContent = 'No links provided.';
			ideaDetailLinks.appendChild(emptyLink);
		} else {
			links.forEach((link) => {
				const listItem = document.createElement('li');
				const anchor = document.createElement('a');
				const linkUrl = String(link && link.url ? link.url : '').trim();
				const linkType = String(link && link.type ? link.type : 'resource').trim();
				const linkDescription = String(link && link.description ? link.description : '').trim();

				anchor.setAttribute('href', linkUrl || '#');
				anchor.setAttribute('target', '_blank');
				anchor.setAttribute('rel', 'noopener noreferrer');
				anchor.textContent = linkDescription || linkUrl || 'Untitled link';

				if (!linkUrl) {
					anchor.removeAttribute('href');
					anchor.removeAttribute('target');
					anchor.removeAttribute('rel');
				}

				listItem.appendChild(anchor);
				if (linkType) {
					listItem.append(` (${linkType})`);
				}
				ideaDetailLinks.appendChild(listItem);
			});
		}

		renderIdeaNotes(record);

		if (ideaNoteRecordId instanceof HTMLInputElement) {
			ideaNoteRecordId.value = String(record.id || '');
		}
		if (ideaNoteAuthor instanceof HTMLInputElement) {
			ideaNoteAuthor.value = sessionUser;
		}
		if (ideaNoteDate instanceof HTMLInputElement) {
			ideaNoteDate.value = formatDateTime(new Date().toISOString());
		}
		resetNoteFormState();

		ideaDetailModal = ideaDetailModal || window.bootstrap.Modal.getOrCreateInstance(ideaDetailModalEl);
		ideaDetailModal.show();
	}

	function applySearch() {
		const records = readStoredRecords();
		ensureRecordIds(records);
		updateActiveFiltersSummary();
		updateActionButtonState();

		if (!records.length) {
			renderEmptyState('No saved ideas yet. Use Add Idea from your profile menu.');
			return;
		}

		const query = ideaSearch.value.trim().toLowerCase();
		renderTagFilters(records);

		const filtered = records
			.filter((record) => {
				const status = getRecordStatus(record);
				if (showAdminArea) {
					if (status !== 'deleted') {
						return false;
					}
				} else if (status === 'deleted') {
					return false;
				}

				if (activeTag !== 'all' && !extractTags(record).includes(activeTag)) {
					return false;
				}

				if (showFavoritesOnly && !record.favorite) {
					return false;
				}

				if (!query) {
					return true;
				}

				const haystack = buildRecordSearchText(record);
				return haystack.includes(query);
			})
			.sort(compareRecords);

		if (randomRecordId) {
			const randomMatch = filtered.find((record) => String(record.id) === randomRecordId);
			if (randomMatch) {
				renderRecords([randomMatch]);
				return;
			}

			randomRecordId = '';
			updateActiveFiltersSummary();
		}

		renderRecords(filtered);
	}

	ideaSearch.addEventListener('input', () => {
		randomRecordId = '';
		applySearch();
	});

	ideaSearch.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter') {
			return;
		}

		event.preventDefault();
		storeRecentSearch(ideaSearch.value);
		applySearch();
	});

	sortButtons.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const button = target.closest('[data-sort]');
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		const sort = button.getAttribute('data-sort');
		if (!sort) {
			return;
		}

		activeSort = sort;
		randomRecordId = '';
		Array.from(sortButtons.querySelectorAll('[data-sort]')).forEach((sortBtn) => {
			sortBtn.classList.toggle('is-active', sortBtn.getAttribute('data-sort') === activeSort);
		});

		applySearch();
	});

	tagFilterButtons.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const button = target.closest('[data-tag]');
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		const tag = button.getAttribute('data-tag');
		if (!tag) {
			return;
		}

		activeTag = tag;
		randomRecordId = '';
		Array.from(tagFilterButtons.querySelectorAll('[data-tag]')).forEach((tagBtn) => {
			tagBtn.classList.toggle('is-active', tagBtn.getAttribute('data-tag') === activeTag);
		});

		applySearch();
	});

	recentSearches.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const actionEl = target.closest('[data-action][data-query]');
		if (!(actionEl instanceof HTMLElement)) {
			return;
		}

		const action = actionEl.getAttribute('data-action');
		const query = actionEl.getAttribute('data-query') || '';

		if (action === 'apply') {
			ideaSearch.value = query;
			ideaSearch.focus();
			randomRecordId = '';
			applySearch();
			return;
		}

		if (action === 'delete') {
			deleteRecentSearch(query);
		}
	});

	favoriteIdeasButton.addEventListener('click', () => {
		showFavoritesOnly = !showFavoritesOnly;
		randomRecordId = '';
		applySearch();
	});

	randomIdeaButton.addEventListener('click', () => {
		const records = readStoredRecords();
		ensureRecordIds(records);
		const query = ideaSearch.value.trim().toLowerCase();

		const candidates = records
			.filter((record) => {
				const status = getRecordStatus(record);
				if (showAdminArea) {
					if (status !== 'deleted') {
						return false;
					}
				} else if (status === 'deleted') {
					return false;
				}

				if (activeTag !== 'all' && !extractTags(record).includes(activeTag)) {
					return false;
				}

				if (showFavoritesOnly && !record.favorite) {
					return false;
				}

				if (!query) {
					return true;
				}

				return buildRecordSearchText(record).includes(query);
			})
			.sort(compareRecords);

		if (!candidates.length) {
			randomRecordId = '';
			applySearch();
			return;
		}

		const randomIndex = Math.floor(Math.random() * candidates.length);
		randomRecordId = String(candidates[randomIndex].id || '');
		applySearch();
	});

	if (adminAreaButton) {
		adminAreaButton.addEventListener('click', () => {
			showAdminArea = !showAdminArea;
			randomRecordId = '';
			applySearch();
		});
	}

	ideaList.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const button = target.closest('[data-field="favorite"]');
		if (!(button instanceof HTMLButtonElement)) {
			return;
		}

		const recordId = button.getAttribute('data-id');
		if (!recordId) {
			return;
		}

		const records = readStoredRecords();
		let didChange = false;
		const nextRecords = records.map((record) => {
			if (String(record.id || '') !== recordId) {
				return record;
			}

			didChange = true;
			return {
				...record,
				favorite: !record.favorite,
			};
		});

		if (!didChange) {
			return;
		}

		saveAllRecords(nextRecords);
		applySearch();
		return;
	});

	ideaList.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		if (target.closest('[data-field="favorite"]')) {
			return;
		}

		const card = target.closest('.bb-idea-card[data-record-id]');
		if (!(card instanceof HTMLElement)) {
			return;
		}

		openIdeaDetails(card.getAttribute('data-record-id') || '');
	});

	ideaList.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}

		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const card = target.closest('.bb-idea-card[data-record-id]');
		if (!(card instanceof HTMLElement)) {
			return;
		}

		event.preventDefault();
		openIdeaDetails(card.getAttribute('data-record-id') || '');
	});

	if (ideaNoteForm instanceof HTMLFormElement) {
		ideaNoteForm.addEventListener('submit', (event) => {
			event.preventDefault();

			if (!(ideaNoteRecordId instanceof HTMLInputElement) || !(ideaNoteAuthor instanceof HTMLInputElement) || !(ideaNoteTitle instanceof HTMLInputElement) || !(ideaNoteText instanceof HTMLTextAreaElement)) {
				return;
			}

			const recordId = ideaNoteRecordId.value.trim();
			const title = ideaNoteTitle.value.trim();
			const text = ideaNoteText.value.trim();
			const editNoteId = String(ideaNoteForm.dataset.editNoteId || '').trim();

			if (!recordId || !title || !text) {
				ideaNoteForm.classList.add('was-validated');
				return;
			}

			const didSave = editNoteId
				? updateNoteInRecord(recordId, editNoteId, {
					author: ideaNoteAuthor.value.trim(),
					title,
					text,
				})
				: saveNoteToRecord(recordId, {
					author: ideaNoteAuthor.value.trim(),
					title,
					text,
				});

			if (!didSave) {
				return;
			}

			applySearch();
			openIdeaDetails(recordId);
		});
	}

	if (ideaNoteCancelEdit instanceof HTMLButtonElement) {
		ideaNoteCancelEdit.addEventListener('click', () => {
			resetNoteFormState();
		});
	}

	if (ideaEditBtn instanceof HTMLButtonElement) {
		ideaEditBtn.addEventListener('click', () => {
			if (!activeModalRecordId) {
				return;
			}

			const editUrl = window.brainBucketAuth.buildAppUrl(`pages/form.html?editId=${encodeURIComponent(activeModalRecordId)}`);
			window.location.assign(editUrl);
		});
	}

	if (ideaDeleteBtn instanceof HTMLButtonElement) {
		ideaDeleteBtn.addEventListener('click', () => {
			if (!activeModalRecordId) {
				return;
			}

			const confirmed = window.confirm('Move this idea to deleted status? It will remain visible in Admin area.');
			if (!confirmed) {
				return;
			}

			const didUpdate = updateIdeaStatus(activeModalRecordId, 'deleted');
			if (!didUpdate) {
				return;
			}

			if (ideaDetailModal) {
				ideaDetailModal.hide();
			}
			applySearch();
		});
	}

	if (ideaRestoreBtn instanceof HTMLButtonElement) {
		ideaRestoreBtn.addEventListener('click', () => {
			if (!activeModalRecordId) {
				return;
			}

			const didUpdate = updateIdeaStatus(activeModalRecordId, 'active');
			if (!didUpdate) {
				return;
			}

			applySearch();
			openIdeaDetails(activeModalRecordId);
		});
	}

	if (ideaDetailNotes instanceof HTMLElement) {
		ideaDetailNotes.addEventListener('click', (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) {
				return;
			}

			const actionButton = target.closest('[data-note-action][data-note-id]');
			if (!(actionButton instanceof HTMLButtonElement)) {
				return;
			}

			if (!(ideaNoteRecordId instanceof HTMLInputElement) || !(ideaNoteTitle instanceof HTMLInputElement) || !(ideaNoteText instanceof HTMLTextAreaElement) || !(ideaNoteDate instanceof HTMLInputElement) || !(ideaNoteAuthor instanceof HTMLInputElement) || !(ideaNoteForm instanceof HTMLFormElement)) {
				return;
			}

			const recordId = ideaNoteRecordId.value.trim();
			const noteId = actionButton.getAttribute('data-note-id') || '';
			const action = actionButton.getAttribute('data-note-action') || '';
			if (!recordId || !noteId || !action) {
				return;
			}

			const records = readStoredRecords();
			ensureRecordIds(records);
			const record = records.find((entry) => String(entry.id || '') === recordId);
			if (!record) {
				return;
			}

			const note = getRecordNotes(record).find((entry) => String(entry.id || '') === String(noteId));
			if (!note) {
				return;
			}

			if (action === 'edit') {
				ideaNoteForm.dataset.editNoteId = note.id;
				ideaNoteAuthor.value = note.author || sessionUser;
				ideaNoteDate.value = formatDateTime(note.date);
				ideaNoteTitle.value = note.title || '';
				ideaNoteText.value = note.text || '';
				ideaNoteForm.classList.remove('was-validated');

				const submitButton = ideaNoteForm.querySelector('button[type="submit"]');
				if (submitButton) {
					submitButton.innerHTML = '<i class="bi bi-pencil-square me-1" aria-hidden="true"></i>Save Note';
				}
				if (ideaNoteCancelEdit instanceof HTMLButtonElement) {
					ideaNoteCancelEdit.classList.remove('d-none');
				}
				ideaNoteTitle.focus();
				return;
			}

			if (action === 'delete') {
				const confirmed = window.confirm('Delete this note?');
				if (!confirmed) {
					return;
				}

				const didDelete = deleteNoteFromRecord(recordId, note.id);
				if (!didDelete) {
					return;
				}

				applySearch();
				openIdeaDetails(recordId);
			}
		});
	}

	seedRecordsFromInternalData().finally(() => {
		renderRecentSearches();
		applySearch();
	});

	if (logoutButton) {
		logoutButton.addEventListener('click', () => {
			window.brainBucketAuth.clearSession();
			window.location.assign(window.brainBucketAuth.getAuthUrl());
		});
	}
})();
