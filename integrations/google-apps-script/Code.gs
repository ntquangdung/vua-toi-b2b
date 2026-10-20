/**
 * Vua Toi order receiver, protocol v1.
 * Configure SPREADSHEET_ID, SHEET_NAME and ALLOWED_ORIGINS in Script Properties.
 * Prices are calculated on the server and stored as an order-time snapshot.
 */
const VUA_TOI_HEADERS_ = Object.freeze([
  'Mã đơn', 'Request ID', 'Thời gian nhận', 'Họ và tên', 'Số điện thoại',
  'Email', 'Các bộ quà', 'Tổng số bộ', 'Ghi chú', 'Nguồn form', 'Payload SHA-256',
  'Đơn giá từng bộ (VNĐ)', 'Thành tiền từng bộ (VNĐ)', 'Tổng tiền hàng (VNĐ)', 'Loại yêu cầu'
]);
const VUA_TOI_LEGACY_HEADERS_ = Object.freeze([
  'Mã đơn', 'Request ID', 'Thời gian nhận', 'Họ và tên', 'Số điện thoại',
  'Các bộ quà', 'Tổng số bộ', 'Dịp tặng', 'Ghi chú', 'Nguồn form', 'Payload SHA-256', 'Email',
  'Đơn giá từng bộ (VNĐ)', 'Thành tiền từng bộ (VNĐ)', 'Tổng tiền hàng (VNĐ)'
]);
const VUA_TOI_PRODUCTS_ = Object.freeze([
  'Hộp quà An Khang', 'Hộp quà Phúc Thọ', 'Hộp quà Thịnh Vượng',
  'Hộp quà Phúc An', 'Hộp quà Trường Thọ', 'Hộp quà Phúc Lộc'
]);
const VUA_TOI_OCCASIONS_ = Object.freeze([
  'Biếu người thân', 'Tặng khách hàng', 'Tặng đối tác', 'Khác', 'Cần tư vấn'
]);
// Single displayed prices from the owner-supplied 18/10 price sheet, updated 20/10/2026.
const VUA_TOI_UNIT_PRICES_ = Object.freeze({
  'Hộp quà An Khang':936000, 'Hộp quà Phúc Thọ':720000,
  'Hộp quà Thịnh Vượng':399000, 'Hộp quà Phúc An':828000,
  'Hộp quà Trường Thọ':554000, 'Hộp quà Phúc Lộc':446000
});

/** Serve only a bridge. Customer data is never accepted through the URL. */
function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const origin = String(params.origin || '');
    const requestId = String(params.requestId || '');
    const nonce = String(params.nonce || '');
    if (!allowedOrigins_().includes(origin) || !validRequestId_(requestId) ||
        !/^[A-Za-z0-9_-]{16,160}$/.test(nonce)) {
      throw orderError_('INVALID_BRIDGE');
    }
    return HtmlService.createHtmlOutput(bridgeHtml_({ origin, requestId, nonce }))
      .setTitle('Vua Tỏi · Order bridge')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (_) {
    // Do not echo URL parameters, configuration details or exception messages.
    return HtmlService.createHtmlOutput(
      '<!doctype html><html lang="vi"><meta charset="utf-8"><body>' +
      'Không mở được kết nối đặt hàng. Kiểm tra cấu hình và địa chỉ trang.' +
      '</body></html>'
    ).setTitle('Vua Tỏi · Kết nối chưa sẵn sàng');
  }
}

/**
 * Called by google.script.run inside the HtmlService bridge.
 * saved:true means the row was read back successfully, never merely queued.
 * The caller origin restricts the intended browser flow; it is not authentication.
 */
function saveOrder(payload, clientOrigin) {
  let lock = null;
  let acquired = false;
  try {
    if (!allowedOrigins_().includes(clientOrigin)) throw orderError_('ORIGIN_NOT_ALLOWED');
    const order = validateOrder_(payload);
    const config = storageConfig_();
    const fingerprint = fingerprint_(order);
    lock = LockService.getScriptLock();
    acquired = lock.tryLock(8000);
    if (!acquired) throw orderError_('BUSY');

    const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet = ordersSheet_(spreadsheet, config.sheetName);
    const layout = sheetLayout_(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const matches = sheet.getRange(2, layout.columns['Request ID'] + 1, lastRow - 1, 1)
        .createTextFinder(order.requestId)
        .matchEntireCell(true).matchCase(true).useRegularExpression(false).findAll();
      if (matches.length > 1) throw orderError_('DATA_INTEGRITY');
      if (matches.length === 1) {
        const range = sheet.getRange(matches[0].getRow(), 1, 1, layout.width);
        const stored = canonicalRow_(range.getValues()[0], layout);
        if (String(stored[10]) !== fingerprint) throw orderError_('REQUEST_ID_CONFLICT');
        SpreadsheetApp.flush();
        assertStored_(range, layout, order, fingerprint, null);
        return { saved: true, orderId: 'VT-' + order.requestId };
      }
    }

    const rowNumber = lastRow + 1;
    if (rowNumber > sheet.getMaxRows()) {
      sheet.insertRowsAfter(sheet.getMaxRows(), Math.max(100, rowNumber - sheet.getMaxRows()));
    }
    const receivedAt = new Date();
    const consultation = order.kind === 'consultation';
    const pricing = consultation ? {unitPrices:'',lineTotals:'',total:''} : pricingFor_(order.items);
    const range = sheet.getRange(rowNumber, 1, 1, layout.width);
    // Text formatting preserves a leading zero in telephone numbers.
    range.setNumberFormat('@');
    sheet.getRange(rowNumber, layout.columns['Thời gian nhận']+1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    sheet.getRange(rowNumber, layout.columns['Tổng số bộ']+1).setNumberFormat('0');
    sheet.getRange(rowNumber, layout.columns['Tổng tiền hàng (VNĐ)']+1).setNumberFormat('#,##0" ₫"');
    const values = [
      'VT-' + order.requestId, order.requestId, receivedAt,
      sheetText_(order.name), sheetText_(order.phone), sheetText_(order.email),
      sheetText_(formatItems_(order.items)), consultation ? '' : totalQuantity_(order.items),
      sheetText_(order.notes), sheetText_(order.source), fingerprint,
      sheetText_(pricing.unitPrices), sheetText_(pricing.lineTotals), pricing.total,
      sheetText_(consultation ? 'Tư vấn' : 'Đặt hàng')
    ];
    const physical = Array(layout.width).fill('');
    VUA_TOI_HEADERS_.forEach((header,index) => { physical[layout.columns[header]] = values[index]; });
    range.setValues([physical]);
    ['Đơn giá từng bộ (VNĐ)','Thành tiền từng bộ (VNĐ)'].forEach(header =>
      sheet.getRange(rowNumber,layout.columns[header]+1).setWrap(true));
    sheet.autoResizeRows(rowNumber,1);
    SpreadsheetApp.flush();
    assertStored_(range, layout, order, fingerprint, receivedAt, pricing);
    return { saved: true, orderId: 'VT-' + order.requestId };
  } catch (error) {
    return failure_(error && error.orderCode ? error.orderCode : 'STORAGE_ERROR');
  } finally {
    if (lock && acquired) lock.releaseLock();
  }
}

/** Run this private function once from the editor to authorize and prepare headers. */
function setupOrdersSheet_() {
  const config = storageConfig_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) throw orderError_('BUSY');
  try {
    const sheet = ordersSheet_(SpreadsheetApp.openById(config.spreadsheetId), config.sheetName);
    SpreadsheetApp.flush();
    return { ready: true, sheetName: sheet.getName() };
  } finally {
    lock.releaseLock();
  }
}

function allowedOrigins_() {
  const raw = PropertiesService.getScriptProperties().getProperty('ALLOWED_ORIGINS');
  let origins;
  try {
    origins = raw ? JSON.parse(raw) : ['http://localhost:8765', 'http://127.0.0.1:8765'];
  } catch (_) {
    throw orderError_('CONFIG_ERROR');
  }
  const originPattern = /^(?:https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::[0-9]{1,5})?|http:\/\/(?:localhost|127\.0\.0\.1)(?::[0-9]{1,5})?)$/i;
  if (!Array.isArray(origins) || !origins.length || origins.length > 20 ||
      origins.some(origin => typeof origin !== 'string' || origin.length > 200 || !originPattern.test(origin))) {
    throw orderError_('CONFIG_ERROR');
  }
  return origins;
}

function storageConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = String(properties.getProperty('SPREADSHEET_ID') || '').trim();
  const sheetName = String(properties.getProperty('SHEET_NAME') || 'DonHang').trim();
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(spreadsheetId)) throw orderError_('NOT_CONFIGURED');
  if (!sheetName || sheetName.length > 100 || /[\[\]*\/\\?:\u0000-\u001f]/.test(sheetName)) {
    throw orderError_('CONFIG_ERROR');
  }
  return { spreadsheetId, sheetName };
}

function ordersSheet_(spreadsheet, name) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  let prepared = false;
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, VUA_TOI_HEADERS_.length).setValues([VUA_TOI_HEADERS_.slice()])
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
    prepared = true;
  } else {
    const actual = readHeaders_(sheet);
    const optional = ['Email','Đơn giá từng bộ (VNĐ)','Thành tiền từng bộ (VNĐ)','Tổng tiền hàng (VNĐ)','Loại yêu cầu'];
    // Validate all core names before making any change. Staff may reorder columns
    // or add named staff columns; blank, duplicate or missing core names are unsafe.
    if (VUA_TOI_HEADERS_.filter(header => !optional.includes(header)).some(header => !actual.includes(header))) {
      throw orderError_('SHEET_HEADERS_MISMATCH');
    }
    const missing = optional.filter(header => !actual.includes(header));
    if (missing.length) {
      // Only recognized old schemas may gain missing system columns automatically.
      const legacy = [11,12,15].some(length => actual.length === length &&
        JSON.stringify(actual) === JSON.stringify(VUA_TOI_LEGACY_HEADERS_.slice(0,length)));
      const v4WithoutType = actual.length === 15 && actual.includes('Dịp tặng') &&
        missing.length === 1 && missing[0] === 'Loại yêu cầu';
      const withoutType = actual.length === 14 &&
        JSON.stringify(actual) === JSON.stringify(VUA_TOI_HEADERS_.slice(0,14));
      if (!legacy && !v4WithoutType && !withoutType) throw orderError_('SHEET_HEADERS_MISMATCH');
      sheet.getRange(1,actual.length+1,1,missing.length).setValues([missing]).setFontWeight('bold');
      prepared = true;
    }
    let headers = readHeaders_(sheet);
    // The occasion field was removed at the owner's request. Native deletion
    // preserves every other column's values, formulas, formatting and order.
    if (headers.includes('Dịp tặng')) {
      sheet.deleteColumn(headers.indexOf('Dịp tặng')+1);
      prepared = true;
      headers = readHeaders_(sheet);
    }
    if (headers.indexOf('Email') !== 5) {
      sheet.moveColumns(sheet.getRange(1,headers.indexOf('Email')+1,sheet.getMaxRows(),1),6);
      prepared = true;
    }
  }
  const layout = sheetLayout_(sheet);
  if (prepared) {
    preparePriceColumns_(sheet,layout);
    sheet.setColumnWidth(layout.columns.Email+1,230);
    sheet.setColumnWidth(layout.columns['Loại yêu cầu']+1,140);
  }
  // Keep integrity fields available to the receiver, out of the staff's normal view.
  sheet.hideColumns(layout.columns['Request ID']+1);
  sheet.hideColumns(layout.columns['Payload SHA-256']+1);
  backfillPricing_(sheet,layout);
  backfillRequestTypes_(sheet,layout);
  return sheet;
}

function readHeaders_(sheet) {
  const width = sheet.getLastColumn();
  if (!width || width > 100) throw orderError_('SHEET_HEADERS_MISMATCH');
  const range = sheet.getRange(1,1,1,width);
  const headers = range.getValues()[0];
  if (headers.some(value => typeof value !== 'string' || !value.trim()) ||
      new Set(headers).size !== headers.length || range.getFormulas()[0].some(Boolean)) {
    throw orderError_('SHEET_HEADERS_MISMATCH');
  }
  return headers;
}
function sheetLayout_(sheet) {
  const headers = readHeaders_(sheet);
  const columns = {};
  headers.forEach((header,index) => { columns[header] = index; });
  if (VUA_TOI_HEADERS_.some(header => columns[header] === undefined)) throw orderError_('SHEET_HEADERS_MISMATCH');
  return {columns,width:headers.length};
}
function canonicalRow_(row,layout) {
  return VUA_TOI_HEADERS_.map(header => row[layout.columns[header]]);
}

function money_(amount) {
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g,'.') + ' ₫';
}
function preparePriceColumns_(sheet,layout) {
  ['Đơn giá từng bộ (VNĐ)','Thành tiền từng bộ (VNĐ)','Tổng tiền hàng (VNĐ)'].forEach((header,index) => {
    const column = layout.columns[header]+1;
    sheet.setColumnWidth(column,[300,340,180][index]);
    sheet.getRange(1,column).setWrap(true);
  });
}
function plainSheetText_(value) {
  const text = String(value === undefined || value === null ? '' : value);
  return text.startsWith("'") ? text.slice(1) : text;
}
function pricingFor_(items, unitPrices) {
  const prices = unitPrices || VUA_TOI_UNIT_PRICES_;
  return {
    unitPrices:items.map(item => item.product + ': ' + money_(prices[item.product])).join('\n'),
    lineTotals:items.map(item => item.product + ' × ' + item.quantity + ': ' + money_(prices[item.product]*item.quantity)).join('\n'),
    total:items.reduce((sum,item) => sum + prices[item.product]*item.quantity,0)
  };
}
function parseStoredItems_(value) {
  const seen = new Set();
  const items = plainSheetText_(value).split('\n').map(line => {
    const match = /^(Hộp quà .+) × ([1-9]\d{0,4})$/.exec(line);
    if (!match || !VUA_TOI_PRODUCTS_.includes(match[1]) || Number(match[2])>10000 || seen.has(match[1])) {
      throw orderError_('DATA_INTEGRITY');
    }
    seen.add(match[1]);
    return {product:match[1],quantity:Number(match[2])};
  });
  if (items.length>6) throw orderError_('DATA_INTEGRITY');
  return items.sort((a,b) => VUA_TOI_PRODUCTS_.indexOf(a.product)-VUA_TOI_PRODUCTS_.indexOf(b.product));
}
function backfillPricing_(sheet,layout) {
  const count = sheet.getLastRow()-1;
  if (count<1) return;
  const range = sheet.getRange(2,1,count,layout.width);
  const rows = range.getValues();
  const formulas = range.getFormulas();
  rows.forEach((physical,index) => {
    const row = canonicalRow_(physical,layout);
    const rowFormulas = canonicalRow_(formulas[index],layout);
    // Fill only wholly empty price fields; preserve every recorded snapshot.
    if (!row[6] || !row.slice(11,14).every(value => value === '') || rowFormulas.slice(11,14).some(Boolean)) return;
    let items;
    try { items = parseStoredItems_(row[6]); } catch (_) { return; }
    const pricing = pricingFor_(items);
    const values = [sheetText_(pricing.unitPrices),sheetText_(pricing.lineTotals),pricing.total];
    ['Đơn giá từng bộ (VNĐ)','Thành tiền từng bộ (VNĐ)','Tổng tiền hàng (VNĐ)'].forEach((header,field) => {
      const cell = sheet.getRange(index+2,layout.columns[header]+1);
      cell.setNumberFormat(field === 2 ? '#,##0" ₫"' : '@').setValues([[values[field]]]);
      if (field < 2) cell.setWrap(true);
    });
    sheet.autoResizeRows(index+2,1);
  });
}
function backfillRequestTypes_(sheet,layout) {
  const count = sheet.getLastRow()-1;
  if (count<1) return;
  const rows = sheet.getRange(2,1,count,layout.width).getValues();
  const typeColumn = layout.columns['Loại yêu cầu']+1;
  const formulas = sheet.getRange(2,typeColumn,count,1).getFormulas();
  rows.forEach((row,index) => {
    if (row[typeColumn-1] !== '' || formulas[index][0]) return;
    const source = plainSheetText_(row[layout.columns['Nguồn form']]);
    const type = source === 'consultation-form' ? 'Tư vấn' :
      ['quick-form','contact-form'].includes(source) ? 'Đặt hàng' : '';
    if (type) sheet.getRange(index+2,typeColumn).setNumberFormat('@').setValues([[sheetText_(type)]]);
  });
}
function assertPricing_(actual, items, expectedPricing) {
  let pricing = expectedPricing;
  if (!pricing) {
    // Retries use saved unit prices even if the catalogue changes later.
    const lines = plainSheetText_(actual[11]).split('\n');
    if (lines.length !== items.length) throw orderError_('VERIFY_FAILED');
    const prices = {};
    items.forEach((item,index) => {
      const prefix = item.product + ': ';
      if (!lines[index].startsWith(prefix)) throw orderError_('VERIFY_FAILED');
      const formatted = lines[index].slice(prefix.length);
      const match = /^([\d.]+) ₫$/.exec(formatted);
      const price = match ? Number(match[1].replace(/\./g,'')) : NaN;
      if (!Number.isSafeInteger(price) || price<1 || price>1000000000 || money_(price)!==formatted) {
        throw orderError_('VERIFY_FAILED');
      }
      prices[item.product] = price;
    });
    pricing = pricingFor_(items,prices);
  }
  if (plainSheetText_(actual[11])!==pricing.unitPrices || plainSheetText_(actual[12])!==pricing.lineTotals ||
      actual[13]!==pricing.total) throw orderError_('VERIFY_FAILED');
}

function validRequestId_(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,80}$/.test(value);
}

function singleLine_(value, maxLength, code) {
  if (typeof value !== 'string' || value.length > maxLength || /[\u0000-\u001f\u007f]/.test(value)) {
    throw orderError_(code);
  }
  return value.trim().replace(/ +/g, ' ');
}

function validateOrder_(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
      ![undefined,'order','consultation'].includes(payload.kind)) throw orderError_('INVALID_REQUEST');
  const consultation = payload.kind === 'consultation';
  const keys = consultation ? ['kind','name','phone','email','source','requestId'] :
    ['kind','name','phone','email','items','occasion','notes','source','requestId'];
  if (
      Object.keys(payload).some(key => !keys.includes(key)) || !validRequestId_(payload.requestId)) {
    throw orderError_('INVALID_REQUEST');
  }
  const name = singleLine_(payload.name, 80, 'INVALID_NAME');
  if (name.length < 2) throw orderError_('INVALID_NAME');
  const phone = singleLine_(payload.phone, 18, 'INVALID_PHONE');
  const digits = phone.replace(/\D/g, '');
  if (!/^[0-9+(). -]{9,18}$/.test(phone) || digits.length < 9 || digits.length > 15) {
    throw orderError_('INVALID_PHONE');
  }
  const email = payload.email === undefined ? '' : singleLine_(payload.email, 254, 'INVALID_EMAIL');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw orderError_('INVALID_EMAIL');
  if (consultation) {
    if (payload.source !== 'consultation-form') throw orderError_('INVALID_SOURCE');
    return {
      kind:'consultation', requestId:payload.requestId, name, phone, email,
      items:[], occasion:'', notes:'', source:payload.source
    };
  }
  if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > VUA_TOI_PRODUCTS_.length) {
    throw orderError_('INVALID_ITEMS');
  }
  const seen = new Set();
  const items = payload.items.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item) ||
        Object.keys(item).some(key => !['product', 'quantity'].includes(key))) throw orderError_('INVALID_ITEMS');
    if (!VUA_TOI_PRODUCTS_.includes(item.product)) throw orderError_('INVALID_PRODUCT');
    if (seen.has(item.product)) throw orderError_('DUPLICATE_PRODUCT');
    seen.add(item.product);
    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) ||
        item.quantity < 1 || item.quantity > 10000) throw orderError_('INVALID_QUANTITY');
    return {product:item.product, quantity:item.quantity};
  }).sort((a,b) => VUA_TOI_PRODUCTS_.indexOf(a.product) - VUA_TOI_PRODUCTS_.indexOf(b.product));
  const occasion = payload.occasion === undefined || payload.occasion === '' ? 'Cần tư vấn' : payload.occasion;
  if (!VUA_TOI_OCCASIONS_.includes(occasion)) throw orderError_('INVALID_OCCASION');
  const notes = payload.notes === undefined ? '' : payload.notes;
  if (typeof notes !== 'string' || notes.length > 600 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(notes)) {
    throw orderError_('INVALID_NOTES');
  }
  if (!['quick-form', 'contact-form'].includes(payload.source)) throw orderError_('INVALID_SOURCE');
  return {
    requestId: payload.requestId, name, phone, email, items,
    occasion, notes: notes.trim(), source: payload.source
  };
}

function formatItems_(items) {
  return items.map(item => item.product + ' × ' + item.quantity).join('\n');
}
function totalQuantity_(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function fingerprint_(order) {
  if (order.kind === 'consultation') {
    const fields = ['consultation',order.name,order.phone,order.email,order.source];
    return digest_(JSON.stringify(fields));
  }
  const fields = [
    order.name, order.phone, order.items,
    order.occasion, order.notes, order.source
  ];
  // Keep fingerprints compatible with existing orders when email was omitted.
  if (order.email) fields.push(order.email);
  return digest_(JSON.stringify(fields));
}
function digest_(canonical) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, canonical, Utilities.Charset.UTF_8)
    .map(byte => ('0' + ((byte + 256) % 256).toString(16)).slice(-2)).join('');
}

/** Prefix every user string, including those beginning with =, +, -, @ or '. */
function sheetText_(value) {
  return "'" + String(value);
}

function assertStored_(range, layout, order, fingerprint, expectedTime, expectedPricing) {
  const actual = canonicalRow_(range.getValues()[0],layout);
  const consultation = order.kind === 'consultation';
  if (canonicalRow_(range.getFormulas()[0],layout).some(Boolean)) throw orderError_('VERIFY_FAILED');
  const expected = [
    'VT-' + order.requestId, order.requestId, null, order.name, order.phone, order.email,
    formatItems_(order.items), consultation ? '' : totalQuantity_(order.items),
    order.notes, order.source, fingerprint
  ];
  for (let index = 0; index < expected.length; index++) {
    if (index === 2) continue;
    if (index === 7) {
      if (actual[index] !== expected[index]) throw orderError_('VERIFY_FAILED');
    } else if (String(actual[index]) !== expected[index] &&
               String(actual[index]) !== sheetText_(expected[index])) {
      throw orderError_('VERIFY_FAILED');
    }
  }
  if (consultation) {
    if (!actual.slice(11,14).every(value => plainSheetText_(value) === '')) throw orderError_('VERIFY_FAILED');
  } else assertPricing_(actual,order.items,expectedPricing);
  if (plainSheetText_(actual[14]) !== (consultation ? 'Tư vấn' : 'Đặt hàng')) throw orderError_('VERIFY_FAILED');
  if (!(actual[2] instanceof Date) || !Number.isFinite(actual[2].getTime()) ||
      (expectedTime && Math.abs(actual[2].getTime() - expectedTime.getTime()) > 2000)) {
    throw orderError_('VERIFY_FAILED');
  }
}

function orderError_(code) {
  const error = new Error(code);
  error.orderCode = code;
  return error;
}

function failure_(code) {
  const messages = {
    NOT_CONFIGURED: 'Kênh đặt hàng chưa được cấu hình. Vui lòng liên hệ Vua Tỏi qua Zalo.',
    CONFIG_ERROR: 'Cấu hình nhận đơn chưa hợp lệ. Vui lòng liên hệ Vua Tỏi.',
    ORIGIN_NOT_ALLOWED: 'Địa chỉ trang chưa được cho phép gửi đơn.',
    INVALID_REQUEST: 'Yêu cầu đặt hàng chưa hợp lệ. Vui lòng tải lại trang và kiểm tra thông tin.',
    INVALID_NAME: 'Vui lòng nhập họ tên từ 2 đến 80 ký tự.',
    INVALID_PHONE: 'Vui lòng kiểm tra số điện thoại liên hệ.',
    INVALID_EMAIL: 'Vui lòng nhập email hợp lệ hoặc để trống.',
    INVALID_ITEMS: 'Vui lòng chọn từ 1 đến 6 loại bộ quà.',
    DUPLICATE_PRODUCT: 'Mỗi loại bộ quà chỉ chọn một lần; bạn có thể tăng số lượng.',
    INVALID_PRODUCT: 'Vui lòng chọn bộ quà đang có trong danh mục.',
    INVALID_QUANTITY: 'Vui lòng nhập số lượng nguyên từ 1 đến 10.000 bộ.',
    INVALID_OCCASION: 'Vui lòng chọn dịp tặng trong danh sách.',
    INVALID_NOTES: 'Ghi chú tối đa 600 ký tự và không chứa ký tự điều khiển.',
    INVALID_SOURCE: 'Nguồn biểu mẫu chưa hợp lệ. Vui lòng tải lại trang.',
    REQUEST_ID_CONFLICT: 'Mã yêu cầu đã được dùng cho nội dung khác. Vui lòng bắt đầu yêu cầu mới.',
    SHEET_HEADERS_MISMATCH: 'Bảng nhận đơn chưa đúng cấu trúc. Vui lòng liên hệ Vua Tỏi.',
    DATA_INTEGRITY: 'Chưa xác nhận được đơn trong bảng dữ liệu. Vui lòng liên hệ Vua Tỏi.',
    BUSY: 'Hệ thống đang bận. Vui lòng thử gửi lại cùng yêu cầu.',
    VERIFY_FAILED: 'Chưa xác nhận được việc lưu đơn. Vui lòng thử lại cùng yêu cầu.',
    STORAGE_ERROR: 'Chưa xác nhận được việc lưu đơn. Vui lòng thử lại hoặc liên hệ Vua Tỏi.'
  };
  const known = Object.prototype.hasOwnProperty.call(messages, code) ? code : 'STORAGE_ERROR';
  return {
    saved: false,
    error: {
      code: known, message: messages[known],
      retryable: ['BUSY', 'VERIFY_FAILED', 'STORAGE_ERROR'].includes(known)
    }
  };
}

function scriptJson_(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function bridgeHtml_(boot) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Vua Tỏi order bridge</title></head><body>
<script>
(function () {
  'use strict';
  var boot = ${scriptJson_(boot)};
  var busy = false;
  function send(type, extra) {
    var message = Object.assign({type: type, version: 1, requestId: boot.requestId, nonce: boot.nonce}, extra || {});
    window.top.postMessage(message, boot.origin);
  }
  function safeFailure() {
    return {saved: false, error: {code: 'STORAGE_ERROR', message: 'Chưa xác nhận được việc lưu đơn. Vui lòng thử lại cùng yêu cầu.', retryable: true}};
  }
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (event.source !== window.top || event.origin !== boot.origin || !data ||
        data.type !== 'VUA_TOI_ORDER_SUBMIT' || data.version !== 1 ||
        data.requestId !== boot.requestId || data.nonce !== boot.nonce || busy) return;
    if (!data.payload || data.payload.requestId !== boot.requestId) {
      send('VUA_TOI_ORDER_RESULT', {saved: false, error: {code: 'INVALID_REQUEST', message: 'Mã yêu cầu không khớp. Vui lòng tải lại trang.', retryable: false}});
      return;
    }
    busy = true;
    try {
      google.script.run.withSuccessHandler(function (result) {
        busy = false;
        // Only explicitly verified server results can become a successful ACK.
        if (result && result.saved === true && result.orderId === 'VT-' + boot.requestId) {
          send('VUA_TOI_ORDER_RESULT', {saved: true, orderId: result.orderId});
        } else if (result && result.saved === false && result.error) {
          send('VUA_TOI_ORDER_RESULT', {saved: false, error: result.error});
        } else {
          send('VUA_TOI_ORDER_RESULT', safeFailure());
        }
      }).withFailureHandler(function () {
        busy = false;
        send('VUA_TOI_ORDER_RESULT', safeFailure());
      }).saveOrder(data.payload, boot.origin);
    } catch (_) {
      busy = false;
      send('VUA_TOI_ORDER_RESULT', safeFailure());
    }
  });
  window.addEventListener('load', function () { send('VUA_TOI_ORDER_READY'); });
})();
</script></body></html>`;
}
