// custom neural network to determine foreground color from the provided background color
// https://harthur.github.io/brain/

/* const getForegroundScheme = function (backgroundColor) {
    const output = runNetwork(backgroundColor)

    if (output.black > .5) {
        return 'dark';
    }
    return 'light';
} */

const getForegroundScheme = function (bgColor) {
    const yiq = (bgColor.r * 299 + bgColor.g * 587 + bgColor.b * 114) / 1000;
    return (yiq >= 128) ? 'darkText' : 'lightText';
}

const runNetwork = function anonymous(input) {
    input = {
        r: input.r / 255,
        g: input.g / 255,
        b: input.b / 255
    }

    var net = { "layers": [{ "r": {}, "g": {}, "b": {} }, { "0": { "bias": 11.863681808040084, "weights": { "r": -7.201966913915387, "g": -8.029913133910126, "b": -7.114014407251207 } }, "1": { "bias": 1.4191426085030703, "weights": { "r": -9.515013700560017, "g": -15.380774373431901, "b": 14.810615856701528 } }, "2": { "bias": 7.910577570557974, "weights": { "r": 1.0218523776135997, "g": -5.225977937366264, "b": -15.748624161479913 } } }, { "black": { "bias": 12.12465496686442, "weights": { "0": -12.349936615697885, "1": -20.392583042532355, "2": -13.721470483883609 } } }], "outputLookup": true, "inputLookup": true };

    for (var i = 1; i < net.layers.length; i++) {
        var layer = net.layers[i]
        var output = {}

        for (const id in layer) {
            var node = layer[id]
            let sum = node.bias

            for (var iid in node.weights) {
                sum += node.weights[iid] * input[iid]
            }
            output[id] = (1 / (1 + Math.exp(-sum)))
        }
        input = output
    }
    return output
}

const applyTheme = (windowId, bgColor, pagePrefersColorScheme) => {
    // bgColor: {r: 0, g: 0, b: 0, a: 1}
    // bg = background
    // fg = foreground

    // this will return either 'light' or 'dark'
    const fgScheme = getForegroundScheme(bgColor)

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
                tab_background_text: "rgb(60, 60, 60)",
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
                tab_background_text: "rgb(220, 220, 220)",
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

    const theme = {
        colors: {
            // Tabbar & tab
            frame: tinycolor(bgColor).toRgbString(),
            frame_inactive: tinycolor(bgColor).toRgbString(),

            tab_selected: fgScheme == 'lightText' ?
                tinycolor(bgColor).brighten(12).toRgbString() :
                tinycolor(bgColor).brighten(20).desaturate(10).toRgbString(),
            // URL bar
            toolbar_field: fgScheme == 'lightText' ?
                tinycolor(bgColor).brighten(8).toRgbString() :
                tinycolor(bgColor).brighten(20).desaturate(10).toRgbString(),
            /*
            toolbar_field: fgScheme == 'dark' ? 
                                    tinycolor(bgColor).saturate(40).brighten(4).toRgbString() :
                                    tinycolor(bgColor).desaturate(5).darken(6).toRgbString(),
            */

            sidebar: tinycolor(bgColor).toRgbString(),
            popup: tinycolor(bgColor).toRgbString(),



            toolbar_field_focus: fgScheme == 'lightText' ?
                tinycolor(bgColor).brighten(8).toRgbString() :
                tinycolor(bgColor).brighten(40).saturate(5).toRgbString(),
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

    // workaround to delete 'deg' in HSL colors because tinycolor doesn't like it
    color = color.replace('deg', '')
    const rgbColor = tinycolor(color)
    if (!rgbColor.isValid()) browser.theme.reset(windowId)
    applyTheme(windowId, rgbColor.toRgb(), pagePrefersColorScheme)
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
        // sender.tab.active ? tryApplyTheme(sender.tab.windowId, message.color) : applyTheme_event() // what the hell is this?
        sender.tab.active ? tryApplyTheme(sender.tab.windowId, response.color, response.pagePrefersColorScheme) : null // what the hell is this?
    }
});

browser.tabs.onUpdated.addListener(applyTheme_event); // When new tab is opened / reloaded
browser.tabs.onActivated.addListener(applyTheme_event); // When switch tabs
browser.tabs.onAttached.addListener(applyTheme_event); // When a tab is attatched to a window
browser.windows.onFocusChanged.addListener(applyTheme_event); // When a new window is opened