// ===== Interactive layer: terminal, tilt, magnetic buttons, cursor, parallax =====
(() => {
    const q = (s, el = document) => el.querySelector(s);
    const qa = (s, el = document) => [...el.querySelectorAll(s)];
    const txt = (s, el = document) => (q(s, el)?.textContent || "").trim();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const isAr = () => document.documentElement.lang !== "en";

    // =====================================================
    // Terminal
    // =====================================================
    const body = q("#termBody"), form = q("#termForm"), input = q("#termInput"), chips = q("#termChips");
    if (body && form) {
        const history = [];
        let hIndex = 0;

        const L = {
            ar: {
                welcome: "مرحبًا بك في ترمنال عارف 👋",
                tip: "اكتب help أو اضغط على أحد الأوامر تحت.",
                notFound: (c) => `الأمر غير موجود: ${c} — اكتب help لعرض الأوامر`,
                help: {
                    about: "من أنا", skills: "مهاراتي", journey: "مسيرتي وخبرتي", projects: "أعمالي",
                    certs: "شهاداتي ودوراتي", contact: "طرق التواصل", cv: "تحميل السيرة الذاتية", hire: "وظّفني 😉",
                    theme: "تبديل الوضع الليلي/النهاري", lang: "تبديل اللغة", date: "التاريخ والوقت", clear: "مسح الشاشة",
                },
                hello: "وعليكم السلام! نورت الترمنال ✨",
                sudo: "محاولة حلوة 😄 لكن الصلاحيات عند عارف بس.",
                hire: "قرار ممتاز! 🎉 أنقلك الحين لقسم التواصل…",
                theme: "تم تبديل الوضع ✔", cvText: "تحميل السيرة الذاتية (PDF)",
                email: "البريد", phone: "الجوال", wa: "واتساب",
                soon: "قريبًا",
            },
            en: {
                welcome: "Welcome to Aref's terminal 👋",
                tip: "Type help, or tap one of the commands below.",
                notFound: (c) => `command not found: ${c} — type help to list commands`,
                help: {
                    about: "who I am", skills: "my skills", journey: "my journey & experience", projects: "my works",
                    certs: "my certificates & courses", contact: "how to reach me", cv: "download my CV", hire: "hire me 😉",
                    theme: "toggle dark/light mode", lang: "switch language", date: "date & time", clear: "clear the screen",
                },
                hello: "Hey there! Glad you stopped by ✨",
                sudo: "Nice try 😄 only Aref has root here.",
                hire: "Great choice! 🎉 Taking you to the contact section…",
                theme: "Theme switched ✔", cvText: "Download CV (PDF)",
                email: "Email", phone: "Phone", wa: "WhatsApp",
                soon: "Coming soon",
            },
        };
        const t = () => L[isAr() ? "ar" : "en"];

        function line(content, cls = "", rtl = isAr()) {
            const d = document.createElement("div");
            d.className = "term__line " + cls;
            if (rtl) d.dir = "rtl";
            if (content instanceof Node) d.append(content); else d.textContent = content;
            body.append(d);
            body.scrollTop = body.scrollHeight;
            return d;
        }
        const kv = (k, v) => {
            const f = document.createDocumentFragment();
            const s = document.createElement("span");
            s.className = /[\u0600-\u06FF]/.test(k) ? "k ar" : "k";
            s.textContent = k;
            f.append(s, " " + v);
            return f;
        };
        const link = (href, label, blank = true) => {
            const a = document.createElement("a");
            a.href = href;
            a.textContent = label;
            if (blank) { a.target = "_blank"; a.rel = "noopener"; }
            return a;
        };

        const COMMANDS = {
            help() {
                const h = t().help;
                Object.entries(h).forEach(([k, v]) => line(kv(k, "— " + v), "", false));
                const mine = custom();
                if (mine.length) {
                    line("—".repeat(24), "dim", false);
                    mine.forEach((c) => line(kv(c.name, "— " + (isAr() ? c.descAr || c.descEn : c.descEn || c.descAr || "")), "", false));
                }
            },
            about() {
                line(txt('[data-i18n="hero.name"]'), "accent");
                line(txt('[data-i18n="about.p1"]'));
                line(txt('[data-i18n="about.quote"]'), "warm");
            },
            skills() {
                qa(".bars li").forEach((li) => {
                    const name = txt(".bar-head span", li), lvl = txt(".lvl", li);
                    const w = parseInt(q(".bar i", li).style.getPropertyValue("--w"), 10) || 0;
                    const blocks = "█".repeat(Math.round(w / 10)) + "░".repeat(10 - Math.round(w / 10));
                    line(kv(name.padEnd(12, " "), `${blocks} ${w}%  ${lvl}`), "", false);
                });
                line(qa(".chips li").map((li) => li.textContent.trim()).join("  ·  "), "dim");
            },
            journey() {
                qa(".tl-item").forEach((it) => {
                    line(`${txt(".tl-date", it)}  —  ${txt("h4", it)}`, "accent");
                    const place = txt(".tl-place", it);
                    if (place) line("   " + place, "dim");
                });
            },
            projects() {
                qa("[data-project]").forEach((p) => {
                    const a = q(".work__link", p);
                    const row = line(`▸ ${txt("h3", p)}  [${txt(".badge", p)}]  ${txt("p", p)}`);
                    if (a && !a.hidden) { row.append("  "); row.append(link(a.href, "↗")); }
                });
            },
            contact() {
                qa(".contact__cards .cCard").forEach((a) => {
                    line(kv(txt("small", a), ""), "", false).append(link(a.href, txt(".val", a), a.target === "_blank"));
                });
            },
            certs() {
                const cards = qa("#certsGrid .cert");
                if (q("#certs").hidden || !cards.length) { line(isAr() ? "لا توجد شهادات منشورة حاليًا — قريبًا 🎓" : "No certificates published yet — coming soon 🎓", "dim"); return; }
                cards.forEach((card) => {
                    const row = line(`${txt(".cert__ico", card)} ${txt("h3", card)}${txt(".cert__issuer", card) ? " — " + txt(".cert__issuer", card) : ""}${txt(".cert__date", card) ? "  (" + txt(".cert__date", card) + ")" : ""}`);
                    const a = q(".work__link", card);
                    if (a) { row.append("  "); row.append(link(a.href, "↗")); }
                });
            },
            cv() { line(link("assets/Aref-Alawadi-CV.pdf", "⬇ " + t().cvText)); },
            hire() {
                line(t().hire, "ok");
                setTimeout(() => q("#contactMe").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }), 700);
            },
            theme() { q("#themeToggle").click(); line(t().theme, "ok"); },
            lang() { q("#langToggle").click(); },
            date() { line(new Date().toLocaleString(isAr() ? "ar-SA" : "en-GB"), "", false); },
            clear() { body.textContent = ""; },
            hello() { line(t().hello, "ok"); },
            whoami() { COMMANDS.about(); },
            sudo() { line(t().sudo, "warm"); },
        };
        const ALIASES = {
            "مساعدة": "help", "من": "about", "مهارات": "skills", "مسيرة": "journey", "مسيرتي": "journey",
            "مشاريع": "projects", "اعمال": "projects", "أعمال": "projects", "تواصل": "contact", "سيرة": "cv",
            "وظفني": "hire", "ثيم": "theme", "لغة": "lang", "تاريخ": "date", "مسح": "clear",
            "شهادات": "certs", "شهاداتي": "certs", "دورات": "certs", "courses": "certs", "certificates": "certs",
            "سلام": "hello", "مرحبا": "hello", "هلا": "hello", "hi": "hello", "hey": "hello",
            "السلام": "hello", "experience": "journey", "works": "projects", "ls": "help", "cls": "clear",
        };

        // أوامر مضافة من لوحة التحكم
        const custom = () => (window.SITE_COMMANDS || []).filter((c) => c && c.name);
        function findCustom(word) {
            return custom().find((c) => c.name.toLowerCase() === word ||
                (c.aliases || "").split(",").map((a) => a.trim().toLowerCase()).filter(Boolean).includes(word));
        }
        function reply(text) {
            String(text || "").split("\n").forEach((ln) => {
                const d = line("");
                ln.split(/(https?:\/\/\S+)/g).forEach((part, i) => {
                    d.append(i % 2 ? link(part, part) : part);
                });
            });
        }

        function run(raw) {
            const cmd = raw.trim();
            if (!cmd) return;
            const echo = document.createElement("span");
            echo.className = "term__cmd";
            echo.innerHTML = "aref@studio<b>:~$</b> ";
            echo.append(cmd);
            line(echo, "", false);
            history.push(cmd);
            hIndex = history.length;

            const word = cmd.toLowerCase().split(/\s+/)[0];
            const mine = findCustom(word);
            const name = COMMANDS[word] ? word : ALIASES[word];
            if (mine) reply(isAr() ? mine.ar || mine.en : mine.en || mine.ar);
            else if (name) COMMANDS[name]();
            else line(t().notFound(word), "warm");
        }

        function welcome() {
            body.textContent = "";
            line(t().welcome, "accent");
            line(t().tip, "dim");
        }

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            run(input.value);
            input.value = "";
        });
        input.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp" && hIndex > 0) { input.value = history[--hIndex]; e.preventDefault(); }
            else if (e.key === "ArrowDown") { hIndex = Math.min(history.length, hIndex + 1); input.value = history[hIndex] || ""; e.preventDefault(); }
            else if (e.key === "Tab") {
                const v = input.value.trim().toLowerCase();
                const m = v && Object.keys(COMMANDS).find((c) => c.startsWith(v));
                if (m) { input.value = m; e.preventDefault(); }
            }
        });
        q("#term").addEventListener("click", (e) => {
            if (e.target.tagName !== "A" && !getSelection().toString()) input.focus({ preventScroll: true });
        });

        ["help", "about", "skills", "journey", "projects", "contact", "hire", "theme", "clear"].forEach((c) => {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = c;
            b.addEventListener("click", () => { run(c); });
            chips.append(b);
        });

        function customChips() {
            qa("button.custom", chips).forEach((b) => b.remove());
            custom().filter((c) => c.chip).forEach((c) => {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "custom";
                b.textContent = c.name;
                b.addEventListener("click", () => run(c.name));
                chips.append(b);
            });
        }
        window.addEventListener("site:content", customChips);
        customChips();   // in case the content loaded before this script ran

        welcome();
        // Reprint the welcome text when the language changes (if the visitor hasn't used the terminal yet)
        new MutationObserver(() => { if (!history.length) welcome(); })
            .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    }

    // =====================================================
    // Timeline fills as you scroll
    // =====================================================
    const timelines = qa(".timeline");
    function fillTimelines() {
        const vh = innerHeight;
        timelines.forEach((tl) => {
            const r = tl.getBoundingClientRect();
            const p = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / r.height));
            tl.style.setProperty("--fill", p.toFixed(3));
        });
    }
    addEventListener("scroll", fillTimelines, { passive: true });
    addEventListener("resize", fillTimelines);
    fillTimelines();

    // =====================================================
    // Ripple on buttons (all devices)
    // =====================================================
    document.addEventListener("pointerdown", (e) => {
        const b = e.target.closest(".btn, .copy-btn, .tool-btn");
        if (!b || reduced) return;
        const r = b.getBoundingClientRect();
        const s = document.createElement("span");
        s.className = "ripple";
        s.style.left = e.clientX - r.left + "px";
        s.style.top = e.clientY - r.top + "px";
        b.append(s);
        setTimeout(() => s.remove(), 650);
    });

    if (reduced || !finePointer) return;   // the rest is for mouse users

    // =====================================================
    // 3D tilt + glare on cards
    // =====================================================
    const TILT = ".work, .card, .stat, .cCard, .cert";
    let tilted = null;
    const untilt = () => {
        if (!tilted) return;
        tilted.classList.remove("tilting");
        tilted.style.transform = "";
        tilted = null;
    };
    document.addEventListener("pointermove", (e) => {
        const el = e.target.closest?.(TILT);
        if (el !== tilted) untilt();
        if (!el) return;
        tilted = el;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add("tilt", "tilting");
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg) translateY(-6px)`;
        el.style.setProperty("--mx", x * 100 + "%");
        el.style.setProperty("--my", y * 100 + "%");
    });
    document.addEventListener("pointerleave", untilt);

    // =====================================================
    // Magnetic buttons
    // =====================================================
    qa(".btn, .copy-btn").forEach((b) => {
        b.addEventListener("pointermove", (e) => {
            const r = b.getBoundingClientRect();
            b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.18}px ${(e.clientY - r.top - r.height / 2) * 0.3}px`;
        });
        b.addEventListener("pointerleave", () => { b.style.translate = ""; });
    });

    // =====================================================
    // Hero parallax
    // =====================================================
    const hero = q(".hero"), art = q(".hero__art"), doodles = qa(".doodles span");
    hero?.addEventListener("pointermove", (e) => {
        const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
        if (art) art.style.translate = `${x * -24}px ${y * -18}px`;
        doodles.forEach((d, i) => { d.style.translate = `${x * (i + 2) * 12}px ${y * (i + 2) * 10}px`; });
    });
    hero?.addEventListener("pointerleave", () => {
        if (art) art.style.translate = "";
        doodles.forEach((d) => { d.style.translate = ""; });
    });

    // =====================================================
    // Cursor glow
    // =====================================================
    const dot = document.createElement("div"), ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.append(dot, ring);
    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        mx = e.clientX; my = e.clientY;
        document.documentElement.classList.add("cursor-on");
        ring.classList.toggle("is-link", !!e.target.closest("a, button, input, textarea, label, .work, .chips li"));
    });
    addEventListener("pointerdown", () => ring.classList.add("is-down"));
    addEventListener("pointerup", () => ring.classList.remove("is-down"));
    document.addEventListener("pointerleave", () => document.documentElement.classList.remove("cursor-on"));
    (function loop() {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        dot.style.transform = `translate(${mx}px, ${my}px)`;
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
        requestAnimationFrame(loop);
    })();
})();
