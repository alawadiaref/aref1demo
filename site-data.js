// ===== بيانات مشتركة بين الموقع ولوحة التحكم =====
// أنواع حسابات التواصل: الاسم، الأيقونة، وطريقة بناء الرابط من القيمة المدخلة.
(() => {
    const S = (inner) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
    const handle = (v) => v.trim().replace(/^@/, "");
    const isUrl = (v) => /^https?:\/\//i.test(v.trim());
    const urlOr = (base) => (v) => (isUrl(v) ? v.trim() : base + encodeURIComponent(handle(v)));
    const at = (v) => (isUrl(v) ? v.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "") : "@" + handle(v));

    window.CONTACT_TYPES = {
        email: {
            ar: "البريد الإلكتروني", en: "Email", ph: "name@example.com",
            icon: S('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/>'),
            href: (v) => "mailto:" + v.trim(), show: (v) => v.trim(), blank: false,
        },
        phone: {
            ar: "الجوال", en: "Phone", ph: "+966 5x xxx xxxx",
            icon: S('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
            href: (v) => "tel:" + v.replace(/[^\d+]/g, ""), show: (v) => v.trim(), blank: false,
        },
        whatsapp: {
            ar: "واتساب", en: "WhatsApp", ph: "966557243832",
            icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
            href: (v) => "https://wa.me/" + v.replace(/\D/g, ""), show: (v) => "+" + v.replace(/\D/g, ""), blank: true,
        },
        x: {
            ar: "إكس (تويتر)", en: "X (Twitter)", ph: "@username",
            icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>',
            href: urlOr("https://x.com/"), show: at, blank: true,
        },
        instagram: {
            ar: "إنستقرام", en: "Instagram", ph: "@username",
            icon: S('<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'),
            href: urlOr("https://instagram.com/"), show: at, blank: true,
        },
        snapchat: {
            ar: "سناب شات", en: "Snapchat", ph: "username",
            icon: S('<path d="M12 3c3 0 5 2.2 5 5v2.5l1.8.6c.4.2.4.7 0 .9-.8.4-1.8.6-2.3 1 .5 1.8 1.9 3 3.5 3.5.3.1.3.6 0 .7-1 .4-2 .4-2.5.8-.3.3-.2 1.1-.6 1.2-.8.2-1.9-.3-3 .2-1 .5-1.6 1.6-3.9 1.6s-2.9-1.1-3.9-1.6c-1.1-.5-2.2 0-3-.2-.4-.1-.3-.9-.6-1.2-.5-.4-1.5-.4-2.5-.8-.3-.1-.3-.6 0-.7 1.6-.5 3-1.7 3.5-3.5-.5-.4-1.5-.6-2.3-1-.4-.2-.4-.7 0-.9L7 10.5V8c0-2.8 2-5 5-5z"/>'),
            href: urlOr("https://snapchat.com/add/"), show: at, blank: true,
        },
        tiktok: {
            ar: "تيك توك", en: "TikTok", ph: "@username",
            icon: S('<path d="M9 12a4 4 0 1 0 4 4V3c.6 2.6 2.6 4.6 5.5 4.8"/>'),
            href: (v) => (isUrl(v) ? v.trim() : "https://tiktok.com/@" + encodeURIComponent(handle(v))), show: at, blank: true,
        },
        linkedin: {
            ar: "لينكد إن", en: "LinkedIn", ph: "username",
            icon: S('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'),
            href: urlOr("https://linkedin.com/in/"), show: at, blank: true,
        },
        github: {
            ar: "جيت هب", en: "GitHub", ph: "username",
            icon: S('<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5.1 5.1 0 0 0 19.9 1S18.7.7 16 2.5a13.4 13.4 0 0 0-7 0C6.3.7 5.1 1 5.1 1A5.1 5.1 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.7c0 5.5 3.3 6.6 6.4 7a3.4 3.4 0 0 0-.9 2.6V22"/>'),
            href: urlOr("https://github.com/"), show: at, blank: true,
        },
        youtube: {
            ar: "يوتيوب", en: "YouTube", ph: "@channel",
            icon: S('<path d="M22.5 6.4a2.8 2.8 0 0 0-1.9-2C18.9 4 12 4 12 4s-6.9 0-8.6.5a2.8 2.8 0 0 0-1.9 2A29 29 0 0 0 1 11.8a29 29 0 0 0 .5 5.3 2.8 2.8 0 0 0 1.9 1.9c1.7.5 8.6.5 8.6.5s6.9 0 8.6-.5a2.8 2.8 0 0 0 1.9-1.9 29 29 0 0 0 .5-5.3 29 29 0 0 0-.5-5.4z"/><path d="m9.8 15 5.7-3.2-5.7-3.3z"/>'),
            href: (v) => (isUrl(v) ? v.trim() : "https://youtube.com/@" + encodeURIComponent(handle(v))), show: at, blank: true,
        },
        telegram: {
            ar: "تيليجرام", en: "Telegram", ph: "@username",
            icon: S('<path d="m22 2-11 11"/><path d="m22 2-7 20-4-9-9-4z"/>'),
            href: urlOr("https://t.me/"), show: at, blank: true,
        },
        website: {
            ar: "الموقع", en: "Website", ph: "https://example.com",
            icon: S('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
            href: (v) => (isUrl(v) ? v.trim() : "https://" + v.trim()), show: (v) => v.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, ""), blank: true,
        },
        custom: {
            ar: "رابط", en: "Link", ph: "https://…",
            icon: S('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.8 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
            href: (v) => (isUrl(v) ? v.trim() : "https://" + v.trim()), show: (v) => v.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, ""), blank: true,
        },
    };

    window.DEFAULT_CONTACTS = [
        { type: "email", value: "Alawadiaref12@gmail.com" },
        { type: "phone", value: "+966 55 724 3832" },
        { type: "whatsapp", value: "966557243832" },
    ];

    // ألوان جاهزة: الأساسي + المميز
    window.COLOR_PRESETS = [
        { ar: "الأصلي", en: "Original", primary: "#5e9eae", accent: "#7c4e4e" },
        { ar: "محيط", en: "Ocean", primary: "#2563eb", accent: "#f97316" },
        { ar: "زمرد", en: "Emerald", primary: "#059669", accent: "#b45309" },
        { ar: "بنفسجي", en: "Violet", primary: "#7c3aed", accent: "#db2777" },
        { ar: "غروب", en: "Sunset", primary: "#ea580c", accent: "#1e3a8a" },
        { ar: "ذهبي", en: "Gold", primary: "#b8860b", accent: "#374151" },
        { ar: "وردي", en: "Rose", primary: "#e11d48", accent: "#0f766e" },
        { ar: "رمادي", en: "Graphite", primary: "#475569", accent: "#0891b2" },
    ];

    // يبني CSS الألوان من اللونين (يطبق على الوضعين النهاري والليلي)
    window.buildThemeCSS = (primary, accent) => {
        const hex = /^#[0-9a-f]{6}$/i;
        if (!hex.test(primary || "") || !hex.test(accent || "")) return "";
        const light = `--teal:${primary};--teal-strong:color-mix(in srgb,${primary} 80%,#00e5ff 20%);--teal-deep:color-mix(in srgb,${primary} 72%,#000);--maroon:${accent};--maroon-soft:color-mix(in srgb,${accent} 75%,#fff);--term-accent:color-mix(in srgb,${primary} 55%,#fff);--term-warm:color-mix(in srgb,${accent} 50%,#fff);`;
        const dark = `--teal-deep:color-mix(in srgb,${primary} 55%,#fff);--maroon:color-mix(in srgb,${accent} 55%,#fff);--maroon-soft:color-mix(in srgb,${accent} 40%,#fff);`;
        return `:root{${light}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}
:root[data-theme="dark"]{${dark}}
.intro{--i-teal:color-mix(in srgb,${primary} 55%,#fff);--i-teal-soft:${primary};--i-maroon:color-mix(in srgb,${accent} 50%,#fff);}`;
    };
})();
