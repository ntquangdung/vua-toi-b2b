(() => {
  'use strict';
  const config = window.VUA_TOI_CONFIG || {};
  const forms = [...document.querySelectorAll('.request-form')];
  const picker = window.VuaToiGiftPicker;
  const attempts = new WeakMap();
  let sending = false;
  const normalise = value => String(value || '').trim().replace(/\s+/g, ' ');
  const randomId = () => {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  };
  const trustedGoogleOrigin = origin => /^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+[-.])?script\.googleusercontent\.com)$/i.test(origin);

  // Only the bridge URL receives IDs. Customer details travel in postMessage,
  // then google.script.run; a saved acknowledgment is required for success.
  const sendOrder = payload => new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(config.googleScriptUrl);
      if (url.origin !== 'https://script.google.com' || !/^\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url.pathname)) throw new Error();
      if (!/^https?:$/.test(location.protocol)) throw new Error();
    } catch {
      reject(new Error('Hiện chưa thể gửi yêu cầu. Vui lòng liên hệ qua Zalo hoặc gọi 0935 176 188.'));
      return;
    }
    const nonce = randomId();
    url.search = new URLSearchParams({origin:location.origin, requestId:payload.requestId, nonce}).toString();
    const frame = document.createElement('iframe');
    frame.className = 'order-bridge';
    frame.title = 'Xử lý yêu cầu gửi đến Vua Tỏi';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.referrerPolicy = 'no-referrer';
    let bridgeSource;
    let bridgeOrigin;
    let finished = false;
    const finish = (error, result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      window.removeEventListener('message', receive);
      frame.remove();
      error ? reject(error) : resolve(result);
    };
    const receive = event => {
      const data = event.data;
      if (!data || typeof data !== 'object' || data.version !== 1 || data.requestId !== payload.requestId || data.nonce !== nonce) return;
      if (!trustedGoogleOrigin(event.origin) || !event.source) return;
      if (data.type === 'VUA_TOI_ORDER_READY' && !bridgeSource) {
        // HtmlService has an inner sandbox frame, so pin the actual READY source.
        bridgeSource = event.source;
        bridgeOrigin = event.origin;
        bridgeSource.postMessage({type:'VUA_TOI_ORDER_SUBMIT', version:1, requestId:payload.requestId, nonce, payload}, bridgeOrigin);
        return;
      }
      if (data.type !== 'VUA_TOI_ORDER_RESULT' || event.source !== bridgeSource || event.origin !== bridgeOrigin) return;
      if (data.saved === true && data.orderId === 'VT-' + payload.requestId) {
        finish(null, {orderId:data.orderId});
      } else {
        const message = typeof data.error?.message === 'string' && data.error.message.length <= 250
          ? data.error.message : 'Chưa thể gửi đơn. Vui lòng thử lại hoặc liên hệ qua Zalo.';
        finish(new Error(message));
      }
    };
    const timeout = Number(config.timeoutMs);
    const timer = setTimeout(() => finish(new Error('Chưa nhận được xác nhận gửi đơn. Bạn có thể thử lại hoặc liên hệ qua Zalo.')), Math.min(60000, Math.max(10000, timeout || 25000)));
    window.addEventListener('message', receive);
    frame.addEventListener('error', () => finish(new Error('Không kết nối được. Vui lòng kiểm tra mạng hoặc liên hệ qua Zalo.')), {once:true});
    frame.src = url.href;
    document.body.append(frame);
  });

  forms.forEach(form => {
    const consultation = form.dataset?.requestType === 'consultation';
    if (!consultation && !picker) return;
    const submitLabel = form.querySelector('.order-label').textContent;
    form.querySelector('.form-submit').disabled = false;
    const field = name => form.querySelector('[name="' + name + '"]');
    const feedback = form.querySelector('.form-feedback');
    feedback.id = form.id + '-feedback';
    feedback.tabIndex = -1;
    const showFeedback = (message, state) => {
      feedback.hidden = false;
      feedback.classList.toggle('error', state === 'error');
      feedback.classList.toggle('success', state === 'success');
      feedback.textContent = message;
    };
    [...form.elements].forEach(input => {
      input.addEventListener('input', () => input.removeAttribute('aria-invalid'));
      input.addEventListener('change', () => input.removeAttribute('aria-invalid'));
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (sending) return;
      if (location.protocol === 'file:') {
        showFeedback('Bạn đang mở bản xem từ file, nên thông tin chưa được gửi. Vui lòng mở http://127.0.0.1:8765/ để gửi tư vấn hoặc đặt hàng.', 'error');
        feedback.focus({preventScroll:true});
        return;
      }
      const payload = {
        name:normalise(field('name').value),
        phone:normalise(field('phone').value),
        email:normalise(field('email')?.value),
        source:form.id,
      };
      if (consultation) payload.kind = 'consultation';
      else Object.assign(payload, {
        items:picker.getItems(), occasion:field('occasion')?.value || '',
        notes:normalise(field('notes')?.value),
      });
      const digits = payload.phone.replace(/\D/g, '');
      const checks = [
        ['name', payload.name.length >= 2 && payload.name.length <= 80, 'Vui lòng nhập họ tên từ 2 ký tự.'],
        ['phone', /^[0-9+().\s-]{9,18}$/.test(payload.phone) && digits.length >= 9 && digits.length <= 15, 'Vui lòng nhập số điện thoại hợp lệ.'],
        ['email', !payload.email || (payload.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)), 'Vui lòng nhập email hợp lệ hoặc để trống.'],
      ];
      checks.forEach(([name, valid]) => {
        field(name)?.setAttribute('aria-invalid', String(!valid));
        field(name)?.setAttribute('aria-describedby', feedback.id);
      });
      const invalid = checks.find(([, valid]) => !valid);
      const invalidItem = consultation ? null : picker.validate(form);
      if (invalid) {
        showFeedback(invalid[2], 'error');
        field(invalid[0]).focus();
        return;
      }
      if (invalidItem) {
        showFeedback(invalidItem.message, 'error');
        invalidItem.element.focus();
        return;
      }
      const fingerprint = JSON.stringify(payload);
      let attempt = attempts.get(form);
      if (!attempt || attempt.fingerprint !== fingerprint) {
        attempt = {fingerprint, requestId:randomId()};
        attempts.set(form, attempt);
      }
      payload.requestId = attempt.requestId;
      sending = true;
      form.setAttribute('aria-busy', 'true');
      const locked = [...document.querySelectorAll('.request-form input, .request-form select, .request-form textarea, .request-form button, .lead-tab')];
      const wasDisabled = locked.map(input => input.disabled);
      locked.forEach(input => { input.disabled = true; });
      picker?.setLocked(true);
      const label = form.querySelector('.order-label');
      label.textContent = 'Đang gửi…';
      showFeedback(consultation ? 'Đang gửi thông tin tư vấn…' : 'Đang gửi yêu cầu đặt hàng…', 'pending');
      try {
        await sendOrder(payload);
        showFeedback(consultation
          ? 'Đã nhận thông tin. Nhân viên Vua Tỏi sẽ liên hệ để tư vấn cho bạn.'
          : 'Đã nhận yêu cầu đặt hàng. Vua Tỏi sẽ liên hệ với bạn để xác nhận giá và giao nhận.', 'success');
        form.reset();
        if (!consultation) picker.reset();
        attempts.delete(form);
      } catch (error) {
        showFeedback(error.message || 'Chưa thể gửi đơn. Vui lòng liên hệ qua Zalo.', 'error');
      } finally {
        sending = false;
        form.removeAttribute('aria-busy');
        locked.forEach((input, index) => { input.disabled = wasDisabled[index]; });
        picker?.setLocked(false);
        label.textContent = submitLabel;
        feedback.focus({preventScroll:true});
      }
    });
  });
})();
