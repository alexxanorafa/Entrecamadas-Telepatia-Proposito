// ============ SISTEMA DE MENU ============
const menuIcon = document.getElementById("menuIcon");
const menu = document.getElementById("menu");

menuIcon.addEventListener("click", function(e) {
    e.stopPropagation();
    menu.classList.toggle("active");
    menuIcon.classList.toggle("active");
});

document.addEventListener("click", function(e) {
    if (!menu.contains(e.target) && !menuIcon.contains(e.target)) {
        menu.classList.remove("active");
        menuIcon.classList.remove("active");
    }
});

document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("mouseenter", function() {
        this.style.transform = "translateY(-3px)";
    });
    item.addEventListener("mouseleave", function() {
        this.style.transform = "translateY(0)";
    });
});

// ---------- Estado & armazenamento ----------
const state = {
    messages: JSON.parse(localStorage.getItem('entrecamadas_messages') || '[]'),
    currentVisible: null
};

function persist() {
    localStorage.setItem('entrecamadas_messages', JSON.stringify(state.messages));
    renderList();
}

// ---------- UI refs ----------
const el = {
    title: document.getElementById('title'),
    message: document.getElementById('message'),
    key: document.getElementById('key'),
    tone: document.getElementById('tone'),
    save: document.getElementById('save'),
    promote: document.getElementById('promote'),
    carpe: document.getElementById('carpe'),
    list: document.getElementById('list'),
    visibleCard: document.getElementById('visibleCard'),
    visibleTitle: document.getElementById('visibleTitle'),
    visibleText: document.getElementById('visibleText'),
    visibleTone: document.getElementById('visibleTone'),
    visibleKey: document.getElementById('visibleKey'),
    speakBtn: document.getElementById('speakBtn'),
    closeBtn: document.getElementById('closeBtn'),
    canvas: document.getElementById('cosmos'),
    helpBtn: document.getElementById('helpBtn'),
    helpCard: document.getElementById('helpCard'),
    closeHelp: document.getElementById('closeHelp')
};

// ---------- Sistema de Ajuda ----------
el.helpBtn.addEventListener('click', () => {
    el.helpCard.classList.remove('hidden');
    el.visibleCard.classList.add('hidden');
});

el.closeHelp.addEventListener('click', () => {
    el.helpCard.classList.add('hidden');
});

// ---------- Helpers ----------
function nowISO() { return new Date().toISOString(); }

function toShortDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ---------- Render lista optimizada ----------
function renderList() {
    el.list.innerHTML = '';
    if (state.messages.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'card empty-state';
        empty.innerHTML = `
            <h3>🌌 Silêncio Criativo</h3>
            <p>Este espaço aguarda tuas mensagens invisíveis.</p>
            <button class="btn-primary btn-compact" onclick="focusNewMessage()">Começar a escrever</button>
        `;
        el.list.appendChild(empty);
        return;
    }
    
    state.messages
        .slice()
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .forEach((m, idx) => {
            const item = document.createElement('div');
            item.className = 'msg-item';
            item.innerHTML = `
                <div class="msg-content">
                    <h4>${m.title || '(sem título)'}</h4>
                    <div class="msg-meta">${toShortDate(m.created)} • ${m.tone}</div>
                    <div class="msg-meta">${m.carpe ? '⭐ Hoje, não amanhã' : '📝 Invisível'} • ${m.key || 'sem símbolo'}</div>
                </div>
                <div class="msg-actions">
                    <button class="btn-primary" data-action="show" data-index="${idx}" title="Tornar visível">👁️</button>
                    <button class="btn-green" data-action="edit" data-index="${idx}" title="Editar">✏️</button>
                    <button class="btn-accent" data-action="delete" data-index="${idx}" title="Apagar">🗑️</button>
                </div>
            `;
            el.list.appendChild(item);
        });
}

function focusNewMessage() {
    el.message.focus();
    // Fechar sidebar em mobile
    if (window.innerWidth <= 768) {
        document.querySelector('aside').classList.remove('open');
    }
}

// ---------- Gestão de Mensagens ----------
el.save.addEventListener('click', () => {
    const m = {
        id: crypto.randomUUID(),
        title: el.title.value.trim(),
        text: el.message.value.trim(),
        key: el.key.value.trim(),
        tone: el.tone.value,
        created: nowISO(),
        carpe: false
    };
    if (!m.text) {
        showToast('Escreve a mensagem invisível.', 'info');
        return;
    }
    state.messages.push(m);
    el.title.value = ''; el.message.value = ''; el.key.value = '';
    persist();
    showToast('Mensagem guardada!', 'success');
});

el.promote.addEventListener('click', () => {
    if (!el.message.value.trim()) {
        showToast('Escreve a mensagem para manifestar.', 'info');
        return;
    }
    const temp = {
        title: el.title.value.trim() || 'Manifesto',
        text: el.message.value.trim(),
        key: el.key.value.trim(),
        tone: el.tone.value
    };
    showVisible(temp);
});

el.carpe.addEventListener('click', () => {
    const txt = el.message.value.trim();
    if (!txt) {
        showToast('Sem conteúdo para marcar como Hoje.', 'info');
        return;
    }
    const m = {
        id: crypto.randomUUID(),
        title: el.title.value.trim() || 'Decisão de hoje',
        text: txt,
        key: el.key.value.trim(),
        tone: el.tone.value,
        created: nowISO(),
        carpe: true
    };
    state.messages.push(m);
    persist();
    showVisible(m);
    showToast('Marcado como "Hoje, não amanhã"!', 'success');
});

el.list.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const idx = Number(btn.dataset.index);
    const msg = state.messages[idx];
    
    if (action === 'delete') {
        if (confirm('Apagar esta mensagem?')) {
            state.messages.splice(idx, 1);
            persist();
            showToast('Mensagem apagada.', 'info');
        }
    } else if (action === 'edit') {
        el.title.value = msg.title || '';
        el.message.value = msg.text || '';
        el.key.value = msg.key || '';
        el.tone.value = msg.tone || 'propósito';
        showToast('Mensagem carregada para edição.', 'info');
        
        // Fechar sidebar em mobile após edição
        if (window.innerWidth <= 768) {
            document.querySelector('aside').classList.remove('open');
        }
    } else if (action === 'show') {
        showVisible(msg);
        
        // Fechar sidebar em mobile após mostrar
        if (window.innerWidth <= 768) {
            document.querySelector('aside').classList.remove('open');
        }
    }
});

// ---------- Visualização ----------
function showVisible(m) {
    state.currentVisible = m;
    el.visibleTitle.textContent = m.title || 'Mensagem';
    el.visibleText.textContent = m.text;
    el.visibleTone.textContent = m.tone || '—';
    el.visibleKey.textContent = m.key || '—';
    el.visibleCard.classList.remove('hidden');
    el.helpCard.classList.add('hidden');
    enhancedPulseCosmos(m);
}

el.closeBtn.addEventListener('click', () => {
    el.visibleCard.classList.add('hidden');
});

// ---------- Narração ----------
let currentUtterance = null;

el.speakBtn.addEventListener('click', () => {
    const m = state.currentVisible;
    if (!m) {
        showToast('Nenhuma mensagem visível.', 'info');
        return;
    }
    if (!('speechSynthesis' in window)) {
        showToast('Narração não suportada neste browser.', 'error');
        return;
    }
    
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        el.speakBtn.textContent = 'Continuar';
        return;
    }
    
    if (speechSynthesis.speaking && speechSynthesis.paused) {
        speechSynthesis.resume();
        el.speakBtn.textContent = 'Pausar';
        return;
    }
    
    speechSynthesis.cancel();
    currentUtterance = new SpeechSynthesisUtterance();
    currentUtterance.text = m.text;
    currentUtterance.lang = 'pt-PT';
    currentUtterance.rate = 0.9;
    currentUtterance.pitch = m.tone === 'místico' ? 1.1 : m.tone === 'científico' ? 0.9 : 1.0;
    
    currentUtterance.onend = () => {
        el.speakBtn.textContent = 'Narração';
    };
    
    currentUtterance.onerror = () => {
        el.speakBtn.textContent = 'Narração';
        showToast('Erro na narração.', 'error');
    };
    
    speechSynthesis.speak(currentUtterance);
    el.speakBtn.textContent = 'Pausar';
});

// ---------- Cosmos Canvas ----------
const ctx = el.canvas.getContext('2d');
let animationId;

function resize() {
    const container = el.canvas.parentElement;
    el.canvas.width = container.clientWidth;
    el.canvas.height = container.clientHeight;
}

const stars = [];
const rings = [];
const MAX_STARS = 400;

function initCosmos() {
    stars.length = 0; rings.length = 0;
    for (let i = 0; i < MAX_STARS; i++) {
        stars.push({
            x: Math.random(), y: Math.random(),
            r: Math.random() * 2 + 0.2,
            a: Math.random() * 0.8 + 0.2,
            hue: 220 + Math.random() * 50
        });
    }
    for (let i = 0; i < 8; i++) {
        rings.push({
            r: 60 + i * 50,
            w: 0.6 + i * 0.15,
            a: 0.3 + i * 0.06
        });
    }
}
initCosmos();

let t = 0, pulse = 0;
function drawCosmos() {
    const w = el.canvas.width, h = el.canvas.height;
    const cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) / 1.5);
    g.addColorStop(0, 'rgba(11, 14, 22, 1)');
    g.addColorStop(1, 'rgba(5, 7, 12, 1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (const s of stars) {
        const twinkle = Math.sin(t * 0.02 + s.x * 10 + s.y * 7) * 0.4 + 0.6;
        ctx.globalAlpha = s.a * twinkle;
        ctx.fillStyle = `hsl(${s.hue}, 75%, ${75 + Math.sin(t * 0.03 + s.x * 8) * 15}%)`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Rings
    ctx.strokeStyle = 'rgba(122, 167, 255, 0.2)';
    ctx.lineWidth = 1;
    for (const r of rings) {
        ctx.beginPath();
        ctx.arc(cx, cy, r.r + Math.sin(t * 0.008 + r.r) * 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Central pulse
    const pulseR = 25 + Math.sin(t * 0.06) * 5 + pulse * 15;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR * 3.5);
    grad.addColorStop(0, 'rgba(247, 166, 60, 0.8)');
    grad.addColorStop(0.7, 'rgba(247, 166, 60, 0.2)');
    grad.addColorStop(1, 'rgba(247, 166, 60, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseR * 3, 0, Math.PI * 2);
    ctx.fill();

    t++;
    animationId = requestAnimationFrame(drawCosmos);
}

function enhancedPulseCosmos(m) {
    const len = (m.text || '').length;
    const base = Math.min(1.2, len / 250);
    let intensity = base;
    
    switch (m.tone) {
        case 'místico': intensity += 0.5; break;
        case 'científico': intensity += 0.25; break;
        case 'contemplativo': intensity += 0.35; break;
        default: intensity += 0.3;
    }
    
    pulse = intensity;
    setTimeout(() => pulse = 0, 2200);
}

// ---------- Inicialização ----------
window.addEventListener('resize', resize);
window.addEventListener('load', () => {
    resize();
    drawCosmos();
    renderList();
    
    // Demo content
    if (state.messages.length === 0) {
        state.messages.push({
            id: crypto.randomUUID(),
            title: 'Rede telepática — memória do futuro',
            text: 'Há diálogos que vivem no silêncio. Quando o tempo repete sinais, não é dor: é propósito. Hoje, não amanhã.',
            key: 'flor',
            tone: 'propósito',
            created: nowISO(),
            carpe: false
        });
        persist();
    }
});