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

    const ct = c.contact || {};
    if (ct.email) {
        EMAIL = ct.email;
        $("#cEmail").href = "mailto:" + ct.email;
        $("#cEmail .val").textContent = ct.email;
    }
    if (ct.phone) {
        $("#cPhone").href = "tel:" + ct.phone.replace(/[^\d+]/g, "");
        $("#cPhone .val").textContent = ct.phone;
    }
    if (ct.whatsapp) $("#cWhats").href = "https://wa.me/" + ct.whatsapp.replace(/\D/g, "");

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

    Object.entries(c.skills || {}).forEach(([id, v]) => {
        const bar = $(`[data-skill="${id}"]`);
        const n = Math.max(0, Math.min(100, +v));
        if (bar && !isNaN(n)) bar.style.setProperty("--w", n + "%");
    });
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

// ----- Hidden admin entry: 5 quick clicks on the logo -----
let logoClicks = 0, logoTimer;
$("#logo").addEventListener("click", () => {
    logoClicks++;
    clearTimeout(logoTimer);
    logoTimer = setTimeout(() => { logoClicks = 0; }, 1500);
    if (logoClicks >= 5) location.href = "admin.html";
});

$("#year").textContent = new Date().getFullYear();
setLang(lang);
onScroll();
loadContent().then((c) => { if (c) { applyContent(c); setLang(lang); } });
