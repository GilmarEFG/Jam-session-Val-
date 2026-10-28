/* =========================================================
   JAM CN Valparaíso — script.js
   ========================================================= */

const URL_PLANILHA = "COLE_AQUI_A_URL_DO_WEB_APP_DO_GOOGLE_APPS_SCRIPT";

// Evento: 14/11/2026, 16h às 19h (horário de Brasília, UTC-3)
const EVENTO_INICIO = new Date("2026-11-14T16:00:00-03:00");
const EVENTO_FIM = new Date("2026-11-14T19:00:00-03:00");
const LOCAL_TEXTO = "CN Valparaíso, Valparaíso de Goiás - GO";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Scroll reveal */
(function () {
  const itens = $$(".reveal");
  if (!("IntersectionObserver" in window)) { itens.forEach(i => i.classList.add("in")); return; }
  const io = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: .12 });
  itens.forEach(i => io.observe(i));
})();

/* Brilho dos botões */
$$(".btn--glow").forEach(function (btn) {
  btn.addEventListener("pointermove", function (e) {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty("--mx", (e.clientX - r.left) + "px");
    btn.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
});

/* Hero FX */
(function () {
  const canvas = $("#fx");
  if (!canvas) return;
  const hero = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1, t = 0, rodando = false;
  const mouse = { x: -9999, y: -9999, alvoX: -9999, alvoY: -9999 };
  let particulas = [];

  function redimensionar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const qtd = Math.round(Math.min(70, w / 18));
    particulas = Array.from({ length: qtd }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.6 + .6,
      vy: -(Math.random() * .25 + .08),
      vx: (Math.random() - .5) * .15,
      a: Math.random() * .5 + .15
    }));
    if (!rodando) desenhar();
  }

  function desenhar() {
    ctx.clearRect(0, 0, w, h);
    mouse.x += (mouse.alvoX - mouse.x) * .12;
    mouse.y += (mouse.alvoY - mouse.y) * .12;

    const linhas = 5;
    for (let i = 0; i < linhas; i++) {
      const baseY = h * (.5 + i * .09);
      const amp = 10 + i * 3;
      const freq = .006 + i * .0014;
      const vel = .012 + i * .004;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(196,181,253,0)");
      grad.addColorStop(.5, `rgba(196,181,253,${.2 - i * .025})`);
      grad.addColorStop(1, "rgba(125,211,252,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const dx = x - mouse.x;
        const dy = baseY - mouse.y;
        const influencia = Math.exp(-(dx * dx) / (2 * 150 * 150)) * Math.max(0, 1 - Math.abs(dy) / 260);
        const y = baseY + Math.sin(x * freq + t * vel * 10 + i) * amp * (1 + influencia * 3.2);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    particulas.forEach(function (p) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 140 * 140) {
        const d = Math.sqrt(d2) || 1;
        const f = (140 - d) / 140;
        p.x += (dx / d) * f * 2.2;
        p.y += (dy / d) * f * 2.2;
      }
      p.x += p.vx; p.y += p.vy;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      ctx.fillStyle = `rgba(244,244,245,${p.a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
  }

  function loop() {
    if (!rodando) return;
    t += 1; desenhar();
    requestAnimationFrame(loop);
  }

  hero.addEventListener("pointermove", function (e) {
    const r = hero.getBoundingClientRect();
    mouse.alvoX = e.clientX - r.left; mouse.alvoY = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", function () { mouse.alvoX = mouse.alvoY = -9999; });

  window.addEventListener("resize", redimensionar);
  redimensionar();

  if (!reduzMovimento && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entradas) {
      const visivel = entradas[0].isIntersecting;
      if (visivel && !rodando) { rodando = true; loop(); }
      if (!visivel) rodando = false;
    }).observe(hero);
  }
})();

/* Countdown */
(function () {
  const caixas = { d: $('[data-u="d"]'), h: $('[data-u="h"]'), m: $('[data-u="m"]'), s: $('[data-u="s"]') };
  const label = $("#cd-label");
  const status = $("#status");
  const statusTxt = $("#status-texto");
  const pad = n => String(n).padStart(2, "0");

  function set(el, valor) {
    if (el && el.textContent !== valor) {
      el.textContent = valor;
      el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
    }
  }

  function atualizar() {
    const agora = new Date();
    let resto = EVENTO_INICIO - agora;

    if (agora >= EVENTO_FIM) {
      if (label) label.textContent = "Obrigado por fazer música com a gente 🙌";
      if (status) { status.className = "status is-off"; if (statusTxt) statusTxt.textContent = "Inscrições encerradas"; }
      Object.values(caixas).forEach(c => { if (c) c.textContent = "00"; });
      return;
    }
    if (resto <= 0) {
      if (label) label.textContent = "É agora! A JAM já começou 🎶";
      if (status) { status.className = "status is-live"; if (statusTxt) statusTxt.textContent = "Acontecendo agora"; }
      Object.values(caixas).forEach(c => { if (c) c.textContent = "00"; });
      return;
    }
    const s = Math.floor(resto / 1000);
    set(caixas.d, pad(Math.floor(s / 86400)));
    set(caixas.h, pad(Math.floor((s % 86400) / 3600)));
    set(caixas.m, pad(Math.floor((s % 3600) / 60)));
    set(caixas.s, pad(s % 60));
  }

  atualizar();
  setInterval(atualizar, 1000);
})();

/* Formulário */
const form = $("#formulario");
const aviso = $("#aviso");
const botao = $("#botao");
const campo = id => document.getElementById(id);

const igreja = campo("igreja");
const outraWrap = campo("outra-wrap");
const outraInner = $(".collapse__inner", outraWrap);
const outraInput = campo("outra_igreja");
const instInput = campo("instrumento");

(function () {
  const hoje = new Date();
  const iso = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");
  if (campo("nascimento")) campo("nascimento").max = iso;
})();

if (campo("telefone")) {
  campo("telefone").addEventListener("input", function (e) {
    let d = e.target.value.replace(/\D/g, "").slice(0, 11);
    let r = d;
    if (d.length > 10) r = d.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    else if (d.length > 6) r = d.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    else if (d.length > 2) r = d.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    else if (d.length > 0) r = "(" + d;
    e.target.value = r;
  });
}

const regras = {
  nome: v => {
    const partes = v.trim().split(/\s+/).filter(Boolean);
    return partes.length >= 2 && v.trim().length >= 5 ? "" : "Informe seu nome e sobrenome.";
  },
  nascimento: v => {
    if (!v) return "Informe sua data de nascimento.";
    const d = new Date(v + "T00:00:00");
    if (isNaN(d) || d > new Date() || d.getFullYear() < 1920) return "Data de nascimento inválida.";
    return "";
  },
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Digite um e-mail válido.",
  telefone: v => {
    const n = v.replace(/\D/g, "");
    return n.length === 10 || n.length === 11 ? "" : "Digite DDD + número (ex: (61) 90000-0000).";
  },
  instrumento: v => v.trim().length >= 2 ? "" : "Escolha ou digite seu instrumento.",
  igreja: v => v ? "" : "Selecione sua igreja.",
  outra_igreja: v => v.trim().length >= 2 ? "" : "Informe o nome da sua igreja.",
  termos: () => campo("termos") && campo("termos").checked ? "" : "É preciso aceitar para participar."
};

const tocados = new Set();
const outraAberta = () => igreja && igreja.value === "Outra igreja";
const camposAtivos = () => Object.keys(regras).filter(n => n !== "outra_igreja" || outraAberta());

function valorDe(nome) {
  const el = campo(nome);
  if (!el) return "";
  return el.type === "checkbox" ? el.checked : el.value;
}

function validar(nome, mostrar) {
  const msg = regras[nome](valorDe(nome));
  if (mostrar && campo(nome)) {
    const wrap = campo(nome).closest(".field");
    if (wrap) {
      wrap.classList.toggle("is-invalid", !!msg);
      wrap.classList.toggle("is-valid", !msg && nome !== "termos");
      const msgEl = $(".msg", wrap);
      if (msgEl) msgEl.textContent = msg;
    }
  }
  return msg;
}

function atualizarProgresso() {
  const ativos = camposAtivos();
  const ok = ativos.filter(n => !regras[n](valorDe(n))).length;
  if (campo("prog-bar")) campo("prog-bar").style.width = (ok / ativos.length * 100) + "%";
  if (campo("prog-txt")) campo("prog-txt").textContent = ok + " de " + ativos.length;
}

function aoInteragir(nome, evento) {
  if (evento === "blur") tocados.add(nome);
  if (tocados.has(nome)) validar(nome, true);
  atualizarProgresso();
}

Object.keys(regras).forEach(function (nome) {
  const el = campo(nome);
  if (el) {
    el.addEventListener("input", () => aoInteragir(nome, "input"));
    el.addEventListener("change", () => aoInteragir(nome, "input"));
    el.addEventListener("blur", () => aoInteragir(nome, "blur"));
  }
});

function atualizarOutra() {
  const abrir = outraAberta();
  if (outraWrap) outraWrap.classList.toggle("open", abrir);
  if (outraInner) outraInner.inert = !abrir;
  if (outraInput) {
    outraInput.disabled = !abrir;
    if (abrir) {
      setTimeout(() => outraInput.focus({ preventScroll: true }), 350);
    } else {
      outraInput.value = "";
      tocados.delete("outra_igreja");
      const wrap = outraInput.closest(".field");
      if (wrap) wrap.classList.remove("is-valid", "is-invalid");
    }
  }
  atualizarProgresso();
}
if (igreja) igreja.addEventListener("change", atualizarOutra);

/* Seletor de instrumento */
(function () {
  const cards = $$(".inst");
  const msg = campo("picker-msg");
  const outroWrap = campo("outro-wrap");
  const outroInput = campo("outro-inst");
  const outroInner = $(".collapse__inner", outroWrap);
  if (outroInner) outroInner.inert = true;

  function marcar(valor) {
    cards.forEach(c => c.setAttribute("aria-checked", String(c.dataset.valor === valor)));
  }

  function preencherForm(valor) {
    if (instInput) {
      instInput.value = valor;
      tocados.add("instrumento");
      validar("instrumento", true);
      atualizarProgresso();
    }
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      const valor = card.dataset.valor;
      marcar(valor);
      const outro = valor === "Outro";
      if (outroWrap) outroWrap.classList.toggle("open", outro);
      if (outroInner) outroInner.inert = !outro;

      if (outro) {
        preencherForm("");
        tocados.delete("instrumento");
        if (instInput) {
          const wrap = instInput.closest(".field");
          if (wrap) wrap.classList.remove("is-valid", "is-invalid");
        }
        if (outroInput) outroInput.value = "";
        if (msg) msg.textContent = "Conta pra gente qual é o seu instrumento ou função.";
        if (outroInput) setTimeout(() => outroInput.focus({ preventScroll: true }), 350);
      } else {
        preencherForm(valor);
        if (msg) msg.textContent = valor + " escolhido! Já preenchemos para você.";
      }
    });
  });

  if (outroInput) {
    outroInput.addEventListener("input", function () {
      if (instInput) {
        instInput.value = outroInput.value;
        tocados.add("instrumento");
        validar("instrumento", true);
        atualizarProgresso();
      }
      if (msg) msg.textContent = outroInput.value.trim() ? "Anotado!" : "";
    });
  }

  if (instInput) {
    instInput.addEventListener("input", function () {
      const v = instInput.value.trim().toLowerCase();
      const achou = cards.find(c => c.dataset.valor.toLowerCase() === v && c.dataset.valor !== "Outro");
      marcar(achou ? achou.dataset.valor : "");
      if (!achou && outroWrap && outroInner) { outroWrap.classList.remove("open"); outroInner.inert = true; }
    });
  }

  if (form) {
    form.addEventListener("reset", function () {
      marcar("");
      if (outroWrap && outroInner) { outroWrap.classList.remove("open"); outroInner.inert = true; }
      if (outroInput) outroInput.value = "";
      if (msg) msg.textContent = "";
    });
  }
})();

/* Envio do formulário */
function mostrarAviso(texto, tipo) {
  if (aviso) {
    aviso.textContent = texto;
    aviso.className = tipo || "";
  }
}

function limparEstados() {
  tocados.clear();
  $$(".field", form).forEach(f => {
    f.classList.remove("is-valid", "is-invalid");
    const m = $(".msg", f);
    if (m) m.textContent = "";
  });
  atualizarOutra();
  atualizarProgresso();
}

if (form) {
  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let primeiro = null;
    camposAtivos().forEach(function (nome) {
      tocados.add(nome);
      if (validar(nome, true) && !primeiro) primeiro = nome;
    });
    atualizarProgresso();

    if (primeiro) {
      const el = campo(primeiro);
      if (el) {
        const wrap = el.closest(".field");
        if (wrap) {
          wrap.classList.remove("shake"); void wrap.offsetWidth; wrap.classList.add("shake");
        }
        el.focus();
      }
      mostrarAviso("Confira os campos destacados.", "erro");
      return;
    }

    mostrarAviso("");
    const primeiroNome = campo("nome").value.trim().split(/\s+/)[0];
    const txtOriginal = $("#botao-txt") ? $("#botao-txt").textContent : "Enviar";
    if (botao) botao.disabled = true;
    if ($("#botao-txt")) $("#botao-txt").textContent = "Enviando...";

    const dados = new URLSearchParams({
      nome: campo("nome").value,
      nascimento: campo("nascimento").value,
      email: campo("email").value,
      telefone: campo("telefone").value,
      instrumento: campo("instrumento").value,
      igreja: campo("igreja").value,
      outra_igreja: campo("outra_igreja").value,
      termos: campo("termos") && campo("termos").checked ? "Sim" : ""
    });

    fetch(URL_PLANILHA, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: dados.toString()
    })
      .then(function () {
        form.reset();
        limparEstados();
        abrirModal(primeiroNome);
      })
      .catch(function () {
        mostrarAviso("Erro ao enviar. Tente de novo.", "erro");
      })
      .finally(function () {
        if (botao) botao.disabled = false;
        if ($("#botao-txt")) $("#botao-txt").textContent = txtOriginal;
      });
  });
}

atualizarProgresso();

/* Modal e Confetes */
const modal = campo("modal");
let confeteAnim = null;

function abrirModal(nome) {
  if (campo("modal-titulo")) campo("modal-titulo").textContent = nome ? "Vaga garantida, " + nome + "!" : "Vaga garantida!";
  if (campo("modal-texto")) campo("modal-texto").textContent = "Sua inscrição foi enviada com sucesso. Te esperamos lá!";

  const detalhes = "JAM CN Valparaíso — uma tarde para fazer música juntos.";
  if (campo("btn-agenda")) {
    campo("btn-agenda").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent("JAM CN Valparaíso") +
      "&dates=20261114T190000Z/20261114T220000Z" +
      "&details=" + encodeURIComponent(detalhes) +
      "&location=" + encodeURIComponent(LOCAL_TEXTO);
  }

  const texto = "Vou participar da JAM CN Valparaíso! 🎶\n📅 14/11/2026, das 16h às 19h\n📍 CN Valparaíso\nFaça sua inscrição também: " + location.href.split("#")[0];
  if (campo("btn-whats")) {
    campo("btn-whats").href = "https://wa.me/?text=" + encodeURIComponent(texto);
  }

  if (modal) {
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    if (!reduzMovimento) setTimeout(confete, 250);
  }
}

function fecharModal() {
  if (modal) {
    if (typeof modal.close === "function") modal.close(); else modal.removeAttribute("open");
  }
}
if (campo("fechar")) campo("fechar").addEventListener("click", fecharModal);
if (modal) {
  modal.addEventListener("click", function (e) { if (e.target === modal) fecharModal(); });
  modal.addEventListener("close", function () { if (confeteAnim) cancelAnimationFrame(confeteAnim); });
}

function confete() {
  const cv = campo("confete");
  if (!cv || !modal) return;
  const c = cv.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = modal.clientWidth, H = modal.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cores = ["#c4b5fd", "#7dd3fc", "#f4f4f5", "#86efac", "#fcd34d"];
  const pecas = Array.from({ length: 80 }, function () {
    return {
      x: W / 2 + (Math.random() - .5) * 60, y: H * .28,
      vx: (Math.random() - .5) * 9, vy: -(Math.random() * 8 + 3),
      s: Math.random() * 6 + 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
      cor: cores[Math.floor(Math.random() * cores.length)]
    };
  });
  const inicio = performance.now();

  (function frame(agora) {
    const dec = agora - inicio;
    c.clearRect(0, 0, W, H);
    pecas.forEach(function (p) {
      p.vy += .22; p.vx *= .99;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      c.save();
      c.globalAlpha = Math.max(0, 1 - dec / 3200);
      c.translate(p.x, p.y); c.rotate(p.rot);
      c.fillStyle = p.cor;
      c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      c.restore();
    });
    if (dec < 3200 && modal.open) confeteAnim = requestAnimationFrame(frame);
    else c.clearRect(0, 0, W, H);
  })(inicio);
}
