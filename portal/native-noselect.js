// ========================================
// NO TEXT SELECTION (iPhone app only)
// ========================================
// Native apps don't highlight words when you press and hold, so the
// iPhone app turns text selection off everywhere except:
//   - boxes you type in (so editing, copy and paste still work)
//   - full-screen photos, which keep iPhone's press-and-hold menu
//     (Save to Photos, Share)
// In a web browser nothing changes.
// ========================================

(() => {
    if (!window.Capacitor?.isNativePlatform?.()) {
        return;
    }
    if (document.getElementById("pis-no-select")) {
        return;
    }

    document.documentElement.classList.add("pis-native");

    const style = document.createElement("style");
    style.id = "pis-no-select";
    style.textContent = `
        html.pis-native,
        html.pis-native * {
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
        }
        html.pis-native input,
        html.pis-native textarea,
        html.pis-native [contenteditable="true"],
        html.pis-native [contenteditable="true"] * {
            -webkit-user-select: text !important;
            user-select: text !important;
            -webkit-touch-callout: default !important;
        }
        html.pis-native .client-report-lightbox-image,
        html.pis-native .pis-photo-viewer-image {
            -webkit-touch-callout: default !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);
})();
