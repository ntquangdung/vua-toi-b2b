(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const motion = () => window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth';
  const menuToggle = $('#menu-toggle');
  const nav = $('#site-nav');
  const closeMenu = () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Mở menu');
  };
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  });
  $$('a', nav).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.matchMedia('(min-width:821px)').addEventListener('change', closeMenu);

  const leadTabs = $$('.lead-tab');
  const activateLeadTab = (tab, focus = false) => {
    const previous = leadTabs.find(item => item.getAttribute('aria-selected') === 'true');
    const previousForm = previous && $('#' + previous.getAttribute('aria-controls'))?.querySelector('form');
    const nextForm = $('#' + tab.getAttribute('aria-controls'))?.querySelector('form');
    if (previous !== tab && previousForm && nextForm) {
      ['name','phone','email'].forEach(name => {
        const from = previousForm.querySelector('[name="' + name + '"]');
        const to = nextForm.querySelector('[name="' + name + '"]');
        if (to && from && !to.value) to.value = from.value;
      });
    }
    leadTabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      $('#' + item.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus({preventScroll:true});
  };
  leadTabs.forEach((tab,index) => {
    tab.addEventListener('click', () => activateLeadTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? leadTabs.length-1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + leadTabs.length) % leadTabs.length;
      if (!leadTabs[target].disabled) activateLeadTab(leadTabs[target],true);
    });
  });
  document.addEventListener('vua-toi:select-product', () => {
    const orderTab = $('#tab-order');
    if (orderTab && !orderTab.disabled) activateLeadTab(orderTab);
  });

  const selectProduct = product => {
    document.dispatchEvent(new CustomEvent('vua-toi:select-product', {detail:{product}}));
  };
  $$('a[data-product]').forEach(link => link.addEventListener('click', () => selectProduct(link.dataset.product)));
  $$('a[data-occasion]').forEach(link => link.addEventListener('click', () => {
    $('#contact-occasion').value = link.dataset.occasion;
  }));

  $$('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    target?.closest('.reveal-ready')?.classList.add('is-visible');
  }));

  const dialog = $('#product-dialog');
  const dialogSelect = $('#dialog-select');
  $$('[data-view]').forEach(button => button.addEventListener('click', () => {
    const card = document.getElementById(button.dataset.view);
    const title = $('h3', card).textContent;
    const photo = $('.product-photo', button).cloneNode(true);
    $('img', photo).loading = 'eager';
    $('#dialog-photo').replaceChildren(photo);
    $('#dialog-title').textContent = title;
    $('#dialog-price').replaceChildren($('.gift-prices', card).cloneNode(true));
    $('#dialog-contents').replaceChildren(...$('.gift-contents', card).textContent.split(' + ').map(text => {
      const item = document.createElement('li'); item.textContent = text; return item;
    }));
    dialogSelect.dataset.product = 'Hộp quà ' + title;
    dialog.showModal();
    document.body.classList.add('modal-open');
  }));
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  dialogSelect.addEventListener('click', () => {
    selectProduct(dialogSelect.dataset.product);
    dialog.close();
  });
  $('#copyright-year').textContent = String(new Date().getFullYear());

  // Content stays visible without JavaScript or when reduced motion is requested.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const revealTargets = $$('.section-heading, .gift-card, .occasion-card, .detail-card, .contact-copy, .contact-form-panel, .faq-layout');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {threshold:0.12, rootMargin:'0px 0px -24px 0px'});
    revealTargets.forEach(target => {
      target.classList.add('reveal-ready');
      if (target.matches('.gift-card, .occasion-card, .detail-card')) {
        const index = [...target.parentElement.children].indexOf(target);
        target.style.setProperty('--reveal-delay', (index % 3) * 65 + 'ms');
      }
      observer.observe(target);
    });
    document.documentElement.classList.add('motion-ready');
    document.addEventListener('focusin', event => {
      const target = event.target.closest('.reveal-ready');
      if (!target) return;
      target.classList.add('is-visible');
      observer.unobserve(target);
    });
    reducedMotion.addEventListener('change', event => {
      if (!event.matches) return;
      observer.disconnect();
      revealTargets.forEach(target => target.classList.add('is-visible'));
      document.documentElement.classList.remove('motion-ready');
    });
  }

})();
