(function () {
  'use strict';

  var WA_NUMBER = '5551992611901';
  window.dataLayer = window.dataLayer || [];

  /* Mensuração: cada clique em um link de WhatsApp vira um evento no dataLayer */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-wa]') : null;
    if (!el) return;
    window.dataLayer.push({
      event: 'whatsapp_click',
      click_origin: el.getAttribute('data-wa'),
      destination: 'shopping_das_tintas_sapiranga'
    });
  });

  /* Status da loja, sempre no horário de Brasília */
  function minutosEmSaoPaulo() {
    var partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    var dia = '', h = 0, m = 0;
    partes.forEach(function (p) {
      if (p.type === 'weekday') dia = p.value;
      if (p.type === 'hour') h = parseInt(p.value, 10) % 24;
      if (p.type === 'minute') m = parseInt(p.value, 10);
    });
    return { dia: dia, min: h * 60 + m };
  }

  function atualizarStatus() {
    var badge = document.getElementById('storeStatusBadge');
    var texto = document.getElementById('storeStatusText');
    if (!badge || !texto) return;
    var t = minutosEmSaoPaulo();
    var util = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(t.dia) > -1;
    var aberta = false;
    if (util) aberta = (t.min >= 450 && t.min < 690) || (t.min >= 780 && t.min < 1105);
    else if (t.dia === 'Sat') aberta = t.min >= 480 && t.min < 720;
    badge.setAttribute('data-state', aberta ? 'open' : 'closed');
    texto.textContent = aberta ? 'Loja aberta agora' : 'Loja fechada agora';
  }
  atualizarStatus();
  setInterval(atualizarStatus, 60000);

  /* Calculadora de tinta */
  var RENDIMENTO = { interna: 10, externa: 8.5, impermeabilizacao: 4.5, metais: 11 };
  var ROTULO = {
    interna: 'paredes internas', externa: 'fachada externa',
    impermeabilizacao: 'laje ou borracha líquida', metais: 'portão ou grade (esmalte)'
  };

  function fmt(n) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  }

  function embalagem(litros) {
    if (litros <= 0.9) return '1 quarto de 900 ml';
    if (litros <= 3.6) return '1 galão de 3,6 L';
    if (litros <= 7.2) return '2 galões de 3,6 L';
    if (litros <= 18) return '1 lata de 18 L';
    var latas = Math.floor(litros / 18);
    var resto = litros - latas * 18;
    var galoes = Math.ceil(resto / 3.6 - 1e-9);
    if (resto > 14.4) { latas += 1; galoes = 0; }
    return latas + (latas > 1 ? ' latas' : ' lata') + ' de 18 L' +
      (galoes > 0 ? ' + ' + galoes + (galoes > 1 ? ' galões' : ' galão') + ' de 3,6 L' : '');
  }

  var form = document.getElementById('calcForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var superficie = document.getElementById('calcSuperficie').value;
      var area = parseFloat(String(document.getElementById('calcArea').value).replace(',', '.'));
      var demaos = parseInt(document.getElementById('calcDemaos').value, 10);
      var erro = document.getElementById('calcErro');
      var res = document.getElementById('calcResult');

      if (!isFinite(area) || area <= 0) {
        erro.classList.remove('hidden'); res.classList.add('hidden');
        document.getElementById('calcArea').focus();
        return;
      }
      erro.classList.add('hidden');

      var litros = Math.ceil((area * demaos / RENDIMENTO[superficie]) * 10) / 10;
      var comSobra = Math.ceil(litros * 1.1 * 10) / 10;
      var sugestao = embalagem(comSobra);

      document.getElementById('calcLitros').textContent = '~ ' + fmt(litros) + ' litros';
      document.getElementById('calcSobra').textContent = 'Com 10% de sobra para retoques: cerca de ' + fmt(comSobra) + ' litros.';
      document.getElementById('calcEmbalagem').textContent = 'Sugestão: ' + sugestao;
      res.classList.remove('hidden');

      var msg = 'Olá! Calculei no site para ' + fmt(area) + ' m² (' + ROTULO[superficie] + ', ' + demaos +
        ' demãos). O resultado foi de cerca de ' + fmt(litros) + ' L, ou ' + fmt(comSobra) + ' L com 10% de sobra (' +
        sugestao + '). Gostaria de um orçamento.';
      document.getElementById('calcWa').href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
    });
  }

  /* Carrossel de avaliações: deslize nativo (snap), setas, bolinhas e rotação automática */
  (function () {
    var track = document.getElementById('reviewsTrack');
    if (!track) return;
    var cards = track.querySelectorAll('li');
    var dots = document.getElementById('reviewsDots');
    var prev = document.getElementById('reviewsPrev');
    var next = document.getElementById('reviewsNext');
    var reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null, parado = false, atual = 0;

    function passo() { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth; }
    function maxIndice() {
      var max = Math.round((track.scrollWidth - track.clientWidth) / passo());
      return Math.max(0, Math.min(cards.length - 1, max));
    }
    function indiceAtual() { return Math.max(0, Math.min(maxIndice(), Math.round(track.scrollLeft / passo()))); }

    function desenharBolinhas() {
      var max = maxIndice();
      dots.innerHTML = '';
      for (var i = 0; i <= max; i++) {
        (function (i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'grid place-items-center h-8 px-1.5';
          b.setAttribute('aria-label', 'Ir para a avaliação ' + (i + 1));
          b.appendChild(document.createElement('span'));
          b.addEventListener('click', function () { interagiu(); irPara(i); });
          dots.appendChild(b);
        })(i);
      }
      marcar();
    }
    function marcar() {
      atual = indiceAtual();
      var bs = dots.children;
      for (var i = 0; i < bs.length; i++) {
        var ativo = i === atual;
        bs[i].firstChild.className = ativo ? 'block h-2.5 w-7 rounded-full bg-brand-blue transition-all duration-300'
                                           : 'block h-2.5 w-2.5 rounded-full bg-slate-300 transition-all duration-300';
        if (ativo) bs[i].setAttribute('aria-current', 'true'); else bs[i].removeAttribute('aria-current');
      }
    }
    function irPara(i) {
      var max = maxIndice();
      if (i > max) i = 0;
      if (i < 0) i = max;
      track.scrollTo({ left: i * passo(), behavior: reduzir ? 'auto' : 'smooth' });
    }
    function interagiu() { parado = true; if (timer) { clearInterval(timer); timer = null; } }

    prev.addEventListener('click', function () { interagiu(); irPara(indiceAtual() - 1); });
    next.addEventListener('click', function () { interagiu(); irPara(indiceAtual() + 1); });
    ['touchstart', 'pointerdown', 'keydown', 'wheel'].forEach(function (ev) {
      track.addEventListener(ev, interagiu, { passive: true });
    });
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { marcar(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', desenharBolinhas);

    function iniciarAuto() {
      if (reduzir || parado || timer) return;
      timer = setInterval(function () { irPara(indiceAtual() + 1); }, 6000);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) iniciarAuto(); else if (timer) { clearInterval(timer); timer = null; }
      }, { threshold: 0.4 }).observe(track);
    }
    desenharBolinhas();
  })();
})();
