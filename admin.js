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
    form: "نموذج الرسالة", footer: "التذييل", term: "الترمنال التفاعلي", certs: "الشهادات والدورات",
};
const DEFAULT_ROLES = {
    ar: ["مبرمج طموح", "مطوّر ويب", "متعلّم لا يتوقف", "صانع أفكار"],
    en: ["Aspiring Developer", "Web Developer", "Lifelong Learner", "Software Engineer"],
};
const ORIGINAL_COLORS = { primary: "#5e9eae", accent: "#7c4e4e" };
// نصوص تُدار من قوائم المهارات والتواصل بدل تبويب النصوص
const LIST_KEYS = /^(skills\.s\d+|lvl\..+|contact\.(email|phone|wa|waCta)|works\.w\d+\.[td]|preview\..+)$/;

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
const DEF = { ar: {}, en: { ...window.EN_TEXT }, skills: {}, skillsList: [], chips: [], contacts: window.DEFAULT_CONTACTS, projectsList: [] };
let content = {};
let dirty = false;
const copy = (x) => JSON.parse(JSON.stringify(x));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function loadDefaults() {
    const html = await (await fetch("index.html", { cache: "no-store" })).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    $$("[data-i18n]", doc).forEach((el) => { DEF.ar[el.dataset.i18n] ??= el.textContent; });
    DEF.ar["works.live"] = "متاح الآن";
    DEF.skillsList = $$(".bars li", doc).map((li) => {
        const fill = $("[data-skill]", li), key = $(".lvl", li).dataset.i18n;
        const level = parseInt(fill.style.getPropertyValue("--w"), 10) || 0;
        DEF.skills[fill.dataset.skill] = level;
        return { id: fill.dataset.skill, key, name: $(".bar-head span", li).textContent, level, ar: DEF.ar[key], en: DEF.en[key] };
    });
    DEF.projectsList = $$("[data-project]", doc).map((li) => {
        const t = $("h3", li).dataset.i18n, d = $("p", li).dataset.i18n;
        return {
            id: li.dataset.project, tKey: t, dKey: d,
            titleAr: DEF.ar[t], titleEn: DEF.en[t], descAr: DEF.ar[d], descEn: DEF.en[d],
            tags: $$(".tags span", li).map((x) => x.textContent).join(", "),
            url: "", image: $("img", li).getAttribute("src"), live: false,
        };
    });
    DEF.chips = $$(".chips li", doc).map((li) => ({ ar: DEF.ar[li.dataset.i18n], en: DEF.en[li.dataset.i18n] }));
}

async function loadContent() {
    try {
        const res = await fetch("data/content.json", { cache: "no-store" });
        if (res.ok) return await res.json();
    } catch {}
    return {};
}

// يكمّل البيانات الناقصة ويحوّل الإعدادات القديمة للقوائم الجديدة
function normalize(c) {
    c = c && typeof c === "object" ? c : {};
    c.text ??= {};
    c.text.ar ??= {};
    c.text.en ??= {};
    c.roles ??= {};
    const T = (l, k) => c.text[l][k] ?? DEF[l][k];

    if (!Array.isArray(c.skillsList)) {
        c.skillsList = DEF.skillsList.map((d) => ({
            name: d.name, level: c.skills?.[d.id] ?? d.level, ar: T("ar", d.key), en: T("en", d.key),
        }));
    }
    if (!Array.isArray(c.chips)) {
        c.chips = DEF.chips.map((d, i) => ({ ar: T("ar", `skills.s${i + 1}`) ?? d.ar, en: T("en", `skills.s${i + 1}`) ?? d.en }));
    }
    if (!Array.isArray(c.contacts)) {
        const old = c.contact || {};
        c.contacts = DEF.contacts.map((d) => ({ ...d, value: old[d.type] || d.value }));
    }
    if (!Array.isArray(c.commands)) c.commands = [];
    if (!Array.isArray(c.projectsList)) {
        c.projectsList = DEF.projectsList.map((d) => ({
            titleAr: T("ar", d.tKey), titleEn: T("en", d.tKey), descAr: T("ar", d.dKey), descEn: T("en", d.dKey),
            tags: d.tags, image: d.image, url: c.projects?.[d.id]?.url || "", live: !!c.projects?.[d.id]?.live,
        }));
    }
    delete c.projects;
    if (!Array.isArray(c.certs)) c.certs = [];
    c.sections ??= {};
    c.sections.certs = !!c.sections.certs;
    c.theme ??= { ...ORIGINAL_COLORS };
    delete c.skills;
    delete c.contact;
    return c;
}

function setDirty(v = true) {
    dirty = v;
    const s = $("#status");
    s.textContent = v ? "● تغييرات غير منشورة" : "✓ كل شيء محفوظ";
    s.classList.toggle("dirty", v);
    if (v) saveDraft();
    else { ls.del("contentDraft"); ls.del("contentDraftDirty"); }
}

// المسودة تُحفظ في المتصفح حتى لا تضيع التعديلات عند المعاينة أو إعادة تحميل الصفحة
function saveDraft() {
    try {
        localStorage.setItem("contentDraft", JSON.stringify(clean(content)));
        localStorage.setItem("contentDraftDirty", "1");
        return true;
    } catch {
        toast("⚠️ المسودة كبيرة على ذاكرة المتصفح — انشر التعديلات قريبًا حتى لا تضيع الصور");
        return false;
    }
}

// يحذف القيم المطابقة للافتراضي حتى يبقى الملف صغيرًا
function clean(c) {
    const out = { text: { ar: {}, en: {} }, roles: {} };
    for (const l of ["ar", "en"]) {
        for (const [k, v] of Object.entries(c.text[l])) if (v !== DEF[l][k]) out.text[l][k] = v;
        if (c.roles[l]?.length && c.roles[l].join("\n") !== DEFAULT_ROLES[l].join("\n")) out.roles[l] = c.roles[l];
    }
    const projKeys = ["titleAr", "titleEn", "descAr", "descEn", "tags", "url", "image", "live"];
    const pick = (p) => Object.fromEntries(projKeys.map((k) => [k, k === "live" ? !!p[k] : p[k] || ""]));
    const projects = c.projectsList.map(pick);
    if (!same(projects, DEF.projectsList.map(pick))) out.projectsList = projects;

    const skills = c.skillsList.map(({ name, level, ar, en }) => ({ name, level: +level, ar, en }));
    if (!same(skills, DEF.skillsList.map(({ name, level, ar, en }) => ({ name, level, ar, en })))) out.skillsList = skills;
    if (!same(c.chips, DEF.chips)) out.chips = c.chips;
    const contacts = c.contacts.filter((x) => (x.value || "").trim());
    if (!same(contacts, DEF.contacts)) out.contacts = contacts;
    const cmds = c.commands.filter((x) => (x.name || "").trim());
    if (cmds.length) out.commands = cmds;
    if (!same(c.theme, ORIGINAL_COLORS)) out.theme = c.theme;
    const certs = c.certs.filter((x) => (x.titleAr || x.titleEn || "").trim());
    if (certs.length) out.certs = certs;
    if (c.sections.certs) out.sections = { certs: true };
    return out;
}

// ================= Render =================
function renderTexts() {
    const list = $("#textsList");
    list.textContent = "";
    const byGroup = {};
    Object.keys(DEF.ar).filter((k) => !LIST_KEYS.test(k)).forEach((k) => (byGroup[k.split(".")[0]] ??= []).push(k));

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

// ---------- Generic list editor (move up/down, delete, add) ----------
const mk = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    Object.assign(n, props);
    n.append(...kids);
    return n;
};
function field(label, input, cls = "field") {
    return mk("label", { className: cls }, mk("span", { textContent: label }), input);
}
function textInput(value, onInput, opts = {}) {
    const i = mk(opts.area ? "textarea" : "input", { value: value ?? "", placeholder: opts.ph || "" });
    if (opts.area) i.rows = opts.rows || 3;
    if (opts.dir) i.dir = opts.dir;
    i.addEventListener("input", () => { onInput(i.value); setDirty(); });
    return i;
}

function listEditor(box, arr, buildRow, rerender) {
    box.textContent = "";
    if (!arr.length) box.append(mk("p", { className: "empty", textContent: "لا يوجد عناصر — اضغط زر الإضافة تحت." }));
    arr.forEach((item, idx) => {
        const row = mk("div", { className: "row-card" });
        const tools = mk("div", { className: "row-tools" });
        const btn = (txt, title, fn, dis) => {
            const b = mk("button", { type: "button", textContent: txt, title, disabled: !!dis });
            b.setAttribute("aria-label", title);
            b.addEventListener("click", () => { fn(); setDirty(); rerender(); });
            return b;
        };
        tools.append(
            mk("span", { className: "row-num", textContent: idx + 1 }),
            btn("↑", "تحريك لأعلى", () => arr.splice(idx - 1, 0, arr.splice(idx, 1)[0]), idx === 0),
            btn("↓", "تحريك لأسفل", () => arr.splice(idx + 1, 0, arr.splice(idx, 1)[0]), idx === arr.length - 1),
            btn("🗑", "حذف", () => arr.splice(idx, 1)),
        );
        row.append(tools, buildRow(item, idx));
        box.append(row);
    });
}
const focusLast = (sel, what) => $$(`${sel} .row-card`).at(-1)?.querySelector(what)?.focus();

// ---------- Skills ----------
function renderSkills() {
    listEditor($("#skillsList"), content.skillsList, (s) => {
        const range = mk("input", { type: "range", min: 0, max: 100, step: 5, value: s.level ?? 50 });
        const out = mk("output", { textContent: (s.level ?? 50) + "%" });
        range.addEventListener("input", () => { s.level = +range.value; out.textContent = range.value + "%"; setDirty(); });
        return mk("div", { className: "row-fields grid2" },
            field("اسم المهارة", textInput(s.name, (v) => { s.name = v; }, { ph: "مثل: React", dir: "ltr" })),
            field("النسبة", mk("div", { className: "range-row" }, range, out)),
            field("المستوى بالعربي", textInput(s.ar, (v) => { s.ar = v; }, { ph: "مثل: جيد" })),
            field("Level in English", textInput(s.en, (v) => { s.en = v; }, { ph: "e.g. Good", dir: "ltr" })),
        );
    }, renderSkills);

    listEditor($("#chipsList"), content.chips, (ch) => mk("div", { className: "row-fields grid2" },
        field("عربي", textInput(ch.ar, (v) => { ch.ar = v; }, { ph: "⚡ سريع التعلّم" })),
        field("English", textInput(ch.en, (v) => { ch.en = v; }, { ph: "⚡ Fast learner", dir: "ltr" })),
    ), renderSkills);
}
$("#addSkill").addEventListener("click", () => {
    content.skillsList.push({ name: "", level: 50, ar: "أتعلمها الآن", en: "Learning now" });
    setDirty(); renderSkills(); focusLast("#skillsList", "input");
});
$("#addChip").addEventListener("click", () => {
    content.chips.push({ ar: "", en: "" });
    setDirty(); renderSkills(); focusLast("#chipsList", "input");
});

// ---------- Contact accounts ----------
function renderContacts() {
    const TYPES = window.CONTACT_TYPES;
    listEditor($("#contactsList"), content.contacts, (x) => {
        const sel = mk("select");
        Object.entries(TYPES).forEach(([k, t]) => sel.add(new Option(t.ar, k, false, k === x.type)));
        const ico = mk("span", { className: "row-ico" });
        ico.innerHTML = TYPES[x.type]?.icon || "";   // أيقونات ثابتة من site-data.js
        const preview = mk("small", { className: "row-preview", dir: "ltr" });
        const updatePreview = () => {
            preview.textContent = x.value?.trim() ? "↗ " + TYPES[x.type].href(x.value) : "";
        };
        const val = textInput(x.value, (v) => { x.value = v; updatePreview(); }, { ph: TYPES[x.type]?.ph, dir: "ltr" });
        sel.addEventListener("change", () => {
            x.type = sel.value;
            ico.innerHTML = TYPES[x.type].icon;
            val.placeholder = TYPES[x.type].ph;
            updatePreview();
            setDirty();
        });
        updatePreview();
        return mk("div", { className: "row-fields" },
            mk("div", { className: "grid2" },
                field("النوع", mk("div", { className: "type-row" }, ico, sel)),
                field("اسم المستخدم أو الرابط", val),
                field("عنوان مخصص بالعربي (اختياري)", textInput(x.ar, (v) => { x.ar = v || undefined; }, { ph: TYPES[x.type]?.ar })),
                field("Custom label in English (optional)", textInput(x.en, (v) => { x.en = v || undefined; }, { ph: TYPES[x.type]?.en, dir: "ltr" })),
            ),
            preview,
        );
    }, renderContacts);
}
$("#addContact").addEventListener("click", () => {
    content.contacts.push({ type: "instagram", value: "" });
    setDirty(); renderContacts(); focusLast("#contactsList", "select");
});

// ---------- Terminal commands ----------
const BUILT_IN = ["help", "about", "whoami", "skills", "journey", "projects", "certs", "contact", "cv", "hire", "theme", "lang", "date", "clear", "hello", "sudo"];
function renderCommands() {
    listEditor($("#commandsList"), content.commands, (c) => {
        const warn = mk("small", { className: "row-warn" });
        const check = () => {
            warn.textContent = BUILT_IN.includes((c.name || "").toLowerCase())
                ? "⚠️ هذا الاسم لأمر جاهز — أمرك سيحل محله." : "";
        };
        const name = textInput(c.name, (v) => {
            c.name = v.trim().toLowerCase().replace(/\s+/g, "-");
            if (name.value !== c.name) name.value = c.name;
            check();
        }, { ph: "hobby", dir: "ltr" });
        const chip = mk("input", { type: "checkbox", checked: !!c.chip });
        chip.addEventListener("change", () => { c.chip = chip.checked; setDirty(); });
        check();
        return mk("div", { className: "row-fields" },
            mk("div", { className: "grid2" },
                field("اسم الأمر", name),
                field("أسماء بديلة (اختياري)", textInput(c.aliases, (v) => { c.aliases = v; }, { ph: "هواياتي, hobbies" })),
                field("وصف في قائمة help بالعربي", textInput(c.descAr, (v) => { c.descAr = v; }, { ph: "هواياتي" })),
                field("Description in help (English)", textInput(c.descEn, (v) => { c.descEn = v; }, { ph: "my hobbies", dir: "ltr" })),
                field("الرد بالعربي", textInput(c.ar, (v) => { c.ar = v; }, { area: true, ph: "أحب القراءة وكرة القدم ⚽" })),
                field("Reply in English", textInput(c.en, (v) => { c.en = v; }, { area: true, ph: "I love reading and football ⚽", dir: "ltr" })),
            ),
            warn,
            mk("label", { className: "check" }, chip, " إظهاره كزر اقتراح تحت الترمنال"),
        );
    }, renderCommands);
}
$("#addCommand").addEventListener("click", () => {
    content.commands.push({ name: "", aliases: "", ar: "", en: "", descAr: "", descEn: "", chip: true });
    setDirty(); renderCommands(); focusLast("#commandsList", "input");
});

// ---------- Colors ----------
function paintSwatch() {
    const { primary, accent } = content.theme;
    const sw = $("#swatch");
    sw.style.setProperty("--p", primary);
    sw.style.setProperty("--a", accent);
    $("#cPrimary").value = primary; $("#cPrimaryHex").value = primary;
    $("#cAccent").value = accent; $("#cAccentHex").value = accent;
    $$("#presets button").forEach((b) => b.classList.toggle("active", b.dataset.p === primary && b.dataset.a === accent));
}
function setColor(k, v) {
    if (!/^#[0-9a-f]{6}$/i.test(v)) { toast("اكتب اللون بصيغة ‎#RRGGBB"); paintSwatch(); return; }
    content.theme[k] = v.toLowerCase();
    paintSwatch();
    setDirty();
}
function renderColors() {
    const box = $("#presets");
    box.textContent = "";
    window.COLOR_PRESETS.forEach((p) => {
        const dots = mk("span", { className: "preset__dots" });
        dots.style.background = `linear-gradient(135deg, ${p.primary} 50%, ${p.accent} 50%)`;
        const b = mk("button", { type: "button", className: "preset" }, dots, mk("span", { textContent: p.ar }));
        b.dataset.p = p.primary;
        b.dataset.a = p.accent;
        b.addEventListener("click", () => { content.theme = { primary: p.primary, accent: p.accent }; paintSwatch(); setDirty(); });
        box.append(b);
    });
    paintSwatch();
}
$("#cPrimary").addEventListener("input", (e) => setColor("primary", e.target.value));
$("#cAccent").addEventListener("input", (e) => setColor("accent", e.target.value));
$("#cPrimaryHex").addEventListener("change", (e) => setColor("primary", e.target.value.trim()));
$("#cAccentHex").addEventListener("change", (e) => setColor("accent", e.target.value.trim()));
$("#resetColors").addEventListener("click", () => { content.theme = { ...ORIGINAL_COLORS }; paintSwatch(); setDirty(); });

// ---------- Projects ----------
// يصغّر الصورة المرفوعة (أقصى عرض 1000px) ويحولها لـ WebP حتى يبقى حجمها صغير
function shrinkImage(file) {
    return new Promise((resolve, reject) => {
        if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) return reject(new Error("type"));
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, 1000 / img.width, 1000 / img.height);
            const cv = document.createElement("canvas");
            cv.width = Math.round(img.width * scale);
            cv.height = Math.round(img.height * scale);
            cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
            URL.revokeObjectURL(img.src);
            let out = cv.toDataURL("image/webp", 0.85);
            if (!out.startsWith("data:image/webp")) out = cv.toDataURL("image/jpeg", 0.85);
            resolve(out);
        };
        img.onerror = () => reject(new Error("load"));
        img.src = URL.createObjectURL(file);
    });
}

function renderProjects() {
    listEditor($("#projectsList"), content.projectsList, (p) => {
        // الصورة
        const pic = mk("div", { className: "proj-pic" });
        const paint = () => {
            pic.textContent = "";
            if (p.image) pic.append(mk("img", { src: p.image, alt: "" }));
            else pic.append(mk("span", { textContent: "لا توجد صورة" }));
        };
        paint();
        const file = mk("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif", hidden: true });
        file.addEventListener("change", async () => {
            const f = file.files[0];
            file.value = "";
            if (!f) return;
            try {
                p.image = await shrinkImage(f);
                paint();
                setDirty();
                toast("تم تجهيز الصورة — تُرفع مع الحفظ والنشر");
            } catch { toast("الصورة غير مدعومة — استخدم PNG أو JPG أو WebP"); }
        });
        const upload = mk("label", { className: "btn btn--ghost small-btn" }, "📷 رفع صورة", file);
        const clear = mk("button", { type: "button", className: "btn btn--danger small-btn", textContent: "إزالة الصورة" });
        clear.addEventListener("click", () => { p.image = ""; paint(); setDirty(); });
        const imgUrl = textInput(p.image?.startsWith("data:") ? "" : p.image, (v) => { p.image = v.trim(); paint(); },
            { ph: "أو رابط صورة https://…", dir: "ltr" });

        const live = mk("input", { type: "checkbox", checked: !!p.live });
        live.addEventListener("change", () => { p.live = live.checked; setDirty(); });

        return mk("div", { className: "row-fields proj-row" },
            mk("div", { className: "proj-side" }, pic, mk("div", { className: "row" }, upload, clear), imgUrl),
            mk("div", { className: "grid2" },
                field("اسم المشروع بالعربي", textInput(p.titleAr, (v) => { p.titleAr = v; }, { ph: "متجر إلكتروني" })),
                field("Project name (English)", textInput(p.titleEn, (v) => { p.titleEn = v; }, { ph: "Online store", dir: "ltr" })),
                field("الوصف بالعربي", textInput(p.descAr, (v) => { p.descAr = v; }, { area: true, rows: 2 })),
                field("Description (English)", textInput(p.descEn, (v) => { p.descEn = v; }, { area: true, rows: 2, dir: "ltr" })),
                field("التقنيات (افصلها بفاصلة)", textInput(p.tags, (v) => { p.tags = v; }, { ph: "HTML, CSS, JS", dir: "ltr" })),
                field("رابط المشروع (اختياري)", textInput(p.url, (v) => { p.url = v.trim(); }, { ph: "https://", dir: "ltr" })),
            ),
            mk("label", { className: "check" }, live, " المشروع متاح الآن (بدل «قريبًا»)"),
        );
    }, renderProjects);
}
$("#addProject").addEventListener("click", () => {
    content.projectsList.push({ titleAr: "", titleEn: "", descAr: "", descEn: "", tags: "", url: "", image: "", live: false });
    setDirty(); renderProjects(); focusLast("#projectsList", ".grid2 input");
});

// ---------- Certificates & courses ----------
function paintCertsState() {
    const on = content.sections.certs, n = content.certs.filter((x) => (x.titleAr || x.titleEn || "").trim()).length;
    $("#certsVisible").checked = on;
    $("#certsState").textContent = !on ? "القسم مخفي حاليًا"
        : n ? `القسم ظاهر في الموقع (${n})` : "مفعّل، لكن لن يظهر حتى تضيف شهادة أو دورة واحدة على الأقل";
}
$("#certsVisible").addEventListener("change", (e) => {
    content.sections.certs = e.target.checked;
    paintCertsState();
    setDirty();
});

function imagePicker(item, onChange) {
    const pic = mk("div", { className: "proj-pic" });
    const paint = () => {
        pic.textContent = "";
        if (item.image) pic.append(mk("img", { src: item.image, alt: "" }));
        else pic.append(mk("span", { textContent: "بدون صورة (اختياري)" }));
    };
    paint();
    const file = mk("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif", hidden: true });
    file.addEventListener("change", async () => {
        const f = file.files[0];
        file.value = "";
        if (!f) return;
        try {
            item.image = await shrinkImage(f);
            paint(); onChange?.(); setDirty();
            toast("تم تجهيز الصورة — تُرفع مع الحفظ والنشر");
        } catch { toast("الصورة غير مدعومة — استخدم PNG أو JPG أو WebP"); }
    });
    const upload = mk("label", { className: "btn btn--ghost small-btn" }, "📷 رفع صورة", file);
    const clear = mk("button", { type: "button", className: "btn btn--danger small-btn", textContent: "إزالة الصورة" });
    clear.addEventListener("click", () => { item.image = ""; paint(); setDirty(); });
    return mk("div", { className: "proj-side" }, pic, mk("div", { className: "row" }, upload, clear));
}

function renderCerts() {
    paintCertsState();
    listEditor($("#certsList"), content.certs, (x) => {
        const type = mk("select");
        type.add(new Option("🎓 شهادة", "cert", false, x.type !== "course"));
        type.add(new Option("📚 دورة", "course", false, x.type === "course"));
        type.addEventListener("change", () => { x.type = type.value; setDirty(); });
        return mk("div", { className: "row-fields proj-row" },
            imagePicker(x),
            mk("div", { className: "grid2" },
                field("النوع", type),
                field("التاريخ (اختياري)", textInput(x.date, (v) => { x.date = v.trim(); }, { ph: "2025", dir: "ltr" })),
                field("اسم الشهادة/الدورة بالعربي", textInput(x.titleAr, (v) => { x.titleAr = v; paintCertsState(); }, { ph: "أساسيات تطوير الويب" })),
                field("Title (English)", textInput(x.titleEn, (v) => { x.titleEn = v; paintCertsState(); }, { ph: "Web Development Basics", dir: "ltr" })),
                field("الجهة المانحة بالعربي", textInput(x.issuerAr, (v) => { x.issuerAr = v; }, { ph: "مثل: منصة سطر، كورسيرا، أكاديمية طويق" })),
                field("Issuer (English)", textInput(x.issuerEn, (v) => { x.issuerEn = v; }, { ph: "e.g. Coursera", dir: "ltr" })),
                field("رابط الشهادة أو التحقق (اختياري)", textInput(x.url, (v) => { x.url = v.trim(); }, { ph: "https://", dir: "ltr" })),
            ),
        );
    }, renderCerts);
}
$("#addCert").addEventListener("click", () => {
    content.certs.push({ type: "cert", titleAr: "", titleEn: "", issuerAr: "", issuerEn: "", date: "", url: "", image: "" });
    setDirty(); renderCerts(); focusLast("#certsList", ".grid2 input");
});

function renderAll() {
    renderTexts();
    renderRoles();
    renderSkills();
    renderContacts();
    renderCommands();
    renderColors();
    renderProjects();
    renderCerts();
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
    const repoApi = `https://api.github.com/repos/${encodeURIComponent(gh.owner)}/${encodeURIComponent(gh.repo)}/contents/`;
    const api = repoApi + "data/content.json";
    const headers = { Authorization: `Bearer ${gh.token}`, Accept: "application/vnd.github+json" };
    try {
        // 1) رفع صور المشاريع الجديدة إلى assets/projects/
        const pending = [...content.projectsList, ...content.certs].filter((p) => (p.image || "").startsWith("data:image/"));
        for (const [n, p] of pending.entries()) {
            btn.textContent = `رفع الصور ${n + 1}/${pending.length}…`;
            const [, mime, data] = p.image.match(/^data:image\/([a-z]+);base64,(.+)$/i) || [];
            if (!data) continue;
            const ext = mime.toLowerCase() === "jpeg" ? "jpg" : mime.toLowerCase();
            const path = `assets/uploads/${Date.now()}-${n + 1}.${ext}`;
            const up = await fetch(repoApi + path, {
                method: "PUT", headers,
                body: JSON.stringify({ message: "Upload project image from admin panel", content: data, branch: gh.branch }),
            });
            if (!up.ok) throw new Error(up.status);
            p.image = path;
        }
        if (pending.length) { saveDraft(); renderProjects(); renderCerts(); }
        btn.textContent = "جارٍ النشر…";

        // 2) حفظ المحتوى
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

let leaving = false;
$("#previewBtn").addEventListener("click", () => {
    saveDraft();
    if (!dirty) ls.del("contentDraftDirty");   // بدون تعديلات: المعاينة تعرض المحتوى المنشور كما هو
    leaving = true;
    location.href = "index.html?preview";
});
$("#discardBtn").addEventListener("click", async () => {
    ls.del("contentDraft");
    ls.del("contentDraftDirty");
    content = normalize(await loadContent());
    renderAll();
    setDirty(false);
    toast("تم تجاهل التعديلات غير المنشورة");
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

addEventListener("beforeunload", (e) => { if (dirty && !leaving) e.preventDefault(); });

// ================= Boot =================
async function openDashboard() {
    $("#loginView").hidden = true;
    $("#dashView").hidden = false;
    try {
        await loadDefaults();
    } catch {
        toast("تعذر تحميل الصفحة الرئيسية — افتح لوحة التحكم من الموقع المنشور");
    }
    let restored = false;
    if (ls.get("contentDraftDirty") === "1") {
        try { content = normalize(JSON.parse(ls.get("contentDraft"))); restored = true; } catch {}
    }
    if (!restored) content = normalize(await loadContent());
    loadGhSettings();
    renderAll();
    setDirty(restored);
    if (restored) toast("رجعت لتعديلاتك غير المنشورة ✍️");
}

if (isLoggedIn()) openDashboard();
