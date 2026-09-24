
const STATE = {
  recuerdos: [],
  filtroActivo: 'todos',
  colorActivo: 'purple',
  emojiActivo: '💖',
  imagenBase64: null,      
  veriendo: null,
};


function generarId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatFecha(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${parseInt(d)} de ${meses[parseInt(m) - 1]}, ${y}`;
}

function calcDiasJuntos(fechaInicio) {
  if (!fechaInicio) return 0;
  const inicio = new Date(fechaInicio + 'T00:00:00');
  const hoy = new Date();
  return Math.max(0, Math.floor((hoy - inicio) / 86400000));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('visible'), 3200);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}



function cargarDatos() {
  db.ref('recuerdos').on('value', (snapshot) => {
    const data = snapshot.val();
    STATE.recuerdos = [];
    if (data) {
      for (const key in data) {
        STATE.recuerdos.push(data[key]);
      }
    }
    renderGaleria();
    actualizarStats();
  });
}

function guardarDatos(recuerdo) {
  try {
    db.ref('recuerdos/' + recuerdo.id).set(recuerdo);
  } catch (e) {
    showToast('⚠️ Hubo un error al guardar en la nube.');
  }
}

function borrarDato(id) {
  try {
    db.ref('recuerdos/' + id).remove();
  } catch (e) {
    showToast('⚠️ Error al eliminar.');
  }
}


class UniversoCanvas {
  constructor(el) {
    this.canvas = el;
    this.ctx = el.getContext('2d');
    this.stars = [];
    this.shootingStars = [];
    this.particles = [];
    this.mouse = { x: -9999, y: -9999 };
    this.t = 0;
    this.init();
    this.bindEvents();
    this.tick();
  }

  init() {
    this.resize();
    this.createStars();
    this.createParticles();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
  }

  createStars() {
    this.stars = [];
    const count = Math.min(Math.floor((this.W * this.H) / 2800), 350);
    const palettes = [
      'rgba(255,255,255,', 'rgba(210,190,255,',
      'rgba(180,220,255,', 'rgba(255,210,245,', 'rgba(255,248,200,',
    ];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        r: Math.random() * 1.8 + 0.2,
        baseAlpha: Math.random() * 0.7 + 0.2,
        alpha: 0,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.025 + 0.005,
        color: palettes[Math.floor(Math.random() * palettes.length)],
        parallax: Math.random() * 8 + 1,
      });
    }
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < 22; i++) {
      this.particles.push(this.newParticle(false));
    }
  }

  newParticle(fromBottom = true) {
    const cols = [
      'rgba(168,85,247,', 'rgba(236,72,153,',
      'rgba(59,130,246,', 'rgba(6,182,212,', 'rgba(99,102,241,',
    ];
    return {
      x: Math.random() * this.W,
      y: fromBottom ? this.H + 10 : Math.random() * this.H,
      r: Math.random() * 2.8 + 0.8,
      alpha: 0,
      targetAlpha: Math.random() * 0.5 + 0.08,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.35 + 0.08),
      color: cols[Math.floor(Math.random() * cols.length)],
      life: 0,
      maxLife: Math.random() * 500 + 200,
    };
  }

  spawnShootingStar() {
    const angle = (Math.random() * 30 + 15) * (Math.PI / 180);
    this.shootingStars.push({
      x: Math.random() * this.W * 0.6,
      y: Math.random() * this.H * 0.4,
      vx: Math.cos(angle) * (6 + Math.random() * 6),
      vy: Math.sin(angle) * (6 + Math.random() * 6),
      len: 80 + Math.random() * 120,
      alpha: 1,
      life: 0,
      maxLife: 40 + Math.random() * 30,
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => { this.resize(); this.createStars(); });
    window.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });

    setInterval(() => {
      if (Math.random() < 0.6) this.spawnShootingStar();
    }, 4000);
  }

  tick() {
    this.t++;
    this.draw();
    requestAnimationFrame(() => this.tick());
  }

  draw() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);

    const mx = (this.mouse.x - W / 2) / W;
    const my = (this.mouse.y - H / 2) / H;

    for (const s of this.stars) {
      s.twinkle += s.twinkleSpeed;
      s.alpha = s.baseAlpha + Math.sin(s.twinkle) * 0.25;

      const ox = mx * s.parallax;
      const oy = my * s.parallax;

      const dx = s.x + ox - this.mouse.x;
      const dy = s.y + oy - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const glow = dist < 80 ? (1 - dist / 80) * 0.7 : 0;
      const a = Math.min(1, s.alpha + glow);

      ctx.beginPath();
      ctx.arc(s.x + ox, s.y + oy, s.r + glow * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `${s.color}${a})`;
      ctx.fill();

      if (s.r > 1.3) {
        const len = s.r * (3 + glow * 2);
        ctx.strokeStyle = `${s.color}${a * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x + ox - len, s.y + oy);
        ctx.lineTo(s.x + ox + len, s.y + oy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s.x + ox, s.y + oy - len);
        ctx.lineTo(s.x + ox, s.y + oy + len);
        ctx.stroke();
      }
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.life++;
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.alpha = 1 - ss.life / ss.maxLife;

      if (ss.life >= ss.maxLife) { this.shootingStars.splice(i, 1); continue; }

      const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * ss.len / 10, ss.y - ss.vy * ss.len / 10);
      grad.addColorStop(0, `rgba(255,255,255,${ss.alpha})`);
      grad.addColorStop(0.3, `rgba(200,170,255,${ss.alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(200,170,255,0)');

      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - ss.vx * (ss.len / 10), ss.y - ss.vy * (ss.len / 10));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${ss.alpha})`;
      ctx.fill();
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;

      const prog = p.life / p.maxLife;
      if (prog < 0.1)      p.alpha = (prog / 0.1) * p.targetAlpha;
      else if (prog > 0.8) p.alpha = ((1 - prog) / 0.2) * p.targetAlpha;
      else                 p.alpha = p.targetAlpha;

      if (p.life >= p.maxLife) { this.particles[i] = this.newParticle(true); continue; }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.alpha})`;
      ctx.fill();

      const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g2.addColorStop(0, `${p.color}${p.alpha * 0.35})`);
      g2.addColorStop(1, `${p.color}0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = g2;
      ctx.fill();
    }
  }
}


function setupUpload() {
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('input-imagen');

  zone.addEventListener('click', (e) => {
    if (e.target.id === 'btn-remove-img') return;
    input.click();
  });
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });

  input.addEventListener('change', () => {
    if (input.files[0]) processFile(input.files[0]);
  });

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) processFile(file);
    else showToast('⚠️ Solo se aceptan imágenes');
  });

  document.getElementById('btn-remove-img').addEventListener('click', (e) => {
    e.stopPropagation();
    clearImagePreview();
  });
}

function processFile(file) {
  if (file.size > 8 * 1024 * 1024) {
    showToast('⚠️ La imagen es demasiado grande. Máx 8 MB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      } else {
        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
      STATE.imagenBase64 = dataUrl;
      showImagePreview(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function showImagePreview(src) {
  document.getElementById('upload-placeholder').style.display = 'none';
  const preview = document.getElementById('upload-preview');
  preview.style.display = 'block';
  document.getElementById('preview-img').src = src;
}

function clearImagePreview() {
  STATE.imagenBase64 = null;
  document.getElementById('upload-placeholder').style.display = '';
  document.getElementById('upload-preview').style.display = 'none';
  document.getElementById('preview-img').src = '';
  document.getElementById('input-imagen').value = '';
}


const BADGE_CLASS = { especial:'badge-especial', viaje:'badge-viaje', cotidiano:'badge-cotidiano', celebracion:'badge-celebracion' };
const BADGE_LABEL = { especial:'💖 Especial', viaje:'✈️ Viaje', cotidiano:'☕ Cotidiano', celebracion:'🎉 Celebración' };
const GRAD_MAP = {
  purple: 'linear-gradient(135deg,#a855f7,#ec4899)',
  blue:   'linear-gradient(135deg,#3b82f6,#06b6d4)',
  rose:   'linear-gradient(135deg,#f43f5e,#fb7185)',
  amber:  'linear-gradient(135deg,#f59e0b,#f97316)',
  teal:   'linear-gradient(135deg,#14b8a6,#84cc16)',
  indigo: 'linear-gradient(135deg,#6366f1,#a855f7)',
};

function renderGaleria() {
  const galeria = document.getElementById('galeria');
  const emptyState = document.getElementById('empty-state');

  let lista = STATE.filtroActivo === 'todos'
    ? STATE.recuerdos
    : STATE.recuerdos.filter(r => r.categoria === STATE.filtroActivo);

  if (lista.length === 0) {
    galeria.innerHTML = '';
    emptyState.classList.add('visible');
    return;
  }
  emptyState.classList.remove('visible');

  const ordenados = [...lista].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  galeria.innerHTML = ordenados.map((r, i) => `
    <article
      class="tarjeta"
      data-color="${r.color}"
      data-id="${r.id}"
      role="listitem"
      tabindex="0"
      aria-label="Recuerdo: ${escapeHtml(r.titulo)}"
      style="animation-delay:${i * 0.07}s"
    >
      <div class="tarjeta-glow"></div>

      ${r.imagen ? `
      <div class="tarjeta-foto-wrap">
        <img class="tarjeta-foto" src="${r.imagen}" alt="Foto de ${escapeHtml(r.titulo)}" loading="lazy" />
        <div class="tarjeta-foto-overlay"></div>
        <button class="tarjeta-expand-btn" data-id="${r.id}" aria-label="Ampliar foto" title="Ver foto">⤢</button>
      </div>` : ''}

      <div class="tarjeta-body">
        <div class="tarjeta-top">
          <span class="tarjeta-emoji">${r.emoji}</span>
          <span class="tarjeta-badge ${BADGE_CLASS[r.categoria] || 'badge-especial'}">${BADGE_LABEL[r.categoria] || 'Especial'}</span>
        </div>
        <h3 class="tarjeta-titulo">${escapeHtml(r.titulo)}</h3>
        ${r.descripcion ? `<p class="tarjeta-desc">${escapeHtml(r.descripcion)}</p>` : ''}
        <div class="tarjeta-footer">
          <span class="tarjeta-fecha">📅 ${formatFecha(r.fecha)}</span>
          <span class="tarjeta-leer">Ver más →</span>
        </div>
      </div>
    </article>
  `).join('');

  galeria.querySelectorAll('.tarjeta').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('tarjeta-expand-btn')) return;
      abrirRecuerdo(el.dataset.id);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirRecuerdo(el.dataset.id); }
    });
  });

  galeria.querySelectorAll('.tarjeta-expand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = STATE.recuerdos.find(x => x.id === btn.dataset.id);
      if (r && r.imagen) abrirLightbox(r.imagen);
    });
  });
}

function actualizarStats() {
  document.getElementById('total-recuerdos').textContent = STATE.recuerdos.length;
  document.getElementById('fotos-guardadas').textContent = STATE.recuerdos.filter(r => r.imagen).length;

  if (STATE.recuerdos.length > 0) {
    const masAntiguo = STATE.recuerdos.reduce((prev, curr) =>
      new Date(curr.fecha) < new Date(prev.fecha) ? curr : prev
    );
    document.getElementById('dias-juntos').textContent = calcDiasJuntos(masAntiguo.fecha);
  } else {
    document.getElementById('dias-juntos').textContent = 0;
  }
}


function abrirModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('input-fecha').value = hoy;
  setTimeout(() => document.getElementById('input-titulo').focus(), 300);
}

function cerrarModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('form-recuerdo').reset();
  clearImagePreview();
  resetPickers();
  document.getElementById('char-titulo').textContent = '0/60';
  document.getElementById('char-desc').textContent = '0/500';
}

function resetPickers() {
  STATE.colorActivo = 'purple';
  STATE.emojiActivo = '💖';
  document.querySelectorAll('.color-opt').forEach(b => {
    const on = b.dataset.color === 'purple';
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  document.querySelectorAll('.emoji-opt').forEach(b => {
    const on = b.dataset.emoji === '💖';
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}


function abrirRecuerdo(id) {
  const r = STATE.recuerdos.find(x => x.id === id);
  if (!r) return;
  STATE.veriendo = id;

  const overlay = document.getElementById('modal-ver-overlay');
  const modalVer = document.getElementById('modal-ver');
  const header = document.getElementById('ver-header');
  const fotoWrap = document.getElementById('ver-foto-wrap');
  const fotoEl = document.getElementById('ver-foto');

  if (r.imagen) {
    fotoWrap.style.display = 'block';
    fotoEl.src = r.imagen;
    modalVer.classList.add('has-foto');
    fotoEl.onclick = () => abrirLightbox(r.imagen);
  } else {
    fotoWrap.style.display = 'none';
    fotoEl.src = '';
    modalVer.classList.remove('has-foto');
    fotoEl.onclick = null;
  }

  header.style.setProperty('--card-grad', GRAD_MAP[r.color] || GRAD_MAP.purple);
  document.getElementById('ver-emoji').textContent = r.emoji;
  document.getElementById('ver-badge').textContent = BADGE_LABEL[r.categoria] || 'Especial';
  document.getElementById('ver-titulo').textContent = r.titulo;
  document.getElementById('ver-fecha').innerHTML = `📅 ${formatFecha(r.fecha)}`;
  document.getElementById('ver-desc').textContent = r.descripcion || 'Sin descripción añadida.';

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function cerrarVerModal() {
  document.getElementById('modal-ver-overlay').classList.remove('open');
  document.body.style.overflow = '';
  STATE.veriendo = null;
}


function abrirLightbox(src) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function cerrarLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}


function guardarRecuerdo(e) {
  e.preventDefault();

  const titulo = document.getElementById('input-titulo').value.trim();
  const descripcion = document.getElementById('input-descripcion').value.trim();
  const fecha = document.getElementById('input-fecha').value;
  const categoria = document.getElementById('input-categoria').value;

  if (!titulo) { shakeField('input-titulo'); return; }
  if (!fecha)  { shakeField('input-fecha');  return; }

  const recuerdo = {
    id: generarId(),
    titulo,
    descripcion,
    fecha,
    categoria,
    color: STATE.colorActivo,
    emoji: STATE.emojiActivo,
    imagen: STATE.imagenBase64 || null,
    creadoEn: new Date().toISOString(),
  };

  guardarDatos(recuerdo);
  
  cerrarModal();
  document.getElementById('galeria-container').scrollIntoView({ behavior: 'smooth' });
  showToast('✨ ¡Recuerdo guardado en el universo!');
}

function shakeField(id) {
  const el = document.getElementById(id);
  el.style.borderColor = '#f43f5e';
  el.style.boxShadow = '0 0 0 3px rgba(244,63,94,0.25)';
  el.animate([
    { transform: 'translateX(-6px)' },{ transform: 'translateX(6px)' },
    { transform: 'translateX(-4px)' },{ transform: 'translateX(4px)' },
    { transform: 'translateX(0)' },
  ], { duration: 300 });
  setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1600);
  el.focus();
}


function eliminarRecuerdo() {
  if (!STATE.veriendo) return;
  const idToDelete = STATE.veriendo;
  cerrarVerModal();
  borrarDato(idToDelete);
  showToast('🌠 Recuerdo eliminado del universo');
}


function setupFiltros() {
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.filtroActivo = btn.dataset.filtro;
      renderGaleria();
    });
  });
}


function setupPickers() {
  document.getElementById('color-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.color-opt');
    if (!btn) return;
    document.querySelectorAll('.color-opt').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
    btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
    STATE.colorActivo = btn.dataset.color;
  });

  document.getElementById('emoji-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.emoji-opt');
    if (!btn) return;
    document.querySelectorAll('.emoji-opt').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
    btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
    STATE.emojiActivo = btn.dataset.emoji;
  });
}


function setupCharCounters() {
  const ti = document.getElementById('input-titulo');
  const di = document.getElementById('input-descripcion');
  ti.addEventListener('input', () => { document.getElementById('char-titulo').textContent = `${ti.value.length}/60`; });
  di.addEventListener('input', () => { document.getElementById('char-desc').textContent = `${di.value.length}/500`; });
}


function init() {
  new UniversoCanvas(document.getElementById('universo-canvas'));

  cargarDatos();
  renderGaleria();
  actualizarStats();

  document.getElementById('btn-agregar').addEventListener('click', abrirModal);
  document.getElementById('modal-close').addEventListener('click', cerrarModal);
  document.getElementById('btn-cancelar').addEventListener('click', cerrarModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) cerrarModal(); });

  document.getElementById('modal-ver-close').addEventListener('click', cerrarVerModal);
  document.getElementById('modal-ver-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) cerrarVerModal(); });
  document.getElementById('btn-eliminar').addEventListener('click', eliminarRecuerdo);

  document.getElementById('lightbox-close').addEventListener('click', cerrarLightbox);
  document.getElementById('lightbox').addEventListener('click', (e) => { if (e.target === e.currentTarget || e.target.tagName === 'IMG') cerrarLightbox(); });

  document.getElementById('form-recuerdo').addEventListener('submit', guardarRecuerdo);
  setupUpload();
  setupFiltros();
  setupPickers();
  setupCharCounters();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModal();
      cerrarVerModal();
      cerrarLightbox();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
