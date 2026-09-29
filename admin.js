// ===== Admin panel =====
// ملاحظة: الموقع ثابت (بدون سيرفر)، لذلك الدخول يتحقق محليًا من بصمة (PBKDF2) لاسم المستخدم وكلمة المرور،
// ولا تُكتب كلمة المرور نفسها في الكود. الحماية الحقيقية للتعديل هي توكن GitHub الخاص بك.

const AUTH = {
    salt: "88198586b319a3a67a772af361fe37d7",
    hash: "57ac7c9b07c178ca6d2e1d8733a6cf6266933724c4149593147fe1ef00a373b4",
    iterations: 150000,
};
const SESSION_HOURS = 2;
const MAX_TRIES = 5, LOCK_SECONDS = 60;

const GROUPS = {
    nav: "القائمة", hero: "الواجهة الرئيسية", about: "من أنا", stats: "الأرقام", journey: "مسيرتي",
    skills: "المهارات", lvl: "مستويات المهارات", lang: "اللغات", works: "الأعمال", contact: "التواصل",
    form: "نموذج الرسالة", footer: "التذييل",
};
const PROJECTS = [
    { id: "w1", img: "assets/imgs/landingPage.png", name: "works.w1.t" },
    { id: "w2", img: "assets/imgs/webApp.png", name: "works.w2.t" },
    { id: "w3", img: "assets/imgs/app.png", name: "works.w3.t" },
];
const SKILLS = [
    { id: "html", name: "HTML5" }, { id: "css", name: "CSS3" },
    { id: "js", name: "JavaScript" }, { id: "git", name: "Git & GitHub" },
];
const DEFAULT_ROLES = {
    ar: ["مبرمج طموح", "مطوّر ويب", "متعلّم لا يتوقف", "صانع أفكار"],
    en: ["Aspiring Developer", "Web Developer", "Lifelong Learner", "Software Engineer"],
};
const DEFAULT_CONTACT = { email: "Alawadiaref12@gmail.com", phone: "+966 55 724 3832", whatsapp: "966557243832" };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const ls = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
    del: (k) => { try { localStorage.removeItem(k); } catch {} },
};
const ss = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
    del: (k) => { try { sessionStorage.removeItem(k); } catch {} },
};

document.documentElement.dataset.theme = ls.get("theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
}

// ================= Login =================
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

async function verify(user, pass) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${user}:${pass}`), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: fromHex(AUTH.salt), iterations: AUTH.iterations, hash: "SHA-256" }, key, 256);
    return hex(bits) === AUTH.hash;
}

function isLoggedIn() {
    return +(ss.get("adminUntil") || 0) > Date.now();
}

$("#togglePass").addEventListener("click", () => {
    const i = $("#loginForm [name=pass]");
    i.type = i.type === "password" ? "text" : "password";
});

$("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#loginErr"), btn = $("#loginBtn"), card = e.target;
    const lockedUntil = +(ls.get("adminLock") || 0);
    if (lockedUntil > Date.now()) {
        err.textContent = `محاولات كثيرة، انتظر ${Math.ceil((lockedUntil - Date.now()) / 1000)} ثانية`;
        return;
    }
    btn.disabled = true;
    btn.textContent = "جارٍ التحقق…";
    const f = new FormData(card);
    let ok = false;
    try { ok = await verify(f.get("user").trim(), f.get("pass")); } catch { err.textContent = "المتصفح لا يدعم التحقق الآمن (افتح الصفحة عبر https)"; }
    btn.disabled = false;
    btn.textContent = "دخول";
    if (ok) {
        ls.del("adminTries");
        ss.set("adminUntil", Date.now() + SESSION_HOURS * 3600e3);
        card.reset();
        err.textContent = "";
        openDashboard();
    } else if (!err.textContent.includes("https")) {
        const tries = +(ls.get("adminTries") || 0) + 1;
        ls.set("adminTries", tries);
        if (tries >= MAX_TRIES) {
            ls.set("adminLock", Date.now() + LOCK_SECONDS * 1000);
            ls.set("adminTries", 0);
            err.textContent = `تم القفل ${LOCK_SECONDS} ثانية بسبب محاولات خاطئة`;
        } else {
            err.textContent = `بيانات الدخول غير صحيحة (${MAX_TRIES - tries} محاولات متبقية)`;
        }
        card.classList.remove("shake");
        void card.offsetWidth;
        card.classList.add("shake");
    }
});

$("#logout").addEventListener("click", () => {
    if (dirty && !confirm("لديك تغييرات غير منشورة. خروج على أي حال؟")) return;
    ss.del("adminUntil");
    location.reload();
});

// ================= Data =================
const DEF = { ar: {}, en: { ...window.EN_TEXT }, skills: {} };
let content = {};
let dirty = false;

async function loadDefaults() {
    const html = await (await fetch("index.html", { cache: "no-store" })).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    $$("[data-i18n]", doc).forEach((el) => { DEF.ar[el.dataset.i18n] ??= el.textContent; });
    DEF.ar["works.live"] = "متاح الآن";
    $$("[data-skill]", doc).forEach((el) => {
        DEF.skills[el.dataset.skill] = parseInt(el.style.getPropertyValue("--w"), 10) || 0;
    });
}

async function loadContent() {
    try {
        const res = await fetch("data/content.json", { cache: "no-store" });
        if (res.ok) return await res.json();
    } catch {}
    return {};
}

function normalize(c) {
    c = c && typeof c === "object" ? c : {};
    c.text ??= {};
    c.text.ar ??= {};
    c.text.en ??= {};
    c.roles ??= {};
    c.contact ??= {};
    c.projects ??= {};
    c.skills ??= {};
    return c;
}

function setDirty(v = true) {
    dirty = v;
    const s = $("#status");
    s.textContent = v ? "● تغييرات غير منشورة" : "✓ كل شيء محفوظ";
    s.classList.toggle("dirty", v);
    if (v) ls.set("contentDraft", JSON.stringify(clean(content)));
}

// يحذف القيم المطابقة للافتراضي حتى يبقى الملف صغيرًا
function clean(c) {
    const out = { text: { ar: {}, en: {} }, roles: {}, contact: {}, projects: {}, skills: {} };
    for (const l of ["ar", "en"]) {
        for (const [k, v] of Object.entries(c.text[l])) if (v !== DEF[l][k]) out.text[l][k] = v;
        if (c.roles[l]?.length && c.roles[l].join("\n") !== DEFAULT_ROLES[l].join("\n")) out.roles[l] = c.roles[l];
    }
    for (const [k, v] of Object.entries(c.contact)) if (v && v !== DEFAULT_CONTACT[k]) out.contact[k] = v;
    for (const [k, p] of Object.entries(c.projects)) if (p.url || p.live) out.projects[k] = { url: p.url || "", live: !!p.live };
    for (const [k, v] of Object.entries(c.skills)) if (+v !== DEF.skills[k]) out.skills[k] = +v;
    return out;
}

// ================= Render =================
function renderTexts() {
    const list = $("#textsList");
    list.textContent = "";
    const byGroup = {};
    Object.keys(DEF.ar).forEach((k) => (byGroup[k.split(".")[0]] ??= []).push(k));

    const sel = $("#groupFilter");
    if (sel.options.length === 1) {
        Object.keys(byGroup).forEach((g) => sel.add(new Option(GROUPS[g] || g, g)));
    }

    for (const [g, keys] of Object.entries(byGroup)) {
        const box = document.createElement("div");
        box.className = "group";
        box.dataset.group = g;
        const h = document.createElement("h3");
        h.textContent = GROUPS[g] || g;
        box.append(h);

        keys.forEach((k) => {
            const item = document.createElement("div");
            item.className = "item";
            item.dataset.key = k;

            const head = document.createElement("div");
            head.className = "item__key";
            const keyName = document.createElement("span");
            keyName.textContent = k;
            const reset = document.createElement("button");
            reset.className = "item__reset";
            reset.type = "button";
            reset.textContent = "إرجاع الافتراضي";
            head.append(keyName, reset);

            const grid = document.createElement("div");
            grid.className = "grid2";
            const areas = ["ar", "en"].map((l) => {
                const wrap = document.createElement("label");
                const tag = document.createElement("span");
                tag.className = "lang-tag";
                tag.textContent = l === "ar" ? "عربي" : "English";
                const ta = document.createElement("textarea");
                const val = content.text[l][k] ?? DEF[l][k] ?? "";
                ta.value = val;
                ta.rows = Math.min(6, Math.max(1, Math.ceil(val.length / 55)));
                ta.dir = l === "ar" ? "rtl" : "ltr";
                ta.addEventListener("input", () => {
                    content.text[l][k] = ta.value;
                    markItem(item, k);
                    setDirty();
                });
                wrap.append(tag, ta);
                grid.append(wrap);
                return ta;
            });

            reset.addEventListener("click", () => {
                ["ar", "en"].forEach((l, i) => { delete content.text[l][k]; areas[i].value = DEF[l][k] ?? ""; });
                markItem(item, k);
                setDirty();
            });

            item.append(head, grid);
            markItem(item, k);
            box.append(item);
        });
        list.append(box);
    }
    filterTexts();
}

function markItem(item, k) {
    const changed = ["ar", "en"].some((l) => content.text[l][k] != null && content.text[l][k] !== DEF[l][k]);
    item.classList.toggle("changed", changed);
}

function filterTexts() {
    const q = $("#search").value.trim().toLowerCase();
    const g = $("#groupFilter").value;
    $$("#textsList .group").forEach((box) => {
        let any = false;
        $$(".item", box).forEach((item) => {
            const txt = item.dataset.key + " " + $$("textarea", item).map((t) => t.value).join(" ");
            const show = (!g || box.dataset.group === g) && (!q || txt.toLowerCase().includes(q));
            item.hidden = !show;
            any ||= show;
        });
        box.hidden = !any;
    });
}
$("#search").addEventListener("input", filterTexts);
$("#groupFilter").addEventListener("change", filterTexts);

function renderRoles() {
    [["ar", "#rolesAr"], ["en", "#rolesEn"]].forEach(([l, id]) => {
        const ta = $(id);
        ta.value = (content.roles[l]?.length ? content.roles[l] : DEFAULT_ROLES[l]).join("\n");
        ta.oninput = () => {
            content.roles[l] = ta.value.split("\n").map((s) => s.trim()).filter(Boolean);
            setDirty();
        };
    });
}

function renderContact() {
    [["email", "#cEmail"], ["phone", "#cPhone"], ["whatsapp", "#cWhats"]].forEach(([k, id]) => {
        const i = $(id);
        i.value = content.contact[k] || DEFAULT_CONTACT[k];
        i.oninput = () => { content.contact[k] = i.value.trim(); setDirty(); };
    });
}

function renderProjects() {
    const list = $("#projectsList");
    list.textContent = "";
    PROJECTS.forEach((p) => {
        const data = (content.projects[p.id] ??= { url: "", live: false });
        const box = document.createElement("div");
        box.className = "card-box";

        const img = document.createElement("img");
        img.src = p.img;
        img.alt = "";
        const h = document.createElement("h3");
        h.textContent = content.text.ar[p.name] ?? DEF.ar[p.name];

        const f = document.createElement("label");
        f.className = "field";
        const fs = document.createElement("span");
        fs.textContent = "رابط المشروع (https://…)";
        const url = document.createElement("input");
        url.type = "url";
        url.dir = "ltr";
        url.placeholder = "https://";
        url.value = data.url || "";
        url.addEventListener("input", () => { data.url = url.value.trim(); setDirty(); });
        f.append(fs, url);

        const c = document.createElement("label");
        c.className = "check";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!data.live;
        cb.addEventListener("change", () => { data.live = cb.checked; setDirty(); });
        c.append(cb, " المشروع متاح الآن (بدل «قريبًا»)");

        box.append(img, h, f, c);
        list.append(box);
    });
}

function renderSkills() {
    const list = $("#skillsList");
    list.textContent = "";
    SKILLS.forEach((s) => {
        const box = document.createElement("div");
        box.className = "card-box";
        const h = document.createElement("h3");
        h.textContent = s.name;
        const row = document.createElement("div");
        row.className = "range-row";
        const r = document.createElement("input");
        r.type = "range";
        r.min = 0;
        r.max = 100;
        r.step = 5;
        r.value = content.skills[s.id] ?? DEF.skills[s.id] ?? 0;
        const out = document.createElement("output");
        out.textContent = r.value + "%";
        r.addEventListener("input", () => {
            content.skills[s.id] = +r.value;
            out.textContent = r.value + "%";
            setDirty();
        });
        row.append(r, out);
        box.append(h, row);
        list.append(box);
    });
}

function renderAll() {
    renderTexts();
    renderRoles();
    renderContact();
    renderProjects();
    renderSkills();
}

// ================= Tabs =================
$$(".side__nav button").forEach((b) => b.addEventListener("click", () => {
    $$(".side__nav button").forEach((x) => x.classList.toggle("active", x === b));
    $$(".tab").forEach((t) => { t.hidden = t.dataset.panel !== b.dataset.tab; });
    $("#tabTitle").textContent = b.textContent.replace(/^\S+\s/, "");
}));

// ================= GitHub settings =================
const GH_DEFAULTS = { owner: "alawadiaref", repo: "aref1demo", branch: "main" };
function loadGhSettings() {
    let s = {};
    try { s = JSON.parse(ls.get("ghSettings")) || {}; } catch {}
    $("#ghOwner").value = s.owner || GH_DEFAULTS.owner;
    $("#ghRepo").value = s.repo || GH_DEFAULTS.repo;
    $("#ghBranch").value = s.branch || GH_DEFAULTS.branch;
    $("#ghToken").value = ls.get("ghToken") || ss.get("ghToken") || "";
    $("#ghRemember").checked = !!ls.get("ghToken");
}
function saveGhSettings() {
    const s = { owner: $("#ghOwner").value.trim(), repo: $("#ghRepo").value.trim(), branch: $("#ghBranch").value.trim() };
    ls.set("ghSettings", JSON.stringify(s));
    const token = $("#ghToken").value.trim();
    if ($("#ghRemember").checked) { ls.set("ghToken", token); ss.del("ghToken"); }
    else { ls.del("ghToken"); ss.set("ghToken", token); }
    return { ...s, token };
}
["#ghOwner", "#ghRepo", "#ghBranch", "#ghToken"].forEach((id) => $(id).addEventListener("change", saveGhSettings));
$("#ghRemember").addEventListener("change", saveGhSettings);

const b64 = (str) => {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin);
};

async function publish() {
    const gh = saveGhSettings();
    if (!gh.token) {
        $('[data-tab="publish"]').click();
        $("#ghToken").focus();
        toast("أدخل توكن GitHub أولًا");
        return;
    }
    const btn = $("#publishBtn");
    btn.disabled = true;
    btn.textContent = "جارٍ النشر…";
    const api = `https://api.github.com/repos/${encodeURIComponent(gh.owner)}/${encodeURIComponent(gh.repo)}/contents/data/content.json`;
    const headers = { Authorization: `Bearer ${gh.token}`, Accept: "application/vnd.github+json" };
    try {
        let sha;
        const cur = await fetch(`${api}?ref=${encodeURIComponent(gh.branch)}`, { headers, cache: "no-store" });
        if (cur.ok) sha = (await cur.json()).sha;
        else if (cur.status !== 404) throw new Error(cur.status);

        const body = {
            message: "Update site content from admin panel",
            content: b64(JSON.stringify(clean(content), null, 2) + "\n"),
            branch: gh.branch,
            ...(sha && { sha }),
        };
        const res = await fetch(api, { method: "PUT", headers, body: JSON.stringify(body) });
        if (!res.ok) throw new Error(res.status);
        setDirty(false);
        toast("✅ تم النشر! سيتحدث الموقع خلال دقيقة تقريبًا");
    } catch (e) {
        const code = String(e.message);
        const why = code === "401" ? "التوكن غير صحيح أو منتهي"
            : code === "403" || code === "404" ? "التوكن لا يملك صلاحية على هذا المستودع/الفرع"
            : code === "409" ? "تعارض — أعد تحميل الصفحة وحاول مرة أخرى"
            : "تعذر الاتصال بـ GitHub";
        toast(`❌ فشل النشر: ${why} (${code})`);
    } finally {
        btn.disabled = false;
        btn.textContent = "🚀 حفظ ونشر";
    }
}
$("#publishBtn").addEventListener("click", publish);

$("#previewBtn").addEventListener("click", () => {
    ls.set("contentDraft", JSON.stringify(clean(content)));
    window.open("index.html?preview", "_blank");
});

// ================= Backup =================
$("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(clean(content), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "content.json";
    a.click();
    URL.revokeObjectURL(a.href);
});
$("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        content = normalize(JSON.parse(await file.text()));
        renderAll();
        setDirty();
        toast("تم الاستيراد — راجع ثم انشر");
    } catch { toast("الملف غير صالح"); }
    e.target.value = "";
});
$("#resetBtn").addEventListener("click", () => {
    if (!confirm("إرجاع كل النصوص والإعدادات للافتراضي؟ (لن يُنشر حتى تضغط حفظ ونشر)")) return;
    content = normalize({});
    renderAll();
    setDirty();
});

addEventListener("beforeunload", (e) => { if (dirty) e.preventDefault(); });

// ================= Boot =================
async function openDashboard() {
    $("#loginView").hidden = true;
    $("#dashView").hidden = false;
    try {
        await loadDefaults();
    } catch {
        toast("تعذر تحميل الصفحة الرئيسية — افتح لوحة التحكم من الموقع المنشور");
    }
    content = normalize(await loadContent());
    loadGhSettings();
    renderAll();
    setDirty(false);
}

if (isLoggedIn()) openDashboard();
