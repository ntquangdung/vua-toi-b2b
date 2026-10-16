'use strict';

// Local contract checks with a small in-memory Apps Script adapter.
// This does not deploy, contact Google or validate actual iframe/browser access.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');
const origin = 'http://localhost:8765';
let passed = 0;

function fixture(options = {}) {
  const state = {
    rows: [], formulas: [], rawWrites: [], formats: [], exists: false, maxRows: 1000,
    moves: [], hiddenColumns: new Set(), busy: false, throwFlushOnce: false, corruptRead: false, flushes: 0, releases: 0,
    properties: { SPREADSHEET_ID: 'example_spreadsheet_identifier_12345678', SHEET_NAME: 'DonHang' },
    ...options
  };
  const sheet = {
    getName: () => 'DonHang',
    getLastRow: () => state.rows.length,
    getLastColumn: () => Math.max(0,...state.rows.map(row => row.reduce((last,value,index) => value === '' || value === undefined ? last : index+1,0))),
    getMaxRows: () => state.maxRows,
    insertRowsAfter: (_, count) => { state.maxRows += count; },
    setFrozenRows() {},
    setColumnWidth() {},
    autoResizeRows() {},
    hideColumns(col) { state.hiddenColumns.add(col); },
    moveColumns(range, destination) {
      const source = range.getColumn();
      assert.equal(range.getNumColumns(),1);
      assert.ok(source>destination);
      state.moves.push([source,destination]);
      for(const collection of [state.rows,state.formulas]) {
        collection.forEach(row => {
          while(row.length<16) row.push('');
          const [value]=row.splice(source-1,1);
          row.splice(destination-1,0,value);
        });
      }
    },
    getRange(row, col, rowCount = 1, colCount = 1) {
      return {
        getRow: () => row,
        getColumn: () => col,
        getNumColumns: () => colCount,
        setNumberFormat(format) {
          state.formats.push({ row, col, rowCount, colCount, format });
          return this;
        },
        setFontWeight() { return this; },
        setWrap() { return this; },
        setValues(values) {
          values.forEach((line, rowOffset) => {
            const targetRow = row + rowOffset - 1;
            state.rows[targetRow] ||= [];
            state.formulas[targetRow] ||= [];
            line.forEach((value, colOffset) => {
              const targetCol = col + colOffset - 1;
              if (row > 1) state.rawWrites.push({ row: targetRow, col: targetCol, value });
              const quoted = typeof value === 'string' && value.startsWith("'");
              state.rows[targetRow][targetCol] = quoted ? value.slice(1) : value;
              state.formulas[targetRow][targetCol] = !quoted && typeof value === 'string' && value.startsWith('=') ? value : '';
            });
          });
          return this;
        },
        getValues() {
          const values = Array.from({ length: rowCount }, (_, r) =>
            Array.from({ length: colCount }, (_, c) => state.rows[row + r - 1]?.[col + c - 1] ?? ''));
          if (state.corruptRead && row > 1 && colCount === 16) values[0][6] = 'Edited product';
          return values;
        },
        getFormulas() {
          return Array.from({ length: rowCount }, (_, r) =>
            Array.from({ length: colCount }, (_, c) => state.formulas[row + r - 1]?.[col + c - 1] || ''));
        },
        createTextFinder(value) {
          return {
            matchEntireCell() { return this; },
            matchCase() { return this; },
            useRegularExpression() { return this; },
            findAll() {
              const matches = [];
              for (let r = row; r < row + rowCount; r++) {
                if (String(state.rows[r - 1]?.[col - 1]) === value) matches.push({ getRow: () => r });
              }
              return matches;
            }
          };
        }
      };
    }
  };
  const context = vm.createContext({
    Date,
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => state.properties[key] || null }) },
    LockService: { getScriptLock: () => ({
      tryLock: () => !state.busy,
      releaseLock: () => { state.releases++; }
    }) },
    SpreadsheetApp: {
      openById: () => ({
        getSheetByName: () => state.exists ? sheet : null,
        insertSheet: () => { state.exists = true; return sheet; }
      }),
      flush() {
        state.flushes++;
        if (state.throwFlushOnce) {
          state.throwFlushOnce = false;
          throw new Error('Simulated lost acknowledgement after storage');
        }
      }
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (_, text) => [...crypto.createHash('sha256').update(text, 'utf8').digest()]
        .map(byte => byte > 127 ? byte - 256 : byte)
    },
    HtmlService: {
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
      createHtmlOutput: content => ({
        content,
        setTitle() { return this; },
        setXFrameOptionsMode(mode) { this.mode = mode; return this; }
      })
    }
  });
  vm.runInContext(code, context, { filename: 'Code.gs' });
  return { state, context };
}

function order(overrides = {}) {
  const {product='Hộp quà An Khang', quantity=2, ...rest} = overrides;
  return {
    requestId: 'request-000000000001', name: 'Nguyễn Văn A', phone: '0935123456',
    items:[{product,quantity}], occasion: 'Biếu người thân', notes: '',
    source: 'contact-form', ...rest
  };
}

function legacyRow(row,length=15) {
  return [row[0],row[1],row[2],row[3],row[4],row[6],row[7],row[8],row[9],row[10],row[11],row[5],row[12],row[13],row[14]].slice(0,length);
}
function useLegacySchema(state,length=15) {
  state.rows=state.rows.map(row=>legacyRow(row,length));
  state.formulas=state.formulas.map(row=>legacyRow(row,length));
  state.hiddenColumns.clear();
}
function lead(overrides={}) {
  return {kind:'consultation',requestId:'request-lead-0000001',name:'Khách tư vấn',phone:'0000000000',email:'qa-lead@example.invalid',source:'consultation-form',...overrides};
}

function check(name, run) {
  run();
  passed++;
  console.log('PASS ' + name);
}

check('valid order is flushed and read back before ACK', () => {
  const { state, context } = fixture();
  const result = context.saveOrder(order(), origin);
  assert.equal(result.saved, true);
  assert.equal(result.orderId, 'VT-request-000000000001');
  assert.equal(state.rows.length, 2);
  assert.equal(state.rows[1][4], '0935123456');
  assert.equal(state.rows[1][7], 2);
  assert.ok(state.rows[1][2] instanceof Date);
  assert.ok(state.formats.some(item => item.row === 2 && item.col === 1 && item.colCount === 16 && item.format === '@'));
  assert.ok(state.formats.some(item => item.row === 2 && item.col === 3 && item.format === 'dd/MM/yyyy HH:mm:ss'));
  assert.ok(state.formats.some(item => item.row === 2 && item.col === 8 && item.format === '0'));
  assert.equal(state.flushes, 1);
  assert.equal(state.releases, 1);
  assert.deepEqual(Object.keys(result).sort(), ['orderId', 'saved']);
});

check('same requestId and payload return the same order without a second row', () => {
  const { state, context } = fixture();
  const first = context.saveOrder(order(), origin);
  const timestamp = state.rows[1][2];
  const second = context.saveOrder(order(), origin);
  assert.equal(first.orderId, second.orderId);
  assert.equal(second.saved, true);
  assert.equal(state.rows.length, 2);
  assert.equal(state.rows[1][2], timestamp);
});

check('same requestId with changed content is rejected', () => {
  const { state, context } = fixture();
  context.saveOrder(order(), origin);
  const result = context.saveOrder(order({ quantity: 3 }), origin);
  assert.equal(result.saved, false);
  assert.equal(result.error.code, 'REQUEST_ID_CONFLICT');
  assert.equal(result.error.retryable, false);
  assert.equal(state.rows.length, 2);
});

check('validation rejects invalid fields without creating an order row', () => {
  const invalid = [
    { name: 'A' }, { name: 'Tên\nkhông hợp lệ' }, { phone: '0123' },
    { product: 'Hộp quà Phúc Lành' }, { quantity: 0 }, { quantity: -1 },
    { quantity: 1.5 }, { quantity: '2' }, { quantity: 10001 },
    { occasion: 'Không có trong danh sách' }, { notes: 'x'.repeat(601) },
    { notes: 'x\u0000y' }, { source: 'other-form' }, { requestId: 'short' }, { price: 1 }
  ];
  for (const patch of invalid) {
    const { state, context } = fixture();
    const result = context.saveOrder(order(patch), origin);
    assert.equal(result.saved, false, JSON.stringify(patch));
    assert.equal(state.rows.length, 0);
    assert.equal(result.error.retryable, false);
  }
});

check('all six products and quantity boundaries are accepted', () => {
  const products = ['An Khang', 'Phúc Thọ', 'Thịnh Vượng', 'Phúc An', 'Trường Thọ', 'Phúc Lộc'];
  products.forEach((product, index) => {
    const { context } = fixture();
    const result = context.saveOrder(order({ product: 'Hộp quà ' + product, quantity: index % 2 ? 10000 : 1 }), origin);
    assert.equal(result.saved, true, product);
  });
});

check('quick form defaults optional fields and keeps its source', () => {
  const { state, context } = fixture();
  const payload = order({ source: 'quick-form' });
  delete payload.occasion;
  delete payload.notes;
  assert.equal(context.saveOrder(payload, origin).saved, true);
  assert.equal(state.rows[1][8], 'Cần tư vấn');
  assert.equal(state.rows[1][9], '');
  assert.equal(state.rows[1][10], 'quick-form');
});

check('formula-looking strings and plus-prefixed telephone stay text', () => {
  const { state, context } = fixture();
  const payload = order({ name: '=IMPORTXML("https://example.invalid")', phone: '+84935123456', notes: "=1+2\n@SUM(1,2)\n'quoted" });
  assert.equal(context.saveOrder(payload, origin).saved, true);
  assert.equal(state.rows[1][3], payload.name);
  assert.equal(state.rows[1][4], payload.phone);
  assert.equal(state.rows[1][9], payload.notes);
  assert.ok(state.formulas[1].every(value => value === ''));
  assert.ok(state.rawWrites.filter(write => [3, 4, 5, 6, 8, 9, 10].includes(write.col))
    .every(write => write.value.startsWith("'")));
});

check('unapproved origin and missing configuration never ACK success', () => {
  const a = fixture();
  assert.equal(a.context.saveOrder(order(), 'https://unapproved.example').error.code, 'ORIGIN_NOT_ALLOWED');
  assert.equal(a.state.rows.length, 0);
  const b = fixture();
  delete b.state.properties.SPREADSHEET_ID;
  assert.equal(b.context.saveOrder(order(), origin).error.code, 'NOT_CONFIGURED');
  assert.equal(b.state.rows.length, 0);
});

check('busy script lock does not write', () => {
  const { state, context } = fixture({ busy: true });
  const result = context.saveOrder(order(), origin);
  assert.equal(result.error.code, 'BUSY');
  assert.equal(result.error.retryable, true);
  assert.equal(state.rows.length, 0);
  assert.equal(state.releases, 0);
});

check('existing foreign headers are not overwritten', () => {
  const { state, context } = fixture({ exists: true, rows: [['Foreign table']] });
  assert.equal(context.saveOrder(order(), origin).error.code, 'SHEET_HEADERS_MISMATCH');
  assert.equal(state.rows[0][0], 'Foreign table');
  assert.equal(state.rows.length, 1);
});

check('lost ACK after a stored row can be retried idempotently', () => {
  const { state, context } = fixture({ throwFlushOnce: true });
  const first = context.saveOrder(order(), origin);
  assert.equal(first.saved, false);
  assert.equal(first.error.retryable, true);
  assert.equal(state.rows.length, 2);
  const retry = context.saveOrder(order(), origin);
  assert.equal(retry.saved, true);
  assert.equal(retry.orderId, 'VT-request-000000000001');
  assert.equal(state.rows.length, 2);
});

check('readback mismatch never becomes a successful ACK', () => {
  const { state, context } = fixture({ corruptRead: true });
  assert.equal(context.saveOrder(order(), origin).error.code, 'VERIFY_FAILED');
  state.corruptRead = false;
  assert.equal(context.saveOrder(order(), origin).saved, true);
  assert.equal(state.rows.length, 2);
  state.rows[1][6] = 'Edited product';
  assert.equal(context.saveOrder(order(), origin).error.code, 'VERIFY_FAILED');
});

check('a manually duplicated requestId is reported as an integrity error', () => {
  const { state, context } = fixture();
  context.saveOrder(order(), origin);
  state.rows.push([...state.rows[1]]);
  state.formulas.push([...state.formulas[1]]);
  assert.equal(context.saveOrder(order(), origin).error.code, 'DATA_INTEGRITY');
});

check('readback requires a Date timestamp and a numeric quantity', () => {
  const { state, context } = fixture();
  context.saveOrder(order(), origin);
  const timestamp = state.rows[1][2];
  state.rows[1][2] = timestamp.toISOString();
  assert.equal(context.saveOrder(order(), origin).error.code, 'VERIFY_FAILED');
  state.rows[1][2] = timestamp;
  state.rows[1][7] = '2';
  assert.equal(context.saveOrder(order(), origin).error.code, 'VERIFY_FAILED');
  state.rows[1][7] = 2;
  assert.equal(context.saveOrder(order(), origin).saved, true);
});

check('doGet permits only allowlisted origins and a valid envelope', () => {
  const { context } = fixture();
  const params = { origin, requestId: 'request-000000000001', nonce: 'nonce-00000000000000001' };
  const valid = context.doGet({ parameter: params });
  assert.equal(valid.mode, 'ALLOWALL');
  assert.ok(valid.content.includes('VUA_TOI_ORDER_READY'));
  assert.ok(!valid.content.includes('SPREADSHEET_ID'));
  const invalid = context.doGet({ parameter: { ...params, origin: 'https://unapproved.example' } });
  assert.notEqual(invalid.mode, 'ALLOWALL');
  assert.ok(!invalid.content.includes('unapproved.example'));
});

check('generated bridge matches the frontend protocol and checks source/origin/nonce', () => {
  const { context } = fixture();
  const boot = { origin, requestId: 'request-000000000001', nonce: 'nonce-00000000000000001' };
  const body = context.bridgeHtml_(boot).match(/<script>([\s\S]*?)<\/script>/)[1];
  const handlers = {};
  const sent = [];
  let calls = 0;
  let response = { saved: true, orderId: 'VT-' + boot.requestId };
  let onSuccess;
  const top = { postMessage: (data, target) => sent.push({ data, target }) };
  const runner = {
    withSuccessHandler(fn) { onSuccess = fn; return this; },
    withFailureHandler() { return this; },
    saveOrder(payload, callerOrigin) {
      calls++;
      assert.equal(callerOrigin, origin);
      assert.equal(payload.requestId, boot.requestId);
      onSuccess(response);
    }
  };
  vm.runInNewContext(body, {
    window: { top, addEventListener: (type, listener) => { handlers[type] = listener; } },
    google: { script: { run: runner } }
  });
  handlers.load();
  assert.equal(sent[0].data.type, 'VUA_TOI_ORDER_READY');
  assert.equal(sent[0].target, origin);
  const data = { type: 'VUA_TOI_ORDER_SUBMIT', version: 1, requestId: boot.requestId, nonce: boot.nonce, payload: order() };
  handlers.message({ source: {}, origin, data });
  handlers.message({ source: top, origin: 'https://unapproved.example', data });
  handlers.message({ source: top, origin, data: { ...data, nonce: 'wrong' } });
  assert.equal(calls, 0);
  handlers.message({ source: top, origin, data });
  assert.equal(calls, 1);
  const result = sent.at(-1).data;
  assert.equal(result.type, 'VUA_TOI_ORDER_RESULT');
  assert.equal(result.version, 1);
  assert.equal(result.requestId, boot.requestId);
  assert.equal(result.nonce, boot.nonce);
  assert.equal(result.saved, true);
  assert.equal(result.orderId, 'VT-' + boot.requestId);
  assert.ok(!('name' in result) && !('phone' in result));
  response = { saved: true, orderId: 'wrong-order' };
  handlers.message({ source: top, origin, data });
  assert.equal(sent.at(-1).data.saved, false);
});

check('duplicate SUBMIT while RPC is pending produces one call and one ACK', () => {
  const { context } = fixture();
  const boot = { origin, requestId: 'request-000000000001', nonce: 'nonce-00000000000000001' };
  const body = context.bridgeHtml_(boot).match(/<script>([\s\S]*?)<\/script>/)[1];
  const handlers = {};
  const sent = [];
  const top = { postMessage: data => sent.push(data) };
  let calls = 0;
  let onSuccess;
  const runner = {
    withSuccessHandler(fn) { onSuccess = fn; return this; },
    withFailureHandler() { return this; },
    saveOrder() { calls++; }
  };
  vm.runInNewContext(body, {
    window: { top, addEventListener: (type, listener) => { handlers[type] = listener; } },
    google: { script: { run: runner } }
  });
  const data = { type: 'VUA_TOI_ORDER_SUBMIT', version: 1, requestId: boot.requestId, nonce: boot.nonce, payload: order() };
  handlers.message({ source: top, origin, data });
  handlers.message({ source: top, origin, data });
  assert.equal(calls, 1);
  assert.equal(sent.length, 0);
  onSuccess({ saved: true, orderId: 'VT-' + boot.requestId });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].type, 'VUA_TOI_ORDER_RESULT');
  assert.equal(sent[0].saved, true);
});



check('multiple sets are stored together with each quantity and a total', () => {
  const {state,context}=fixture();
  const items=[{product:'Hộp quà Phúc An',quantity:3},{product:'Hộp quà An Khang',quantity:2}];
  const payload=order({items});
  assert.equal(context.saveOrder(payload,origin).saved,true);
  assert.equal(state.rows[1][6],'Hộp quà An Khang × 2\nHộp quà Phúc An × 3');
  assert.equal(state.rows[1][7],5);
  assert.equal(context.saveOrder(order({items:[...items].reverse()}),origin).saved,true);
  assert.equal(state.rows.length,2);
  assert.equal(context.saveOrder(order({items:[{product:'Hộp quà Phúc An',quantity:4},{product:'Hộp quà An Khang',quantity:2}]}),origin).error.code,'REQUEST_ID_CONFLICT');
});
check('empty, duplicate, malformed or oversized item lists never create orders', () => {
  const invalid=[[],null,'An Khang',[null],[{product:'Hộp quà An Khang',quantity:1,price:1}],
    [{product:'Hộp quà An Khang',quantity:1},{product:'Hộp quà An Khang',quantity:2}],
    Array.from({length:7},()=>({product:'Hộp quà An Khang',quantity:1}))];
  for(const items of invalid){ const {state,context}=fixture(); assert.equal(context.saveOrder(order({items}),origin).saved,false); assert.equal(state.rows.length,0); }
});

check('optional email is validated, stored as text, and never returned in the ACK', () => {
  const {state,context}=fixture();
  const payload=order({email:'+qa@example.invalid'});
  const result=context.saveOrder(payload,origin);
  assert.equal(result.saved,true);
  assert.equal(state.rows[0][5],'Email');
  assert.equal(state.rows[1][5],payload.email);
  assert.equal(state.formulas[1][5],'');
  assert.equal(result.email,undefined);
  assert.equal(context.saveOrder(order({email:'changed@example.invalid'}),origin).error.code,'REQUEST_ID_CONFLICT');
  for(const email of ['not-email','a@b','a\nb@example.invalid','x'.repeat(255),null]){
    const env=fixture();
    assert.equal(env.context.saveOrder(order({email}),origin).error.code,'INVALID_EMAIL');
    assert.equal(env.state.rows.length,0);
  }
});

check('existing 11-column orders gain an Email header without changing old rows or retry IDs', () => {
  const {state,context}=fixture();
  const payload=order();
  assert.equal(context.saveOrder(payload,origin).saved,true);
  const oldFingerprint=crypto.createHash('sha256').update(JSON.stringify([
    payload.name,payload.phone,payload.items,payload.occasion,payload.notes,payload.source
  ])).digest('hex');
  assert.equal(state.rows[1][11],oldFingerprint);
  useLegacySchema(state,11);
  const previousRow=[...state.rows[1]];
  assert.equal(context.saveOrder(payload,origin).saved,true);
  assert.equal(state.rows.length,2);
  assert.equal(state.rows[0][5],'Email');
  assert.deepEqual(legacyRow(state.rows[1],11),previousRow);
  assert.equal(context.saveOrder(order({requestId:'request-email-000002',email:'qa@example.invalid'}),origin).saved,true);
  assert.equal(state.rows[2][5],'qa@example.invalid');
  assert.deepEqual(legacyRow(state.rows[1],11),previousRow);
});

check('migration never replaces an occupied extra column', () => {
  const {state,context}=fixture();
  assert.equal(context.saveOrder(order(),origin).saved,true);
  useLegacySchema(state,12);
  state.rows[1][12]='Manual data';
  assert.equal(context.saveOrder(order({requestId:'request-email-000003'}),origin).error.code,'SHEET_HEADERS_MISMATCH');
  assert.equal(state.rows[1][12],'Manual data');
  assert.equal(state.rows.length,2);
});

check('unit prices and order totals come from the server catalogue for every set', () => {
  const sellingPrices=[659000,639000,399000,655000,399000,389000];
  ['An Khang','Phúc Thọ','Thịnh Vượng','Phúc An','Trường Thọ','Phúc Lộc'].forEach((name,index)=>{
    const {state,context}=fixture();
    const product='Hộp quà '+name;
    assert.equal(context.saveOrder(order({product,quantity:2}),origin).saved,true);
    assert.equal(state.rows[1][12],product+': '+context.money_(sellingPrices[index]));
    assert.equal(state.rows[1][14],sellingPrices[index]*2);
    assert.equal(typeof state.rows[1][14],'number');
    assert.ok(state.formats.some(item=>item.col===15&&item.format.includes('₫')));
  });
  const {state,context}=fixture();
  const items=[{product:'Hộp quà An Khang',quantity:2},{product:'Hộp quà Phúc An',quantity:3}];
  assert.equal(context.saveOrder(order({items}),origin).saved,true);
  assert.equal(state.rows[1][13],'Hộp quà An Khang × 2: 1.318.000 ₫\nHộp quà Phúc An × 3: 1.965.000 ₫');
  assert.equal(state.rows[1][14],3283000);
  assert.equal(context.saveOrder(order({requestId:'request-price-forged',price:1}),origin).error.code,'INVALID_REQUEST');
});

check('12-column orders are backfilled once without changing customer details or saved prices', () => {
  const {state,context}=fixture();
  assert.equal(context.saveOrder(order({email:'qa@example.invalid'}),origin).saved,true);
  useLegacySchema(state,12);
  const previousRow=[...state.rows[1]];
  assert.equal(context.saveOrder(order({requestId:'request-priced-00002'}),origin).saved,true);
  assert.equal(state.rows[0][12],'Đơn giá từng bộ (VNĐ)');
  assert.equal(state.rows[0][14],'Tổng tiền hàng (VNĐ)');
  assert.deepEqual(legacyRow(state.rows[1],12),previousRow);
  assert.equal(state.rows[1][14],1318000);
  // A historical price remains valid when the current catalogue differs.
  state.rows[1][12]='Hộp quà An Khang: 650.000 ₫';
  state.rows[1][13]='Hộp quà An Khang × 2: 1.300.000 ₫';
  state.rows[1][14]=1300000;
  assert.equal(context.saveOrder(order({email:'qa@example.invalid'}),origin).saved,true);
  assert.equal(state.rows[1][14],1300000);
  assert.equal(state.rows.length,3);
});

check('price readback rejects an incorrect subtotal, text total, or inconsistent snapshot', () => {
  for(const [column,value] of [[13,'Wrong subtotal'],[14,'1318000'],[14,1],[12,'Hộp quà An Khang: 1 ₫']]){
    const {state,context}=fixture();
    assert.equal(context.saveOrder(order(),origin).saved,true);
    state.rows[1][column]=value;
    assert.equal(context.saveOrder(order(),origin).error.code,'VERIFY_FAILED');
    assert.equal(state.rows.length,2);
  }
});

check('backfill skips unknown item rows, partial prices, and empty-looking formulas', () => {
  const {state,context}=fixture();
  assert.equal(context.saveOrder(order(),origin).saved,true);
  const first=state.rows[1];
  const formulaRow=[...first]; formulaRow[1]='request-formula-00001'; formulaRow[12]='';formulaRow[13]='';formulaRow[14]='';
  const partialRow=[...formulaRow];partialRow[1]='request-partial-00001';partialRow[12]='Manual price';
  const unknownRow=[...formulaRow];unknownRow[1]='request-unknown-00001';unknownRow[6]='Unknown product × 1';
  state.rows.push(formulaRow,partialRow,unknownRow);
  state.formulas.push(Array(16).fill(''),Array(16).fill(''),Array(16).fill(''));
  state.formulas[2][14]='=""';
  assert.equal(context.saveOrder(order({requestId:'request-after-000001'}),origin).saved,true);
  assert.equal(state.formulas[2][14],'=""');
  assert.equal(state.rows[2][14],'');
  assert.equal(state.rows[3][12],'Manual price');
  assert.equal(state.rows[4][14],'');
});

check('V3 migration moves Email to F, preserves every order field, and hides technical columns', () => {
  const {state,context}=fixture();
  const payload=order({email:'qa-migration@example.invalid'});
  assert.equal(context.saveOrder(payload,origin).saved,true);
  const expected=[...state.rows[1]];
  useLegacySchema(state);
  assert.equal(state.rows[0][11],'Email');
  assert.equal(context.saveOrder(payload,origin).saved,true);
  assert.deepEqual(state.rows[1],expected);
  assert.equal(state.rows[0][5],'Email');
  assert.equal(state.rows[0][15],'Loại yêu cầu');
  assert.deepEqual(state.moves,[[12,6]]);
  assert.deepEqual([...state.hiddenColumns].sort((a,b)=>a-b),[2,12]);
  assert.equal(state.rows.length,2);
});

check('an interrupted migration resumes without moving Email twice or touching saved values', () => {
  const {state,context}=fixture();
  const payload=order({email:'qa-resume@example.invalid'});
  assert.equal(context.saveOrder(payload,origin).saved,true);
  const expected=[...state.rows[1]];
  state.rows.forEach(row=>row.splice(15));
  state.formulas.forEach(row=>row.splice(15));
  assert.equal(context.saveOrder(payload,origin).saved,true);
  assert.deepEqual(state.rows[1],expected);
  assert.equal(state.moves.length,0);
});

check('consultation stores contact details and type with blank gifts and prices', () => {
  const {state,context}=fixture();
  const payload=lead();
  const result=context.saveOrder(payload,origin);
  assert.equal(result.saved,true);
  assert.deepEqual(Object.keys(result).sort(),['orderId','saved']);
  assert.equal(state.rows[1][3],payload.name);
  assert.equal(state.rows[1][4],'0000000000');
  assert.equal(state.rows[1][5],payload.email);
  assert.deepEqual(state.rows[1].slice(6,10),['','','','']);
  assert.deepEqual(state.rows[1].slice(12,15),['','','']);
  assert.equal(state.rows[1][15],'Tư vấn');
  assert.equal(context.saveOrder(payload,origin).saved,true);
  assert.equal(state.rows.length,2);
  assert.equal(context.saveOrder(lead({email:'changed@example.invalid'}),origin).error.code,'REQUEST_ID_CONFLICT');
  state.rows[1][14]=0;
  assert.equal(context.saveOrder(payload,origin).error.code,'VERIFY_FAILED');
});

check('consultation accepts optional Email and rejects gifts, forged amounts or invalid contacts', () => {
  const valid=fixture();
  const payload=lead(); delete payload.email;
  assert.equal(valid.context.saveOrder(payload,origin).saved,true);
  assert.equal(valid.state.rows[1][5],'');
  for(const patch of [{items:[]},{price:1},{total:0},{occasion:''},{source:'quick-form'},{name:'A'},{phone:'123'},{email:'invalid'},{kind:'unknown'}]) {
    const {state,context}=fixture();
    assert.equal(context.saveOrder(lead(patch),origin).saved,false,JSON.stringify(patch));
    assert.equal(state.rows.length,0);
  }
});

console.log('\n' + passed + ' local Apps Script contract checks passed. This command uses mocks; live verification is recorded separately in README.md.');
