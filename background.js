// YIQ formula to determine color contrast
const getForegroundScheme = function (bgColor) {
    const rgb = { 
        r: bgColor[0],
        g: bgColor[1],
        b: bgColor[2]
    }

    const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return (yiq >= 128) ? 'darkText' : 'lightText';
}

const applyTheme = (windowId, bgColor, pagePrefersColorScheme) => {
    // bg = background
    // fg = foreground
    
    const fgScheme = getForegroundScheme(chroma(bgColor).rgb())
    
    const fgSchemes = {
        darkText: {
            colors: {
                ntp_background: "rgb(255, 255, 255)",
                toolbar: "rgba(0, 0, 0, 0)",
                toolbar_top_separator: "rgba(0, 0, 0, 0)",
                toolbar_bottom_separator: "rgba(0, 0, 0, 0)",
                toolbar_field_border: "rgba(0, 0, 0, 0)",
                toolbar_field_border_focus: "rgb(130, 180, 245)",
                sidebar_border: "rgba(0, 0, 0, .2)",
                popup_border: "rgba(0, 0, 0, .2)",
                tab_text: "rgb(0, 0, 0)",
                tab_background_text: "rgb(20, 20, 20)",
                tab_loading: "rgba(0, 0, 0, 0)",
                tab_line: "rgba(0, 0, 0, 0)",
                ntp_text: "rgb(0, 0, 0)",
                toolbar_text: "rgb(0, 0, 0)",
                toolbar_field_text: "rgba(0, 0, 0)",
                popup_text: "rgb(0, 0, 0)",
                sidebar_text: "rgb(0, 0, 0)",
                button_background_hover: "rgba(0, 0, 0, 0.10)",
                button_background_active: "rgba(0, 0, 0, 0.15)",
                icons: "rgb(30, 30, 30)",
            },
            properties: {
                color_scheme: "light",
                content_color_scheme: "auto"
            },
        },
        lightText: {
            colors: {
                ntp_background: "rgb(255, 255, 255)",
                toolbar: "rgba(255, 255, 255, 0)",
                toolbar_top_separator: "rgba(255, 255, 255, 0)",
                toolbar_bottom_separator: "rgba(255, 255, 255, 0)",
                toolbar_field_border: "rgba(255, 255, 255, 0)",
                toolbar_field_border_focus: "rgb(130, 180, 245)",
                sidebar_border: "rgba(255, 255, 255, .2)",
                popup_border: "rgba(255, 255, 255, .2)",
                tab_text: "rgb(255, 255, 255)",
                tab_background_text: "rgb(250, 250, 250)",
                tab_loading: "rgba(255, 255, 255, 0)",
                tab_line: "rgba(255, 255, 255, 0)",
                ntp_text: "rgb(255, 255, 255)",
                toolbar_text: "rgb(255, 255, 255)",
                toolbar_field_text: "rgb(255, 255, 255)",
                popup_text: "rgb(255, 255, 255)",
                sidebar_text: "rgb(255, 255, 255)",
                button_background_hover: "rgba(255, 255, 255, 0.10)",
                button_background_active: "rgba(255, 255, 255, 0.15)",
                icons: "rgb(255, 255, 255)",
            },
            properties: {
                color_scheme: "dark",
                content_color_scheme: "auto"
            },
        }
    }
    
    const [L, C, H] = chroma(bgColor).oklch();
    const shift = fgScheme === 'lightText' ? -1 : 1;
    
    const frameL = Math.max(0.2, Math.min(1, L - (shift * 0.06)));
    const toolbarL = Math.max(0.2, Math.min(1, L - (shift * 0.04)));
    const toolbarTopSeparatorL = Math.max(0.2, Math.min(1, L - (shift * 0.12)));

    // Fix for grayscale: if chroma is near 0, hue is irrelevant. 
    // Use a small epsilon to handle floating point precision.
    const isGrayscale = Math.abs(C) < 0.001;
    const safeC = isGrayscale ? 0 : C;
    const safeH = isGrayscale ? 0 : H;

    const frameColorCSS = `oklch(${frameL} ${safeC} ${safeH})`;
    const toolbarFieldColorCSS = `oklch(${toolbarL} ${safeC} ${safeH})`;
    const toolbarTopSeparatorCSS = `oklch(${toolbarTopSeparatorL} ${safeC} ${safeH})`;
    const bgColorCSS = chroma(bgColor).alpha(1).css();

    const theme = {
        // reference: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme
        colors: {
            ...fgSchemes[fgScheme]['colors'],
            frame: frameColorCSS,
            frame_inactive: frameColorCSS,
            tab_selected: bgColorCSS,
            toolbar: bgColorCSS,
            // toolbar_top_separator: toolbarTopSeparatorCSS,
            toolbar_bottom_separator: toolbarTopSeparatorCSS,
            // toolbar_bottom_separator: bgColorCSS,
            // toolbar_field: toolbarFieldColorCSS,
            toolbar_field: toolbarFieldColorCSS,

            sidebar: bgColorCSS,
            popup: bgColorCSS,
            toolbar_field_focus: toolbarFieldColorCSS,
        },
        properties: {
            ...fgSchemes[fgScheme]['properties']
        }
    }
    
    console.log("[colorf0x] Applying Theme:", {
        bgColor: bgColor,
        frame: frameColorCSS,
        toolbar: bgColorCSS,
        toolbarField: toolbarFieldColorCSS,
        fgScheme: fgScheme
    });

    browser.theme.update(windowId, theme)
}

const tryApplyTheme = (windowId, color, pagePrefersColorScheme) => {
    // workaround to delete 'deg' in HSL colors because chroma.js doesn't like it
    color = color.replace('deg', '')
    if (!chroma.valid(color) || chroma(color).alpha() == 0) {
        browser.theme.reset(windowId)
        return
    }
    applyTheme(windowId, color, pagePrefersColorScheme)
}


const applyTheme_event = () => {
    browser.tabs.query({ active: true, status: "complete" }, (tabs) => {
        // each tab in tabs represents the current active tab in each window
        // we should update the theme for each window, given they are visible in the window manager

        tabs.forEach(tab => {
            browser.tabs.sendMessage(tab.id, { reason: "PAGE_COLOR_REQUEST" }, (response) => {
                if (response === undefined || !response.color) {
                    browser.theme.reset(tab.windowId)
                    return
                }
                tryApplyTheme(tab.windowId, response.color, response.pagePrefersColorScheme)
            })
        })
    })
}

browser.runtime.onMessage.addListener((response, sender) => {
    if (response.reason === "BROWSER_COLOR_UPDATE") {
        sender.tab.active ? tryApplyTheme(sender.tab.windowId, response.color, response.pagePrefersColorScheme) : null // if tab is not active, don't do anything
    }
});

browser.tabs.onUpdated.addListener(applyTheme_event); // When new tab is opened / reloaded
browser.tabs.onActivated.addListener(applyTheme_event); // When switch tabs
browser.tabs.onAttached.addListener(applyTheme_event); // When a tab is attatched to a window
browser.windows.onFocusChanged.addListener(applyTheme_event); // When a new window is opened