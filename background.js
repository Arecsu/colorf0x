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

    // unused pagePrefersColorScheme

    // this will return either 'darkText' or 'lightText'
    const fgScheme = getForegroundScheme(chroma(bgColor).rgb())

    const fgSchemes = {
        darkText: {
            colors: {
                // Tabbar & tab
                ntp_background: "rgb(255, 255, 255)",
                // Toolbar
                toolbar: "rgba(0, 0, 0, 0)",
                toolbar_top_separator: "rgba(0, 0, 0, 0)",
                toolbar_bottom_separator: "rgba(0, 0, 0, 0)",
                // URL bar
                toolbar_field_border: "rgba(0, 0, 0, 0)",
                toolbar_field_border_focus: "rgb(130, 180, 245)",
                // Sidebar
                sidebar_border: "rgba(0, 0, 0, .2)",
                // Popup
                popup_border: "rgba(0, 0, 0, .2)",
                // Static
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
                color_scheme: "system",
                content_color_scheme: "auto"

            },
        },
        lightText: {
            colors: {
                // Tabbar & tab
                ntp_background: "rgb(255, 255, 255)",
                // Toolbar
                toolbar: "rgba(255, 255, 255, 0)",
                toolbar_top_separator: "rgba(255, 255, 255, 0)",
                toolbar_bottom_separator: "rgba(255, 255, 255, 0)",
                // URL bar
                toolbar_field_border: "rgba(255, 255, 255, 0)",
                toolbar_field_border_focus: "rgb(130, 180, 245)",
                // Sidebar
                sidebar_border: "rgba(255, 255, 255, .2)",
                // Popup
                popup_border: "rgba(255, 255, 255, .2)",
                // Static
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
                color_scheme: "system",
                content_color_scheme: "auto"
            },
        }
    }

    const toolbar_field_colorCSS = (() => {
        let color = chroma(bgColor).luminance() > 0.9 ?
            chroma(bgColor).darken(0.23) : 
            chroma(bgColor).luminance((chroma(bgColor).luminance() + 0.03) * 1.15, 'hsl')
        return color.css()
    })()

    const tab_selected_colorCSS = toolbar_field_colorCSS

    const bgColorCSS = chroma(bgColor).css()

    const theme = {
        colors: {
            // Tabbar & tab
            frame: bgColorCSS,
            frame_inactive: bgColorCSS,

            tab_selected: tab_selected_colorCSS,
            // URL bar
            toolbar_field: toolbar_field_colorCSS,

            sidebar: bgColorCSS,
            popup: bgColorCSS,

            toolbar_field_focus: toolbar_field_colorCSS,
            // etc
            ...fgSchemes[fgScheme]['colors']
        },
        properties: {
            ...fgSchemes[fgScheme]['properties']
        }
    }

    browser.theme.update(windowId, theme)
}

const tryApplyTheme = (windowId, color, pagePrefersColorScheme) => {

    // workaround to delete 'deg' in HSL colors because chroma.js doesn't like it
    color = color.replace('deg', '')
    if (!chroma.valid(color)) browser.theme.reset(windowId)
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