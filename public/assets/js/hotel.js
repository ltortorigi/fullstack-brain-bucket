'use strict';

const ui = (id) => document.getElementById(id);
let editingId = null;
let selectedId = null;
let busy = false;

function feedback(message, error = false) {
  ui('feedback').textContent = message;
  ui('feedback').className = `alert ${error ? 'alert-danger' : 'alert-success'}`;
}

async function request(url, method = 'GET', body) {
  const options = {method, signal: AbortSignal.timeout(15000)};
  if (body !== undefined) {
    options.headers = {'Content-Type': 'application/json'};
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  const data = await response.json();
  ui('requestLabel').textContent = `${method} ${url} — ${response.status}`;
  ui('apiOutput').textContent = JSON.stringify(data, null, 2);
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

async function run(action) {
  if (busy) return;
  busy = true;
  ui('feedback').className = 'alert d-none';
  document.querySelectorAll('button, input, textarea').forEach((control) => {
    control.disabled = true;
  });
  try {
    await action();
  } catch (error) {
    const message = error.name === 'TimeoutError' || error instanceof TypeError ?
      'Could not reach the server. Please try again.' : error.message;
    feedback(message, true);
  } finally {
    busy = false;
    document.querySelectorAll('button, input, textarea').forEach((control) => {
      control.disabled = false;
    });
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function actionButton(text, className, action) {
  const button = element('button', `btn btn-sm ${className}`, text);
  button.type = 'button';
  button.disabled = busy;
  button.addEventListener('click', () => run(action));
  return button;
}

async function loadStudents() {
  const major = ui('majorFilter').value.trim();
  ui('listStatus').textContent = 'Loading students…';
  let students;
  try {
    students = await request(`/api/students${major ? `?major=${encodeURIComponent(major)}` : ''}`);
  } catch (error) {
    ui('listStatus').textContent = 'Could not refresh the directory. Any records below may be out of date.';
    throw error;
  }
  ui('studentList').replaceChildren();
  ui('recordCount').textContent = students.length;
  ui('listStatus').textContent = students.length ?
    `${students.length} student${students.length === 1 ? '' : 's'}${major ? ` in ${major}` : ' across all majors'}.` :
    (major ? 'No students match this major. Try Show all.' : 'No students yet. Add your first student using the form.');
  for (const student of students) {
    const card = element('article', 'student-card');
    const heading = element('div', 'd-flex flex-wrap justify-content-between gap-2 align-items-start');
    heading.append(element('h3', 'mb-0', student.name), element('span', 'major-badge', student.major));
    card.append(heading, element('p', 'student-id mt-2 mb-2', student._id));
    if (student.notes) card.append(element('p', 'student-notes mb-3', student.notes));
    const buttons = element('div', 'd-flex gap-2 flex-wrap');
    buttons.append(
        actionButton('View', 'btn-outline-secondary', () => viewStudent(student._id)),
        actionButton('Edit', 'btn-outline-primary', () => editStudent(student._id)),
        actionButton('Delete', 'btn-outline-danger', () => deleteStudent(student)));
    card.append(buttons);
    ui('studentList').append(card);
  }
}

function showDetails(student) {
  selectedId = student._id;
  ui('selectedDetails').replaceChildren();
  for (const [label, value] of Object.entries({
    Name: student.name, Major: student.major, Notes: student.notes || 'No notes',
    ID: student._id,
  })) {
    ui('selectedDetails').append(element('dt', 'small text-secondary', label),
        element('dd', 'mb-3', value));
  }
  ui('selectedPanel').classList.remove('d-none');
}

async function viewStudent(id) {
  showDetails(await request(`/api/students/${encodeURIComponent(id)}`));
}

async function editStudent(id) {
  const student = await request(`/api/students/${encodeURIComponent(id)}`);
  editingId = student._id;
  ui('studentName').value = student.name;
  ui('studentMajor').value = student.major;
  ui('studentNotes').value = student.notes || '';
  ui('formTitle').textContent = 'Edit student';
  ui('saveButton').textContent = 'Save changes';
  ui('cancelEdit').classList.remove('d-none');
  ui('studentForm').scrollIntoView({behavior: 'smooth', block: 'center'});
}

function resetForm() {
  editingId = null;
  ui('studentForm').reset();
  ui('formTitle').textContent = 'Add a student';
  ui('saveButton').textContent = 'Add student';
  ui('cancelEdit').classList.add('d-none');
}

function closeDetails() {
  selectedId = null;
  ui('selectedPanel').classList.add('d-none');
}

async function deleteStudent(student) {
  if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) return;
  await request(`/api/students/${encodeURIComponent(student._id)}`, 'DELETE');
  if (editingId === student._id) resetForm();
  if (selectedId === student._id) closeDetails();
  await loadStudents();
  feedback('Student deleted.');
}

ui('studentForm').addEventListener('submit', (event) => {
  event.preventDefault();
  run(async () => {
    const update = Boolean(editingId);
    const student = await request(update ? `/api/students/${editingId}` : '/api/students',
        update ? 'PATCH' : 'POST', {
          name: ui('studentName').value.trim(),
          major: ui('studentMajor').value.trim(),
          notes: ui('studentNotes').value.trim(),
        });
    resetForm();
    ui('majorFilter').value = '';
    await loadStudents();
    showDetails(student);
    feedback(update ? 'Changes saved to MongoDB.' : 'Student added to MongoDB.');
  });
});
ui('cancelEdit').addEventListener('click', resetForm);
ui('closeDetails').addEventListener('click', closeDetails);
ui('refreshButton').addEventListener('click', () => run(loadStudents));
ui('filterForm').addEventListener('submit', (event) => {
  event.preventDefault();
  run(loadStudents);
});
ui('showAllButton').addEventListener('click', () => {
  ui('majorFilter').value = '';
  run(loadStudents);
});
ui('lookupForm').addEventListener('submit', (event) => {
  event.preventDefault();
  run(async () => {
    closeDetails();
    await viewStudent(ui('lookupId').value.trim());
    feedback('Student found.');
  });
});
ui('seedButton').addEventListener('click', () => run(async () => {
  const result = await request('/api/dev/seed', 'POST');
  ui('majorFilter').value = '';
  await loadStudents();
  feedback(`${result.insertedCount} sample students added.`);
}));
ui('clearButton').addEventListener('click', () => run(async () => {
  if (!window.confirm('Remove all sample records? Regular student records will be kept.')) return;
  const result = await request('/api/dev/clear', 'DELETE');
  resetForm();
  closeDetails();
  await loadStudents();
  feedback(`${result.deletedCount} sample students removed.`);
}));

run(async () => {
  try {
    const health = await request('/api/health');
    ui('connectionStatus').textContent = 'Connected to MongoDB';
    ui('connectionStatus').classList.add('connected');
    ui('devTools').classList.toggle('d-none', !health.devTools);
  } catch (error) {
    ui('connectionStatus').textContent = 'Connection unavailable';
    ui('connectionStatus').classList.add('disconnected');
    ui('listStatus').textContent = 'Could not load students. Refresh when the server is available.';
    throw error;
  }
  await loadStudents();
});
