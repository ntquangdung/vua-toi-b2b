(() => {
  'use strict';
  const forms = [...document.querySelectorAll('.request-form')].filter(form => form.querySelector('.order-picker'));
  const catalog = JSON.parse(document.getElementById('gift-catalog').textContent);
  const byProduct = new Map(catalog.map(product => [product.product, product]));
  const template = document.getElementById('order-item-template');
  let sequence = 0;
  let locked = false;
  const emptyItem = () => ({key:++sequence, product:'', quantity:'1'});
  let items = [emptyItem()];
  const money = amount => new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  const feedback = message => forms.forEach(form => {
    form.querySelector('.order-selection-feedback').textContent = message;
  });
  const updateSummary = () => {
    const selected = items.filter(item => byProduct.has(item.product));
    const quantity = selected.reduce((sum, item) => sum + (validQuantity(item.quantity) ? Number(item.quantity) : 0), 0);
    const amount = selected.reduce((sum, item) => sum + (validQuantity(item.quantity) ? Number(item.quantity) * byProduct.get(item.product).price : 0), 0);
    const incomplete = selected.some(item => !validQuantity(item.quantity));
    forms.forEach(form => {
      form.querySelector('.order-item-count').textContent = selected.length ? selected.length + ' loại · ' + (incomplete ? 'kiểm tra số lượng' : quantity + ' bộ') : 'Chưa chọn bộ quà';
      form.querySelector('.order-total-value').textContent = incomplete ? '—' : money(amount);
      form.querySelector('.order-add').disabled = locked || items.length >= catalog.length;
    });
  };
  function validQuantity(value) {
    const number = Number(value);
    return String(value).trim() !== '' && Number.isInteger(number) && number >= 1 && number <= 10000;
  }
  const render = () => {
    forms.forEach(form => {
      const list = form.querySelector('.order-items');
      const scrollTop = list.scrollTop;
      list.replaceChildren(...items.map((item, index) => {
        const row = template.content.firstElementChild.cloneNode(true);
        row.dataset.key = String(item.key);
        const product = row.querySelector('select');
        const quantity = row.querySelector('input');
        const labels = row.querySelectorAll('label');
        product.id = form.id + '-product-' + item.key;
        quantity.id = form.id + '-quantity-' + item.key;
        labels[0].htmlFor = product.id;
        labels[0].textContent = 'Bộ quà ' + (index + 1);
        labels[1].htmlFor = quantity.id;
        catalog.forEach(gift => {
          const option = document.createElement('option');
          option.value = gift.product;
          option.textContent = gift.name;
          option.disabled = gift.product !== item.product && items.some(other => other.product === gift.product);
          product.append(option);
        });
        product.value = item.product;
        quantity.value = item.quantity;
        const remove = row.querySelector('.order-remove');
        remove.setAttribute('aria-label', 'Xóa bộ quà ' + (index + 1) + (item.product ? ': ' + byProduct.get(item.product).name : ''));
        remove.disabled = locked || items.length === 1;
        return row;
      }));
      list.scrollTop = scrollTop;
    });
    updateSummary();
  };
  const focusRow = (form, key, selector = 'select') => {
    const row = form.querySelector('.order-item[data-key="' + key + '"]');
    if (!row) return;
    row.querySelector(selector)?.focus({preventScroll:true});
    // Reveal the edited row inside its list without scrolling the landing page.
    const list = row.parentElement;
    const bounds = row.getBoundingClientRect();
    const viewport = list.getBoundingClientRect();
    if (bounds.bottom > viewport.bottom) list.scrollTop += bounds.bottom - viewport.bottom;
    else if (bounds.top < viewport.top) list.scrollTop -= viewport.top - bounds.top;
  };
  const validate = form => {
    let firstInvalid = null;
    form.querySelectorAll('.order-item').forEach((row, index) => {
      const item = items[index];
      const select = row.querySelector('select');
      const quantity = row.querySelector('input');
      const validProduct = byProduct.has(item.product) && items.filter(other => other.product === item.product).length === 1;
      [[select, validProduct], [quantity, validQuantity(item.quantity)]].forEach(([element, valid]) => {
        element.setAttribute('aria-invalid', String(!valid));
        element.setAttribute('aria-describedby', form.id + '-feedback');
      });
      if (!firstInvalid && !validProduct) firstInvalid = {element:select, message:'Vui lòng chọn bộ quà ở dòng ' + (index + 1) + ' hoặc xóa dòng chưa dùng.'};
      if (!firstInvalid && !validQuantity(item.quantity)) firstInvalid = {element:quantity, message:'Số lượng dòng ' + (index + 1) + ' cần là số nguyên từ 1 đến 10.000 bộ.'};
    });
    return firstInvalid;
  };
  forms.forEach(form => {
    form.querySelector('.order-add').addEventListener('click', () => {
      if (locked || items.length >= catalog.length) return;
      const item = emptyItem();
      items.push(item);
      render();
      feedback('Đã thêm dòng chọn quà ' + items.length + '.');
      focusRow(form, item.key);
    });
    form.querySelector('.order-items').addEventListener('click', event => {
      const remove = event.target.closest('.order-remove');
      if (!remove || locked || items.length <= 1) return;
      const key = Number(remove.closest('.order-item').dataset.key);
      const index = items.findIndex(item => item.key === key);
      items.splice(index, 1);
      render();
      feedback('Đã xóa lựa chọn. Còn ' + items.length + ' dòng.');
      focusRow(form, items[Math.min(index, items.length - 1)].key);
    });
    form.querySelector('.order-items').addEventListener('change', event => {
      if (locked || event.target.tagName !== 'SELECT') return;
      const key = Number(event.target.closest('.order-item').dataset.key);
      const item = items.find(item => item.key === key);
      item.product = event.target.value;
      render();
      feedback('');
      focusRow(form, key);
    });
    form.querySelector('.order-items').addEventListener('input', event => {
      if (locked || event.target.tagName !== 'INPUT') return;
      const key = Number(event.target.closest('.order-item').dataset.key);
      items.find(item => item.key === key).quantity = event.target.value;
      event.target.removeAttribute('aria-invalid');
      forms.filter(other => other !== form).forEach(other => {
        other.querySelector('.order-item[data-key="' + key + '"] input').value = event.target.value;
      });
      updateSummary();
    });
  });
  document.addEventListener('vua-toi:select-product', event => {
    const product = event.detail?.product;
    if (locked || !byProduct.has(product)) return;
    let item = items.find(row => row.product === product);
    const existing = Boolean(item);
    if (!item) {
      item = items.find(row => !row.product);
      if (item) item.product = product;
      else if (items.length < catalog.length) { item = {...emptyItem(), product}; items.push(item); }
      else return;
      render();
    }
    feedback(existing ? byProduct.get(product).name + ' đã có trong danh sách. Bạn có thể đổi số lượng.' : 'Đã thêm ' + byProduct.get(product).name + ' vào đơn.');
  });
  window.VuaToiGiftPicker = Object.freeze({
    getItems:() => items.map(item => ({product:item.product, quantity:Number(item.quantity)})),
    validate,
    setLocked:value => { locked = Boolean(value); updateSummary(); },
    reset:() => { items = [emptyItem()]; render(); feedback(''); },
  });
  render();
})();
