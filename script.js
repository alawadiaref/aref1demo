// ===== Aref ALawadi — CV site =====
// النصوص العربية موجودة في index.html، والإنجليزية هنا.

const EN = {
    "nav.about": "About me",
    "nav.journey": "Journey",
    "nav.skills": "Skills",
    "nav.works": "My Works",
    "nav.contact": "Contact Me",

    "hero.hello": "Hello there 👋",
    "hero.im": "I'm",
    "hero.name": "Aref ALawadi",
    "hero.lead": "An ambitious self-taught developer building his future line by line — because programming doesn't need a degree, it needs passion and persistence.",
    "hero.hire": "Hire Me",
    "hero.cv": "Download CV",
    "hero.loc": "Saudi Arabia",
    "hero.open": "Open to work & learning",

    "about.t1": "About",
    "about.t2": "me",
    "about.p1": "Hey, I'm Aref Ali ALawadi — a young Yemeni living in Saudi Arabia, my second home. I love programming and I work every day on improving myself and sharpening my skills.",
    "about.p2": "I've worked with my hands in construction, carpentry and metalwork, then as a loading worker. Hard jobs that taught me patience and discipline — but they were never my dream. My dream is to become an experienced developer who builds his own websites and apps under his own name, and to prove that anyone who wants to learn can — a degree is not the only path.",
    "about.quote": "“I designed this website myself to grow my experience and knowledge.”",
    "stats.years": "years of hard work",
    "stats.projects": "upcoming projects",
    "stats.langs": "languages: Arabic & English",

    "journey.t1": "My",
    "journey.t2": "Journey",
    "journey.sub": "Every step on the road was a lesson",
    "journey.exp": "Experience",
    "journey.edu": "Education",
    "journey.now": "Now",
    "journey.e0.t": "Self-taught Programming",
    "journey.e0.d": "Started my web development journey: built my personal website with HTML & CSS, and I'm working on my first projects (a landing page, a web app and a mobile app).",
    "journey.e1.t": "Loading & Unloading Worker",
    "journey.e1.p": "Saudi Arabia",
    "journey.e1.d": "Moved to my second home and improved my income — but my ambition is bigger: to be a developer building my own websites and apps.",
    "journey.e2.t": "Freelance Work",
    "journey.e2.p": "Yemen",
    "journey.e2.d": "Worked in construction, carpentry and metalwork. Tough work that made me patient, responsible and someone who never gives up.",
    "journey.d1.t": "Aden University — Computer Engineering & Computer Science (IT)",
    "journey.d1.d": "Studied the first year of the major, then stopped for personal reasons — but my passion for computers never stopped.",
    "journey.d2.t": "High School — Science Track",
    "journey.d2.p": "Ibn Al-Harawi High School — Saudi Arabia",
    "journey.d2.d": "Graduated with a “Very Good” grade.",
    "journey.belief": "Learning isn't only about degrees or universities — whoever wants to learn, can.",

    "skills.t1": "Skills",
    "skills.t2": "& Tools",
    "skills.sub": "What I have today, and what I'm learning now",
    "skills.tech": "Technical",
    "skills.personal": "Personal",
    "skills.languages": "Languages",
    "lvl.good": "Good",
    "lvl.learning": "Learning now",
    "skills.s1": "⚡ Fast learner",
    "skills.s2": "🧠 Quick to understand",
    "skills.s3": "💪 Patient & hardworking",
    "skills.s4": "🎯 Ambitious, never quits",
    "skills.s5": "🛠️ Real field experience",
    "skills.s6": "🌱 Always improving",
    "lang.ar": "Arabic",
    "lang.native": "Native",
    "lang.en": "English",
    "lang.mid": "Good & improving",
    "skills.hobby": "🎯 In my free time: I work on developing my personality and style.",

    "works.t1": "my upcoming",
    "works.t2": "Works",
    "works.sub": "Projects I'm working on right now — stay tuned",
    "works.soon": "Coming soon",
    "works.w1.t": "Landing Page",
    "works.w1.d": "A modern, fast landing page that fits every screen.",
    "works.w2.t": "Web App",
    "works.w2.d": "An interactive browser app with a smooth user experience.",
    "works.w3.t": "Mobile App",
    "works.w3.d": "An app under my own name — the dream I'm working for.",

    "contact.t1": "Contact",
    "contact.t2": "me",
    "contact.sub": "Have a job opportunity or a project idea? I'd love to hear from you",
    "contact.email": "Email",
    "contact.phone": "Phone",
    "contact.wa": "WhatsApp",
    "contact.waCta": "Message me directly",
    "contact.copy": "Copy email",
    "form.name": "Name",
    "form.subject": "Subject",
    "form.msg": "Your message",
    "form.send": "Send message",
    "form.note": "Your email app will open with the message ready.",

    "footer.built": "Designed & built by",
};

const ROLES = {
    ar: ["مبرمج طموح", "مطوّر ويب", "متعلّم لا يتوقف", "صانع أفكار"],
    en: ["Aspiring Developer", "Web Developer", "Lifelong Learner", "Software Engineer"],
};
const MSG = {
    ar: { copied: "تم نسخ البريد ✅", mail: "جارٍ فتح البريد…" },
    en: { copied: "Email copied ✅", mail: "Opening your email app…" },
};
const EMAIL = "Alawadiaref12@gmail.com";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// ----- Language -----
const AR = {};
$$("[data-i18n]").forEach((el) => { AR[el.dataset.i18n] ??= el.textContent; });
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

$("#year").textContent = new Date().getFullYear();
setLang(lang);
onScroll();
