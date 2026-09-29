// ===== Aref ALawadi — CV site =====
// النصوص العربية الافتراضية في index.html، والإنجليزية في i18n-en.js.
// أي تعديل من صفحة الإدارة يُحفظ في data/content.json ويطبَّق فوقها.

const EN = { ...window.EN_TEXT };

let ROLES = {
    ar: ["مبرمج طموح", "مطوّر ويب", "متعلّم لا يتوقف", "صانع أفكار"],
    en: ["Aspiring Developer", "Web Developer", "Lifelong Learner", "Software Engineer"],
};
const MSG = {
    ar: { copied: "تم نسخ البريد ✅", mail: "جارٍ فتح البريد…" },
    en: { copied: "Email copied ✅", mail: "Opening your email app…" },
};
let EMAIL = "Alawadiaref12@gmail.com";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// ----- Language -----
const AR = {};
$$("[data-i18n]").forEach((el) => { AR[el.dataset.i18n] ??= el.textContent; });
AR["works.live"] = "متاح الآن";
let lang = store.get("lang") || "ar";

function setLang(next) {
    lang = next;
    const dict = lang === "en" ? EN : AR;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
    $$("[data-i18n]").forEach((el) => {
        const v = dict[el.dataset.i18n];
        if (v != null) el.textContent = v;
    });
    $("#langToggle").textContent = lang === "en" ? "ع" : "EN";
    document.title = lang === "en" ? "Aref ALawadi | CV" : "عارف العوادي | السيرة الذاتية";
    store.set("lang", lang);
    restartTyping();
}
$("#langToggle").addEventListener("click", () => setLang(lang === "en" ? "ar" : "en"));

// ----- Theme -----
const root = document.documentElement;
const savedTheme = store.get("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
root.dataset.theme = savedTheme || (prefersDark ? "dark" : "light");
$("#themeToggle").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    store.set("theme", root.dataset.theme);
});

// ----- Typing effect -----
let typeTimer;
function restartTyping() {
    clearTimeout(typeTimer);
    const el = $("#typed");
    const words = ROLES[lang];
    let w = 0, i = 0, deleting = false;
    const tick = () => {
        const word = words[w];
        i += deleting ? -1 : 1;
        el.textContent = word.slice(0, i);
        let delay = deleting ? 45 : 95;
        if (!deleting && i === word.length) { deleting = true; delay = 1600; }
        else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
        typeTimer = setTimeout(tick, delay);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = words[0]; return; }
    tick();
}

// ----- Mobile menu -----
const nav = $("#nav"), menuBtn = $("#menuToggle");
menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
});
$$(".nav a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
}));

// ----- Scroll: header, progress, back-to-top -----
const header = $(".header"), progress = $(".progress"), toTop = $("#toTop");
function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("scrolled", y > 20);
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    toTop.classList.toggle("show", y > 600);
}
addEventListener("scroll", onScroll, { passive: true });
toTop.addEventListener("click", () => scrollTo({ top: 0 }));

// ----- Active nav link -----
const links = $$(".nav a");
const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach((s) => spy.observe(s));

// ----- Reveal + counters -----
function countUp(el) {
    const target = +el.dataset.count;
    let n = 0;
    const step = () => { n++; el.textContent = n; if (n < target) setTimeout(step, 1200 / target); };
    step();
}
const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        $$("[data-count]", e.target).forEach(countUp);
        revealer.unobserve(e.target);
    });
}, { threshold: 0.15 });
$$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 0.1 + "s";
    revealer.observe(el);
});

// ----- Contact -----
function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
}
$("#copyEmail").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(EMAIL); } catch {
        const ta = document.createElement("textarea");
        ta.value = EMAIL; document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove();
    }
    toast(MSG[lang].copied);
});
$("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = `${f.get("message")}\n\n— ${f.get("name")}`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(f.get("subject"))}&body=${encodeURIComponent(body)}`;
    toast(MSG[lang].mail);
});

// ----- Content from admin panel (data/content.json) -----
function applyContent(c) {
    if (!c || typeof c !== "object") return;
    Object.assign(AR, c.text?.ar);
    Object.assign(EN, c.text?.en);
    if (c.roles?.ar?.length) ROLES.ar = c.roles.ar;
    if (c.roles?.en?.length) ROLES.en = c.roles.en;

    renderContacts(c);
    renderSkills(c);
    applyTheme(c.theme);
    window.SITE_COMMANDS = Array.isArray(c.commands) ? c.commands : [];

    renderProjects(c);

    // نسب المهارات القديمة (قبل قائمة المهارات القابلة للتعديل)
    if (!Array.isArray(c.skillsList)) {
        Object.entries(c.skills || {}).forEach(([id, v]) => {
            const bar = $(`[data-skill="${id}"]`);
            const n = Math.max(0, Math.min(100, +v));
            if (bar && !isNaN(n)) bar.style.setProperty("--w", n + "%");
        });
    }
}

const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
};
// نص ثنائي اللغة يتبدل مع زر اللغة
function i18nText(node, key, ar, en) {
    AR[key] = ar || en || "";
    EN[key] = en || ar || "";
    node.dataset.i18n = key;
    node.textContent = (lang === "en" ? EN : AR)[key];
    return node;
}

function renderContacts(c) {
    const TYPES = window.CONTACT_TYPES;
    let list = Array.isArray(c.contacts) ? c.contacts : null;
    if (!list) {   // التوافق مع الإعداد القديم
        const old = c.contact || {};
        list = window.DEFAULT_CONTACTS.map((d) => ({ ...d, value: old[d.type === "whatsapp" ? "whatsapp" : d.type] || d.value }));
    }
    list = list.filter((x) => TYPES[x.type] && (x.value || "").trim());

    const box = $(".contact__cards"), copy = $("#copyEmail");
    $$(".cCard", box).forEach((n) => n.remove());
    list.forEach((x, i) => {
        const T = TYPES[x.type];
        const a = el("a", "cCard");
        a.href = T.href(x.value);
        if (T.blank) { a.target = "_blank"; a.rel = "noopener"; }
        const ico = el("span", "cCard__ico");
        ico.innerHTML = T.icon;   // أيقونات ثابتة من site-data.js
        const txt = el("span");
        const small = i18nText(el("small"), `dyn.contact.${i}`, x.ar || T.ar, x.en || T.en);
        const val = el("b", "val", T.show(x.value));
        val.dir = "ltr";
        txt.append(small, val);
        a.append(ico, txt);
        box.insertBefore(a, copy);
    });

    const firstEmail = list.find((x) => x.type === "email");
    copy.hidden = !firstEmail;
    if (firstEmail) EMAIL = firstEmail.value.trim();
}

function renderSkills(c) {
    if (Array.isArray(c.skillsList)) {
        const ul = $(".bars");
        ul.textContent = "";
        c.skillsList.forEach((s, i) => {
            const n = Math.max(0, Math.min(100, +s.level || 0));
            const li = el("li");
            const head = el("div", "bar-head");
            head.append(el("span", "", s.name || ""), i18nText(el("span", "lvl"), `dyn.skill.${i}`, s.ar, s.en));
            const bar = el("div", "bar");
            const fill = el("i");
            fill.style.setProperty("--w", n + "%");
            bar.append(fill);
            li.append(head, bar);
            ul.append(li);
        });
    }
    if (Array.isArray(c.chips)) {
        const ul = $(".chips");
        ul.textContent = "";
        c.chips.forEach((ch, i) => ul.append(i18nText(el("li"), `dyn.chip.${i}`, ch.ar, ch.en)));
    }
}

// صورة المشروع: ملف من الموقع، صورة مرفوعة (data:image) أو رابط https
const safeImg = (src) => /^(assets\/|data:image\/(png|jpe?g|webp|gif);base64,|https:\/\/)/i.test(src || "");

function renderProjects(c) {
    if (Array.isArray(c.projectsList)) {
        const ul = $(".works__grid");
        ul.textContent = "";
        c.projectsList.forEach((p, i) => {
            const li = el("li", "work reveal in");
            const imgBox = el("div", "work__img");
            if (safeImg(p.image)) {
                const img = el("img");
                img.src = p.image;
                img.alt = p.titleEn || p.titleAr || "";
                img.loading = "lazy";
                imgBox.append(img);
            } else {
                imgBox.classList.add("work__img--empty");
                imgBox.append(el("span", "", (p.titleEn || p.titleAr || "?").trim().charAt(0).toUpperCase()));
            }
            const bodyEl = el("div", "work__body");
            const badge = el("span", "badge" + (p.live ? " badge--live" : ""));
            badge.dataset.i18n = p.live ? "works.live" : "works.soon";
            badge.textContent = (lang === "en" ? EN : AR)[badge.dataset.i18n];
            const tags = el("div", "tags");
            String(p.tags || "").split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => tags.append(el("span", "", t)));
            bodyEl.append(badge,
                i18nText(el("h3"), `dyn.proj.${i}.t`, p.titleAr, p.titleEn),
                i18nText(el("p"), `dyn.proj.${i}.d`, p.descAr, p.descEn),
                tags);
            if (/^https?:\/\//i.test(p.url || "")) {
                const a = el("a", "work__link");
                a.href = p.url;
                a.target = "_blank";
                a.rel = "noopener";
                a.append(i18nText(el("span"), "works.view", AR["works.view"], EN["works.view"]), " ↗");
                bodyEl.append(a);
            }
            li.append(imgBox, bodyEl);
            ul.append(li);
        });
        return;
    }
    // الإعداد القديم: رابط وحالة لكل مشروع من المشاريع الثلاثة
    Object.entries(c.projects || {}).forEach(([id, p]) => {
        const card = $(`[data-project="${id}"]`);
        if (!card) return;
        const link = $(".work__link", card);
        const safe = /^https?:\/\//i.test(p.url || "");
        link.hidden = !safe;
        if (safe) link.href = p.url;
        $(".badge", card).dataset.i18n = p.live ? "works.live" : "works.soon";
        $(".badge", card).classList.toggle("badge--live", !!p.live);
    });
}

// شريط وضع المعاينة مع زر الرجوع للوحة التحكم
if (new URLSearchParams(location.search).has("preview")) {
    const bar = el("div", "preview-bar");
    bar.setAttribute("role", "status");
    const back = el("a", "preview-bar__btn");
    back.href = "admin.html";
    back.append(i18nText(el("span"), "preview.back", "رجوع للوحة التحكم", "Back to admin"));
    bar.append(i18nText(el("span", "preview-bar__txt"), "preview.note", "👁 وضع المعاينة — التعديلات غير منشورة بعد", "👁 Preview mode — changes are not published yet"), back);
    document.body.append(bar);
    document.documentElement.classList.add("is-preview");
}

function applyTheme(t) {
    const css = t ? window.buildThemeCSS(t.primary, t.accent) : "";
    let tag = document.getElementById("themeColors");
    if (!tag) { tag = document.createElement("style"); tag.id = "themeColors"; document.head.append(tag); }
    tag.textContent = css;
    store.set("themeCSS", css);   // يُطبَّق فورًا في الزيارة القادمة
    if (t?.primary) $('meta[name="theme-color"]')?.setAttribute("content", t.primary);
}

async function loadContent() {
    // ?preview يعرض المسودة المحفوظة من صفحة الإدارة قبل النشر
    if (new URLSearchParams(location.search).has("preview")) {
        try { const draft = JSON.parse(store.get("contentDraft")); if (draft) return draft; } catch {}
    }
    try {
        const res = await fetch("data/content.json", { cache: "no-store" });
        if (res.ok) return await res.json();
    } catch {}
    return null;
}

// ----- Hidden admin entry: two quick taps on the logo, then a long press -----
const logo = $("#logo");
const TAP_GAP = 1200, HOLD_MS = 800;
let taps = 0, lastTap = 0, downAt = 0, holdTimer = null, unlocked = false;

function resetLogo() {
    clearTimeout(holdTimer);
    holdTimer = null;
    logo.classList.remove("logo--hold");
}

logo.addEventListener("pointerdown", () => {
    downAt = Date.now();
    if (Date.now() - lastTap > TAP_GAP) taps = 0;
    if (taps !== 2) return;
    // الضغطة الثالثة: وميض خفيف أثناء الضغط المطوّل
    logo.classList.add("logo--hold");
    holdTimer = setTimeout(() => {
        unlocked = true;
        resetLogo();
        document.body.classList.add("admin-flash");
        setTimeout(() => { location.href = "admin.html"; }, 450);
    }, HOLD_MS);
});

function onRelease() {
    if (!downAt) return;
    const held = Date.now() - downAt;
    downAt = 0;
    if (holdTimer) { resetLogo(); taps = 0; return; }   // الضغطة الثالثة لم تكتمل
    if (held < 400) { taps++; lastTap = Date.now(); } else taps = 0;
}
logo.addEventListener("pointerup", onRelease);
logo.addEventListener("pointercancel", () => { downAt = 0; resetLogo(); taps = 0; });
logo.addEventListener("pointerleave", () => { if (holdTimer) { downAt = 0; resetLogo(); taps = 0; } });
logo.addEventListener("contextmenu", (e) => e.preventDefault());
logo.addEventListener("click", (e) => { if (taps || unlocked) e.preventDefault(); });

$("#year").textContent = new Date().getFullYear();
setLang(lang);
onScroll();
loadContent().then((c) => {
    if (c) { applyContent(c); setLang(lang); }
    window.dispatchEvent(new Event("site:content"));
});
