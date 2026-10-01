import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const html = await readFile(new URL('../../public/hotel.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../../public/assets/js/hotel.js', import.meta.url), 'utf8');

async function ready(document) {
  for (let i = 0; i < 100; i++) {
    if (!document.getElementById('saveButton').disabled) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Frontend did not finish the request.');
}

function setup({offline = false, initial = []} = {}) {
  const dom = new JSDOM(html, {url: 'http://localhost:3000', runScripts: 'outside-only'});
  const {window} = dom;
  const records = [...initial];
  const calls = [];
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.AbortSignal.timeout = () => undefined;
  window.confirm = () => true;
  window.fetch = async (path, options = {}) => {
    calls.push({path, method: options.method, body: options.body});
    if (offline) throw new window.TypeError('Failed to fetch');
    const url = new URL(path, 'http://localhost:3000');
    const method = options.method || 'GET';
    let data;
    let status = 200;
    if (url.pathname === '/api/health') {
      data = {database: 'connected', devTools: false};
    } else if (url.pathname === '/api/students' && method === 'GET') {
      data = records.filter((student) => !url.searchParams.get('major') ||
        student.major === url.searchParams.get('major'));
    } else if (url.pathname === '/api/students' && method === 'POST') {
      data = {...JSON.parse(options.body), _id: '1234567890abcdef12345678'};
      records.push(data);
      status = 201;
    } else {
      const id = url.pathname.split('/').at(-1);
      const index = records.findIndex((student) => student._id === id);
      if (index < 0) {
        data = {error: 'Student not found.'};
        status = 404;
      } else if (method === 'PATCH') {
        records[index] = {...records[index], ...JSON.parse(options.body)};
        data = records[index];
      } else if (method === 'DELETE') {
        records.splice(index, 1);
        data = {deletedCount: 1};
      } else {
        data = records[index];
      }
    }
    return {ok: status < 400, status, json: async () => structuredClone(data)};
  };
  window.eval(script);
  return {dom, window, document: window.document, records, calls};
}

function submit(window, id) {
  window.document.getElementById(id).dispatchEvent(new window.Event('submit', {cancelable: true}));
}

test('frontend creates, filters, retrieves, edits, and deletes using fetch', async () => {
  const {dom, window, document, records, calls} = setup();
  try {
    await ready(document);
    assert.match(document.getElementById('listStatus').textContent, /No students yet/);
    document.getElementById('studentName').value = 'Alex Example';
    document.getElementById('studentMajor').value = 'CIS';
    submit(window, 'studentForm');
    await ready(document);
    assert.equal(records.length, 1);
    assert.equal(document.querySelectorAll('.student-card').length, 1);
    document.getElementById('majorFilter').value = 'Business';
    submit(window, 'filterForm');
    await ready(document);
    assert.equal(document.querySelectorAll('.student-card').length, 0);
    document.getElementById('showAllButton').click();
    await ready(document);
    document.querySelector('.student-card button').click();
    await ready(document);
    assert.match(document.getElementById('selectedDetails').textContent, /Alex Example/);
    document.querySelectorAll('.student-card button')[1].click();
    await ready(document);
    assert.equal(document.getElementById('studentName').value, 'Alex Example');
    document.getElementById('studentMajor').value = 'Business';
    submit(window, 'studentForm');
    await ready(document);
    assert.equal(records[0].major, 'Business');
    document.querySelectorAll('.student-card button')[2].click();
    await ready(document);
    assert.equal(records.length, 0);
    assert.ok(calls.some((call) => call.method === 'POST'));
    assert.ok(calls.some((call) => call.method === 'PATCH'));
    assert.ok(calls.some((call) => call.method === 'DELETE'));
    assert.ok(calls.some((call) => call.path === '/api/students?major=Business'));
  } finally {
    dom.window.close();
  }
});

test('frontend treats stored markup as text and handles missing IDs', async () => {
  const {dom, window, document} = setup({initial: [{_id: '1234567890abcdef12345678',
    name: '<img src=x onerror=alert(1)>', major: 'CIS', notes: '<script>alert(1)</script>'}]});
  try {
    await ready(document);
    assert.equal(document.querySelectorAll('.student-card img, .student-card script').length, 0);
    assert.match(document.querySelector('.student-card h3').textContent, /<img/);
    document.getElementById('lookupId').value = '000000000000000000000000';
    submit(window, 'lookupForm');
    await ready(document);
    assert.equal(document.getElementById('feedback').textContent, 'Student not found.');
    assert.ok(document.getElementById('selectedPanel').classList.contains('d-none'));
  } finally {
    dom.window.close();
  }
});

test('frontend shows connection errors and re-enables controls after failure', async () => {
  const {dom, document} = setup({offline: true});
  try {
    await ready(document);
    assert.match(document.getElementById('feedback').textContent, /Could not reach the server/);
    assert.equal(document.getElementById('refreshButton').disabled, false);
    assert.ok(document.getElementById('devTools').classList.contains('d-none'));
  } finally {
    dom.window.close();
  }
});
