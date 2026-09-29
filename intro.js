// ===== Intro — Alawadi Studio =====
(() => {
    const intro = document.getElementById("intro");
    const root = document.documentElement;
    if (!intro) return;
    if (root.classList.contains("no-intro")) { intro.remove(); return; }

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (id) => document.getElementById(id);

    // ----- Language (same key as the site) -----
    let lang = "ar";
    try { lang = localStorage.getItem("lang") || "ar"; } catch {}
    const T = {
        ar: { name: "عارف العوادي", tag: "مبرمج طموح · يبني مستقبله سطرًا بسطر", enter: "ادخل الموقع", skip: "تخطي", hint: "حرّك الماوس أو المس الشاشة ✦" },
        en: { name: "Aref ALawadi", tag: "Aspiring Developer · Building his future line by line", enter: "Enter", skip: "Skip", hint: "Move your mouse or touch the screen ✦" },
    }[lang === "en" ? "en" : "ar"];
    $("introName").textContent = T.name;
    $("introTag").textContent = T.tag;
    $("introEnterTxt").textContent = T.enter;
    $("introSkip").textContent = T.skip;
    $("introHint").textContent = T.hint;

    // Brand letters appear one by one
    const brand = $("introBrand");
    const letters = brand.textContent;
    brand.textContent = "";
    [...letters].forEach((ch, i) => {
        const s = document.createElement("span");
        s.textContent = ch === " " ? " " : ch;
        s.style.animationDelay = 1.3 + i * 0.05 + "s";
        brand.append(s);
    });

    // ----- Particles -----
    const canvas = $("introCanvas");
    const ctx = canvas.getContext("2d");
    const glow = $("introGlow");
    const GLYPHS = ["</>", "{ }", "01", "html", "css", "js", "=>", "( )"];
    let W = 0, H = 0, DPR = 1, parts = [], bursts = [];
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

    function resize() {
        DPR = Math.min(devicePixelRatio || 1, 2);
        W = intro.clientWidth; H = intro.clientHeight;
        canvas.width = W * DPR; canvas.height = H * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        const count = Math.round(Math.min(110, (W * H) / 13000));
        parts = Array.from({ length: count }, (_, i) => ({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            r: Math.random() * 1.6 + 0.6,
            glyph: i % 9 === 0 ? GLYPHS[i % GLYPHS.length] : null,
            hue: Math.random() < 0.18 ? "m" : "t",
        }));
    }

    function burst(x, y) {
        for (let i = 0; i < 26; i++) {
            const a = (Math.PI * 2 * i) / 26, sp = 1.5 + Math.random() * 3;
            bursts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1 });
        }
        parts.forEach((p) => {
            const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1;
            if (d < 220) { p.vx += (dx / d) * 3; p.vy += (dy / d) * 3; }
        });
    }

    let running = true;
    function frame() {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);
        mouse.x += (mouse.tx - mouse.x) * 0.12;
        mouse.y += (mouse.ty - mouse.y) * 0.12;

        for (const p of parts) {
            const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
            if (mouse.active && d < 140 && d > 0) {
                const f = (140 - d) / 140 * 0.6;
                p.vx += (dx / d) * f; p.vy += (dy / d) * f;
            }
            p.vx *= 0.96; p.vy *= 0.96;
            p.vx += (Math.random() - 0.5) * 0.03; p.vy += (Math.random() - 0.5) * 0.03;
            p.x += p.vx + (p.vx > 0 ? 0.08 : -0.08); p.y += p.vy;
            if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
            if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        }

        // connections
        for (let i = 0; i < parts.length; i++) {
            const a = parts[i];
            for (let j = i + 1; j < parts.length; j++) {
                const b = parts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < 120) {
                    ctx.strokeStyle = `rgba(94, 211, 219, ${(1 - d / 120) * 0.22})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                }
            }
            if (mouse.active) {
                const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
                if (d < 200) {
                    ctx.strokeStyle = `rgba(201, 143, 143, ${(1 - d / 200) * 0.35})`;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                }
            }
        }

        // dots & glyphs
        for (const p of parts) {
            const col = p.hue === "m" ? "201, 143, 143" : "94, 211, 219";
            if (p.glyph) {
                ctx.font = "600 12px Poppins, monospace";
                ctx.fillStyle = `rgba(${col}, .35)`;
                ctx.fillText(p.glyph, p.x, p.y);
            } else {
                ctx.fillStyle = `rgba(${col}, .8)`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
            }
        }

        // click bursts
        bursts = bursts.filter((b) => b.life > 0);
        for (const b of bursts) {
            b.x += b.vx; b.y += b.vy; b.vx *= 0.94; b.vy *= 0.94; b.life -= 0.022;
            ctx.fillStyle = `rgba(94, 211, 219, ${b.life})`;
            ctx.beginPath(); ctx.arc(b.x, b.y, 1.8 * b.life + 0.4, 0, Math.PI * 2); ctx.fill();
        }

        glow.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
        requestAnimationFrame(frame);
    }

    // ----- Pointer: particles, glow, logo tilt, magnetic button -----
    const mark = $("introMark"), enter = $("introEnter");
    function onMove(x, y) {
        mouse.tx = x; mouse.ty = y;
        if (!mouse.active) { mouse.x = x; mouse.y = y; mouse.active = true; }
        const rx = (y / H - 0.5) * -24, ry = (x / W - 0.5) * 24;
        mark.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;

        const r = enter.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2, d = Math.hypot(x - cx, y - cy);
        enter.style.translate = d < 130 ? `${(x - cx) * 0.25}px ${(y - cy) * 0.35}px` : "0 0";
    }
    intro.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY));
    intro.addEventListener("pointerdown", (e) => {
        onMove(e.clientX, e.clientY);
        if (e.target === canvas || e.target === intro) burst(e.clientX, e.clientY);
    });
    intro.addEventListener("pointerleave", () => { mouse.active = false; enter.style.translate = "0 0"; });

    // ----- Loading progress (waits for the page, at least ~2.6s for the show) -----
    const bar = $("introBar"), pct = $("introPct");
    const MIN_MS = reduced ? 400 : 2600, start = performance.now();
    let loaded = document.readyState === "complete", shown = 0, ready = false;
    addEventListener("load", () => { loaded = true; });
    (function progress() {
        const t = Math.min(1, (performance.now() - start) / MIN_MS);
        const target = loaded ? t * 100 : Math.min(90, t * 100);
        shown += (target - shown) * 0.15;
        if (loaded && t >= 1 && shown > 99.4) shown = 100;
        bar.style.width = shown + "%";
        pct.textContent = Math.round(shown) + "%";
        if (shown >= 100) {
            ready = true;
            intro.classList.add("ready");
            enter.focus({ preventScroll: true });
            return;
        }
        requestAnimationFrame(progress);
    })();

    // ----- Leave -----
    let left = false;
    function leave() {
        if (left) return;
        left = true;
        try { sessionStorage.setItem("introSeen", "1"); } catch {}
        intro.classList.add("leaving");
        root.classList.remove("intro-lock");
        root.classList.add("intro-done");
        setTimeout(() => { running = false; intro.remove(); }, reduced ? 350 : 1350);
    }
    enter.addEventListener("click", leave);
    $("introSkip").addEventListener("click", leave);
    addEventListener("keydown", (e) => {
        if (left) return;
        if (e.key === "Escape") leave();
        if (ready && (e.key === "Enter" || e.key === " ") && document.activeElement !== enter) { e.preventDefault(); leave(); }
    });

    resize();
    addEventListener("resize", resize);
    if (reduced) { running = false; } else requestAnimationFrame(frame);
})();
