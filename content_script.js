// document.querySelector(`meta[name="theme-color"][media="(prefers-color-scheme: ${colourScheme})"]`)

let themeColor = null
let pagePrefersColorScheme = null

const sendCurrentColors = () => {
    pagePrefersColorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const el_themeColor = document.querySelector(`meta[name="theme-color"][media="(prefers-color-scheme: ${pagePrefersColorScheme})"]`) || document.querySelector(`meta[name="theme-color"]`)

    if (!el_themeColor) return

    // get the color
    themeColor = el_themeColor.content

    // send color to background.js script
    browser.runtime.sendMessage({ reason: "BROWSER_COLOR_UPDATE", color: themeColor, pagePrefersColorScheme })
}

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.reason === "PAGE_COLOR_REQUEST") {
        sendResponse({ color: themeColor, pagePrefersColorScheme })
    }
})

sendCurrentColors()


const onThemeColorChange = new MutationObserver(sendCurrentColors)
if (document.querySelector("meta[name=theme-color]") != null) {
    onThemeColorChange.observe(document.querySelector("meta[name=theme-color]"), {
        attributes: true,
    });
}

// Detects style injections & theme-color being added to the dom
const onStyleInjection = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        // Check all added nodes
        mutation.addedNodes.forEach(node => {
            if (node.nodeName === "STYLE") {
                sendCurrentColors();
            } else if (node.nodeName === "META" && node.getAttribute("name") === "theme-color") {
                // Re-attach observer to the new meta tag
                onThemeColorChange.observe(node, { attributes: true });
                sendCurrentColors();
            }
        });
        // Check all removed nodes for style changes
        mutation.removedNodes.forEach(node => {
            if (node.nodeName === "STYLE") {
                sendCurrentColors();
            }
        });
    });
});

onStyleInjection.observe(document.documentElement, { childList: true });
onStyleInjection.observe(document.head, { childList: true });
