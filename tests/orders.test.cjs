// Local integration boundary tests. No network requests or customer data are sent.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const {webcrypto} = require('node:crypto');

const source = fs.readFileSync(path.join(__dirname, '..', 'orders.js'), 'utf8');
const endpoint = 'https://script.google.com/macros/s/TEST_DEPLOYMENT/exec';
const googleOrigin = 'https://example-script.googleusercontent.com';
const tick = () => new Promise(resolve => setImmediate(resolve));

class Element {
  constructor(value = '') {
    this.value = value;
    this.disabled = false;
    this.hidden = false;
    this.textContent = '';
    this.attributes = new Map();
    this.listeners = new Map();
    this.classes = new Set();
    this.classList = {
      toggle: (name, force) => {
        const active = force === undefined ? !this.classes.has(name) : force;
        active ? this.classes.add(name) : this.classes.delete(name);
        return active;
      },
    };
  }
  addEventListener(name, callback) {
    const listeners = this.listeners.get(name) || [];
    listeners.push(callback);
    this.listeners.set(name, listeners);
  }
  dispatch(name, event = {}) {
    for (const listener of this.listeners.get(name) || []) listener(event);
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  focus() { this.focused = true; }
  remove() { this.removed = true; }
}

function makeForm(id) {
  const form = new Element();
  form.id = id;
  form.dataset = id === 'consultation-form' ? {requestType:'consultation'} : {};
  form.fields = {
    name:new Element('Nguyễn An'),
    phone:new Element('0935 176 188'),
    email:new Element(''),
    product:new Element('Hộp quà An Khang'),
    quantity:new Element('2'),
    occasion:new Element('Tặng đối tác'),
    notes:new Element('Gọi trước khi giao'),
  };
  form.fields.product.options = [{value:''}, {value:'Hộp quà An Khang'}];
  form.feedback = new Element();
  form.label = new Element();
  form.label.textContent = id === 'consultation-form' ? 'TƯ VẤN' : 'ĐẶT HÀNG';
  form.submit = new Element();
  form.elements = [...Object.values(form.fields), form.submit];
  form.querySelector = selector => {
    if (selector === '.form-feedback') return form.feedback;
    if (selector === '.order-label') return form.label;
    if (selector === '.form-submit') return form.submit;
    return form.fields[selector.match(/^\[name="([^"]+)"\]$/)?.[1]];
  };
  form.querySelectorAll = selector => selector === 'input, select, textarea' ? Object.values(form.fields) : [];
  form.reset = () => { form.resetCount = (form.resetCount || 0) + 1; };
  form.send = () => form.dispatch('submit', {preventDefault() {}});
  return form;
}

function setup(config = {googleScriptUrl:endpoint, timeoutMs:25000}, pageLocation = {origin:'http://127.0.0.1:8765', protocol:'http:'}) {
  const forms = [makeForm('quick-form'), makeForm('contact-form'), makeForm('consultation-form')];
  const frames = [];
  const messages = new Set();
  const timers = new Map();
  let nextTimer = 1;
  let selectedItems = null;
  let selectionLocked = false;
  let selectionResets = 0;
  const picker = {
    getItems:() => (selectedItems || [{product:forms[0].fields.product.value, quantity:Number(forms[0].fields.quantity.value)}]).map(item => ({...item})),
    validate:form => {
      const values = selectedItems || [{product:form.fields.product.value, quantity:Number(form.fields.quantity.value)}];
      for (const item of values) {
        const validProduct = Boolean(item.product);
        const validQuantity = Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 10000;
        if (!validProduct || !validQuantity) {
          const element = form.fields[!validProduct ? 'product' : 'quantity'];
          element.setAttribute('aria-invalid','true');
          return {element,message:'Kiểm tra lựa chọn bộ quà và số lượng.'};
        }
      }
      return null;
    },
    setLocked:value => { selectionLocked = value; },
    reset:() => { selectionResets++; },
  };
  const window = {
    VUA_TOI_CONFIG:config,
    VuaToiGiftPicker:picker,
    crypto:webcrypto,
    addEventListener:(type, listener) => { if (type === 'message') messages.add(listener); },
    removeEventListener:(type, listener) => { if (type === 'message') messages.delete(listener); },
  };
  const document = {
    querySelectorAll:selector => selector === '.request-form' ? forms : selector.startsWith('.request-form input') ? forms.flatMap(form => [...Object.values(form.fields), form.submit]) : selector === '.form-submit' ? forms.map(form => form.submit) : [],
    createElement:tag => {
      assert.equal(tag, 'iframe');
      return new Element();
    },
    body:{append:frame => frames.push(frame)},
  };
  vm.runInNewContext(source, {
    window, document, URL, URLSearchParams, Uint8Array,
    location:pageLocation,
    setTimeout:(callback, delay) => {
      const id = nextTimer++;
      timers.set(id, {callback, delay});
      return id;
    },
    clearTimeout:id => timers.delete(id),
  }, {filename:'orders.js'});
  const emit = event => [...messages].forEach(listener => listener(event));
  const bridgeFor = frame => {
    const url = new URL(frame.src);
    const ids = {version:1, requestId:url.searchParams.get('requestId'), nonce:url.searchParams.get('nonce')};
    const sent = [];
    const bridge = {postMessage:(data, origin) => sent.push({data, origin})};
    return {
      ids, url, sent, bridge,
      ready:(overrides = {}) => emit({origin:googleOrigin, source:bridge, data:{...ids, type:'VUA_TOI_ORDER_READY'}, ...overrides}),
      result:(data = {}, overrides = {}) => emit({origin:googleOrigin, source:bridge, data:{...ids, type:'VUA_TOI_ORDER_RESULT', saved:true, orderId:'VT-' + ids.requestId, ...data}, ...overrides}),
    };
  };
  return {forms, frames, messages, timers, emit, bridgeFor, setItems:items => { selectedItems = items; }, get selectionLocked() { return selectionLocked; }, get selectionResets() { return selectionResets; }};
}

test('missing or invalid endpoint cannot claim success; form remains editable', async () => {
  for (const url of ['', 'https://attacker.example/macros/s/TEST/exec', 'https://script.google.com/macros/s/TEST/dev']) {
    const env = setup({googleScriptUrl:url});
    const form = env.forms[0];
    form.send();
    await tick();
    assert.equal(env.frames.length, 0);
    assert.equal(form.resetCount, undefined);
    assert.equal(form.fields.name.value, 'Nguyễn An');
    assert.equal(form.feedback.classes.has('error'), true);
    assert.match(form.feedback.textContent, /chưa thể gửi/);
    assert.equal(form.submit.disabled, false);
    assert.equal(form.label.textContent, 'ĐẶT HÀNG');
  }
});

test('file preview explains the HTTP requirement without sending or clearing contact details', async () => {
  for (const index of [0,2]) {
    const env=setup({googleScriptUrl:endpoint},{origin:'null',protocol:'file:'});
    const form=env.forms[index];
    form.send(); await tick();
    assert.equal(env.frames.length,0);
    assert.match(form.feedback.textContent,/http:\/\/127\.0\.0\.1:8765\//);
    assert.match(form.feedback.textContent,/chưa được gửi/);
    assert.equal(form.feedback.classes.has('error'),true);
    assert.equal(form.resetCount,undefined);
    assert.equal(form.fields.name.value,'Nguyễn An');
    assert.equal(form.submit.disabled,false);
  }
});

test('required fields and quantity are validated before transport', async () => {
  const invalidValues = [['name','A'], ['phone','abc'], ['email','khong-phai-email'], ['product',''], ['quantity',''], ['quantity','0'], ['quantity','1.5'], ['quantity','10001']];
  for (const [name, value] of invalidValues) {
    const env = setup();
    const form = env.forms[0];
    form.fields[name].value = value;
    form.send();
    await tick();
    assert.equal(env.frames.length, 0, name + ': ' + value);
    assert.equal(form.fields[name].attributes.get('aria-invalid'), 'true');
    assert.equal(form.fields[name].focused, true);
    assert.equal(form.feedback.classes.has('error'), true);
  }
});

test('pending request locks double submissions across both forms and sends no customer details in URL', async () => {
  const env = setup();
  const [first, second] = env.forms;
  first.fields.notes.disabled = true;
  first.send();
  first.send();
  second.send();
  assert.equal(env.frames.length, 1);
  assert.equal(first.submit.disabled, true);
  assert.equal(second.submit.disabled, true);
  assert.equal(first.fields.name.disabled, true);
  assert.equal(first.attributes.get('aria-busy'), 'true');
  const bridge = env.bridgeFor(env.frames[0]);
  assert.deepEqual([...bridge.url.searchParams.keys()].sort(), ['nonce','origin','requestId']);
  assert.equal(bridge.url.searchParams.get('origin'), 'http://127.0.0.1:8765');
  assert.match(bridge.ids.requestId, /^[a-f0-9]{32}$/);
  assert.match(bridge.ids.nonce, /^[a-f0-9]{32}$/);
  bridge.ready();
  assert.equal(bridge.sent.length, 1);
  assert.equal(bridge.sent[0].origin, googleOrigin);
  assert.equal(bridge.sent[0].data.payload.name, 'Nguyễn An');
  bridge.result({saved:false, error:{message:'Không lưu được đơn.'}});
  await tick();
  assert.equal(first.submit.disabled, false);
  assert.equal(second.submit.disabled, false);
  assert.equal(first.fields.notes.disabled, true);
  assert.equal(first.attributes.has('aria-busy'), false);
  assert.equal(first.fields.name.value, 'Nguyễn An');
  assert.equal(first.feedback.textContent, 'Không lưu được đơn.');
});

test('origin, nonce, source and order acknowledgment must match before success', async () => {
  const env = setup();
  const form = env.forms[0];
  form.send();
  const frame = env.frames[0];
  const bridge = env.bridgeFor(frame);
  bridge.result(); // No READY handshake yet.
  bridge.ready({origin:'https://attacker.example'});
  bridge.ready({origin:'https://script.google.com.attacker.example'});
  bridge.ready({data:{...bridge.ids, type:'VUA_TOI_ORDER_READY', nonce:'invalid'}});
  assert.equal(bridge.sent.length, 0);
  bridge.ready();
  bridge.ready(); // A duplicate READY does not submit twice.
  assert.equal(bridge.sent.length, 1);
  bridge.result({}, {source:{}});
  bridge.result({}, {origin:'https://script.google.com'}); // Different source origin after pin.
  bridge.result({nonce:'invalid'});
  bridge.result({requestId:'invalid'});
  await tick();
  assert.equal(form.resetCount, undefined);
  assert.equal(form.feedback.classes.has('success'), false);
  bridge.result();
  await tick();
  assert.equal(form.feedback.classes.has('success'), true);
  assert.equal(form.resetCount, 1);
  assert.equal(frame.removed, true);
  assert.equal(env.messages.size, 0);
  assert.equal(env.timers.size, 0);
});

test('saved flag without matching order ID cannot claim success', async () => {
  const env = setup();
  const form = env.forms[0];
  form.send();
  const bridge = env.bridgeFor(env.frames[0]);
  bridge.ready();
  bridge.result({orderId:'VT-wrong'});
  await tick();
  assert.equal(form.feedback.classes.has('error'), true);
  assert.equal(form.resetCount, undefined);
});

test('uncertain retries reuse requestId, rotate nonce, and ignore replayed previous acknowledgment', async () => {
  const env = setup({googleScriptUrl:endpoint, timeoutMs:1});
  const form = env.forms[0];
  form.send();
  const oldBridge = env.bridgeFor(env.frames[0]);
  oldBridge.ready();
  assert.equal([...env.timers.values()][0].delay, 10000);
  [...env.timers.values()][0].callback();
  await tick();
  assert.match(form.feedback.textContent, /Chưa nhận được xác nhận/);
  assert.equal(form.resetCount, undefined);
  form.send();
  const newBridge = env.bridgeFor(env.frames[1]);
  assert.equal(newBridge.ids.requestId, oldBridge.ids.requestId);
  assert.notEqual(newBridge.ids.nonce, oldBridge.ids.nonce);
  newBridge.ready();
  oldBridge.result();
  await tick();
  assert.equal(form.resetCount, undefined);
  newBridge.result();
  await tick();
  assert.equal(form.resetCount, 1);
  form.send();
  const following = env.bridgeFor(env.frames[2]);
  assert.notEqual(following.ids.requestId, newBridge.ids.requestId);
  following.ready();
  following.result();
  await tick();
});

test('changing order details after a failed attempt creates a different requestId', async () => {
  const env = setup();
  const form = env.forms[0];
  form.send();
  const first = env.bridgeFor(env.frames[0]);
  first.ready();
  first.result({saved:false});
  await tick();
  form.fields.quantity.value = '3';
  form.send();
  const second = env.bridgeFor(env.frames[1]);
  assert.notEqual(first.ids.requestId, second.ids.requestId);
  second.ready();
  second.result();
  await tick();
});


test('multiple gift lines retain separate quantities and change retry fingerprint', async () => {
  const env = setup();
  env.setItems([{product:'Hộp quà An Khang',quantity:2},{product:'Hộp quà Phúc An',quantity:3}]);
  env.forms[0].send();
  assert.equal(env.selectionLocked,true);
  const first = env.bridgeFor(env.frames[0]); first.ready();
  assert.deepEqual(JSON.parse(JSON.stringify(first.sent[0].data.payload.items)),[{product:'Hộp quà An Khang',quantity:2},{product:'Hộp quà Phúc An',quantity:3}]);
  assert.equal('product' in first.sent[0].data.payload,false);
  assert.equal('quantity' in first.sent[0].data.payload,false);
  first.result({saved:false}); await tick();
  assert.equal(env.selectionLocked,false); assert.equal(env.selectionResets,0);
  env.setItems([{product:'Hộp quà An Khang',quantity:2},{product:'Hộp quà Phúc An',quantity:4}]);
  env.forms[0].send();
  const second = env.bridgeFor(env.frames[1]); second.ready();
  assert.notEqual(first.ids.requestId,second.ids.requestId);
  second.result(); await tick(); assert.equal(env.selectionResets,1);
});

test('optional email is sent in the payload, stays out of the URL, and affects retry identity', async () => {
  const env = setup();
  const form = env.forms[1];
  form.fields.email.value = 'qa+vuatoi@example.invalid';
  form.send();
  const first = env.bridgeFor(env.frames[0]); first.ready();
  assert.equal(first.sent[0].data.payload.email, 'qa+vuatoi@example.invalid');
  assert.equal(first.url.href.includes('example.invalid'), false);
  first.result({saved:false}); await tick();
  assert.equal(form.fields.email.value, 'qa+vuatoi@example.invalid');
  form.fields.email.value = '';
  form.send();
  const second = env.bridgeFor(env.frames[1]); second.ready();
  assert.equal(second.sent[0].data.payload.email, '');
  assert.notEqual(first.ids.requestId,second.ids.requestId);
  second.result(); await tick();
  assert.equal(form.feedback.classes.has('success'),true);
});

test('consultation sends only contact details, preserves gift selection and waits for a verified ACK', async () => {
  const env=setup();
  const form=env.forms[2];
  env.setItems([{product:'',quantity:0}]); // A lead never requires selecting a gift.
  form.fields.email.value='qa-lead@example.invalid';
  form.send();
  assert.equal(env.frames.length,1);
  const bridge=env.bridgeFor(env.frames[0]); bridge.ready();
  const payload=bridge.sent[0].data.payload;
  assert.deepEqual(Object.keys(payload).sort(),['email','kind','name','phone','requestId','source']);
  assert.equal(payload.kind,'consultation');
  assert.equal(payload.source,'consultation-form');
  assert.equal(payload.email,'qa-lead@example.invalid');
  assert.equal(bridge.url.href.includes('example.invalid'),false);
  assert.equal(form.resetCount,undefined);
  bridge.result(); await tick();
  assert.match(form.feedback.textContent,/liên hệ để tư vấn/);
  assert.equal(form.resetCount,1);
  assert.equal(env.selectionResets,0);
  assert.equal(form.label.textContent,'TƯ VẤN');
  assert.equal(form.submit.disabled,false);
});

test('consultation validates contact fields and preserves them for an uncertain retry', async () => {
  const env=setup(); const form=env.forms[2];
  form.fields.phone.value='123';
  form.send(); await tick();
  assert.equal(env.frames.length,0);
  form.fields.phone.value='0000000000';
  form.send();
  const first=env.bridgeFor(env.frames[0]); first.ready();
  first.result({saved:false}); await tick();
  assert.equal(form.resetCount,undefined);
  assert.equal(form.fields.phone.value,'0000000000');
  form.send();
  const second=env.bridgeFor(env.frames[1]); second.ready();
  assert.equal(first.ids.requestId,second.ids.requestId);
  second.result(); await tick();
  assert.equal(env.selectionResets,0);
});
