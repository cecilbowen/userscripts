// ==UserScript==
// @name         howlongtobeat quick add
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds a "Quick Add" button on searched games that adds the game to your list as "completed"
// @author       InfexiousBand
// @match        https://howlongtobeat.com/submit*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

/*
How to use:
1.	Login to howlongtobeat.com

2.	Navigate to a game submit page (example: https://howlongtobeat.com/submit?s=add&gid=5423)
	No need to actually submit, just visiting the page is enough to let the script grab your user_id
	
3.	Now you can go to https://howlongtobeat.com/submit and start searching games to "Quick Add"

4.	Game search results will now show a "Quick Add" button to automatically add to game lists, and will show up as
	highlighted when they are added to your completed list
  
5.  You can change some settings below in the "EDITABLES" section if you like
	
------------

Known (Possible) Issues:
-	only knows "page 1" of your completed games list.  so, for example, let's say each query page contains 50 results.
	if you search "mario" games, and you have > 50 mario games in your completed list, then the script will only know to
	highlight "mario" results as completed (green, "quick add" button disabled) if it's on your "page 1" of completed games

- 	no error handling when quick adding games.  shouldn't be too much of an issue, but if you, for example, tried to quick add
	a game with a non-supported or non-existent platform, it would normally redirect you to the actual submit page with an
	error notification at the top.

------------

Storefronts:
	Amazon Game App, Amazon Luna, Apple App Store, Arc, Battle.net, Bethesda, Direct Download, Discord,
	Epic Games, GameCenter, GOG, Google Play, Google Stadia, Humble Bundle, IndieGala, itch.io, Kartridge, Microsoft Store,
	Nintendo eShop, Oculus, Origin, Paradox Games, PlayStation Store, Rockstar Games, Steam, Ubisoft Connect, Xbox Store,
	Borrowed, Physical, Rented, Apple Arcade, EA Play, Google Play Pass, Google Stadia Pro, Nintendo Online, PlayStation Now,
	PlayStation Plus, Ubisoft+, Viveport, Xbox Game Pass, Xbox Games w/ Gold
*/
(function() {
    'use strict';

    // EDITABLES ==============================================================================================================
    // ========================================================================================================================
    // your user id.  either manually enter if you know it or simply navigate to the submit page on howlongtobeat to obtain.
	// script will not continue without it. example: https://howlongtobeat.com/submit?s=add&gid=5423
	let USER_ID = "";
    const HIGHLIGHT_COLOR = "#00FF0035"; // color to highlight background of games already on your list
    const DATE = "00/00/0000"; // date game added to list. defaults to omitting it from list
    const PLAY_NOTES = ""; // what to add to "Play Notes" field, if anything
    const STOREFRONT = ""; // leave blank, or use one of storefronts above
    const WAIT_TIME = 1.5; //how many seconds to wait before running script
    const SEARCH_TIME = 1.5; // seconds to wait after typing in search bar, before adding 'quick add' buttons to search results

    // lists to quick add games to. comment/uncomment what you want
    const LISTS = [
        "Completed",
        //"Playing",
        //"Backlog",
        //"Replays",
        //"Retired",
        //"Custom Tab",
    ];

    // list of platforms to show in custom dropdown. comment/uncomment as desired
    const PLATFORM_LIST = [
        //"3DO",
        //"Acorn Archimedes",
        //"Amazon Luna",
        //"Amiga",
        //"Amiga CD32",
        //"Amstrad CPC",
        //"Android",
        //"Apple II",
        //"Arcade",
        //"Atari 8-bit Family",
        //"Atari 2600",
        //"Atari 5200",
        //"Atari 7800",
        //"Atari Jaguar",
        //"Atari Jaguar CD",
        //"Atari Lynx",
        //"Atari ST",
        //"BBC Micro",
        //"Browser",
        //"ColecoVision",
        //"Commodore 64",
        //"Commodore PET",
        //"Commodore VIC-20",
        //"Dreamcast",
        "Emulated",
        //"FM Towns",
        //"Game & Watch",
        "Game Boy",
        "Game Boy Advance",
        "Game Boy Color",
        //"Gear VR",
        //"Gizmondo",
        //"Google Stadia",
        //"Intellivision",
        //"Interactive Movie",
        //"iOS",
        //"Linux",
        //"Mac",
        //"Mobile",
        //"MSX",
        //"N-Gage",
        //"NEC PC-88",
        //"NEC PC-98",
        //"NEC PC-FX",
        //"Neo Geo",
        //"Neo Geo CD",
        //"Neo Geo Pocket",
        //"NES",
        "Nintendo 3DS",
        "Nintendo 64",
        "Nintendo DS",
        "Nintendo GameCube",
        "Nintendo Switch",
        //"Oculus Go",
        //"Oculus Quest",
        //"Odyssey",
        //"Odyssey 2",
        //"OnLive",
        //"Ouya",
        "PC",
        //"PC VR",
        //"Philips CD-i",
        //"Playdate",
        //"PlayStation",
        "PlayStation 2",
        //"PlayStation 3",
        "PlayStation 4",
        "PlayStation 5",
        //"PlayStation Mobile",
        //"PlayStation Now",
        //"PlayStation Portable",
        //"PlayStation Vita",
        //"PlayStation VR",
        //"Plug & Play",
        //"Sega 32X",
        //"Sega CD",
        //"Sega Game Gear",
        //"Sega Master System",
        //"Sega Mega Drive/Genesis",
        //"Sega Pico",
        //"Sega Saturn",
        //"SG-1000",
        //"Sharp X1",
        //"Sharp X68000",
        //"Super Nintendo",
        //"Tiger Handheld",
        //"TurboGrafx-16",
        //"TurboGrafx-CD",
        //"Virtual Boy",
        "Wii",
        "Wii U",
        //"Windows Phone",
        //"WonderSwan",
        //"Xbox",
        "Xbox 360",
        "Xbox One",
        "Xbox Series X/S",
        //"Zeebo",
        //"ZX81",
        //"ZX Spectrum",
    ];

    // ========================================================================================================================
    // ========================================================================================================================

    // constants and vars
    let USERNAME = ""; // username. found at top right of page. no need to change, will obtain automatically
    var TIMER;
    var BUTTON_TIMER;
    let SEARCH_BAR = undefined;
    let PLATFORM = "PC"; // determined from dropdown
    let COMPLETED_GAMES = [];
    const LIST_MAP = new Map([
        ["Playing", "list_p"],
        ["Backlog", "list_b"],
        ["Replays", "list_r"],
        ["Completed", "list_cp"],
        ["Retired", "list_rt"],
        ["Custom Tab", "list_c"]
    ]);

    //=========================================================================================================================
    //=========================================================================================================================

    const post = (path, params, method = 'post') => {
        const form = document.createElement('form');
        form.method = method;
        form.action = path;
        form.target = "hiddenFrame"; // native alternative: "__tcfapiLocator"

        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                const hiddenField = document.createElement('input');
                hiddenField.type = 'hidden';
                hiddenField.name = key;
                hiddenField.value = params[key];

                form.appendChild(hiddenField);
            }
        }

        document.body.appendChild(form);
        form.submit();
    };

    const sendQuickAddRequest = (name, id) => {
        /*
        Request URL: https://howlongtobeat.com/submit
        Request Method: POST
        Status Code: 302
        Referrer Policy: strict-origin-when-cross-origin
        */

        const data = {
            user_id: USER_ID,
            edit_id: "0",
            game_id: id,
            custom_title: name,
            platform: PLATFORM,
            storefront: "",
            protime_h: "",
            protime_m: "",
            protime_s: "",
            rt_notes: "",
            compmonth: DATE.split("/")[0],
            compday: DATE.split("/")[1],
            compyear: DATE.split("/")[2],
            play_num: "0",
            c_main_h: "",
            c_main_m: "",
            c_main_s: "",
            c_main_notes: "",
            c_plus_h: "",
            c_plus_m: "",
            c_plus_s: "",
            c_plus_notes: "",
            c_100_h: "",
            c_100_m: "",
            c_100_s: "",
            c_100_notes: "",
            c_speed_h: "",
            c_speed_m: "",
            c_speed_s: "",
            c_speed_notes: "",
            c_speed100_h: "",
            c_speed100_m: "",
            c_speed100_s: "",
            c_speed100_notes: "",
            cotime_h: "",
            cotime_m: "",
            cotime_s: "",
            mptime_h: "",
            mptime_m: "",
            mptime_s: "",
            review_score: "0",
            review_notes: "",
            play_notes: PLAY_NOTES,
            play_video: "",
            submitted: "Submit",
        };

        // what lists to add game to
        for (const list of LISTS) {
            const listVar = LIST_MAP.get(list);
            if (listVar) {
                data[listVar] = "1";
            }
        }

        post("/submit", data);
    };

    // turn a data object into a string of URL-encoded key/value pairs.
    const parameterize = data => {
        let urlEncodedData = "",
            urlEncodedDataPairs = [],
            name;
        for (name in data) {
            urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
        }

        return urlEncodedDataPairs.join("&");
    };

    const getCompletedGames = () => {
        const data = {
            queryString: SEARCH_BAR.value || "",
            n: USERNAME,
            v: "",
            playing: 0,
            backlog: 0,
            replays: 0,
            custom: 0,
            custom2: 0,
            custom3: 0,
            completed: 1,
            retired: 0,
            p: "",
            sf: "",
            sortd: "",
            h: "",
        };

        var http = new XMLHttpRequest();
        var url = '/user_games_list?page=1';
        var params = parameterize(data);
        http.open('POST', url, true);

        //Send the proper header information along with the request
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        http.onreadystatechange = function() {
            if (http.readyState === 4 && http.status === 200) {
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(http.responseText, "text/html");
                const completedGamesDOM = [...htmlDoc.getElementsByClassName('text_purple')];

                COMPLETED_GAMES = [];
                for (const cg of completedGamesDOM) {
                    COMPLETED_GAMES.push({
                        id: cg.href.split("id=")[1],
                        name: cg.innerText,
                    });
                }

                // console.log("completed games list", COMPLETED_GAMES);

                // now adjust quick add buttons as needed
                for (const btn of [...document.getElementsByClassName("quick-add-button")]) {
                    if (isGameInList(btn.gameID)) {
                        btn.mainDiv.firstElementChild.firstElementChild.style = `background-color: ${HIGHLIGHT_COLOR};`; // color highlight on success
                        btn.disabled = true;
                    }
                }
            }
        }
        http.send(params);
    };

    const isGameInList = gameID => {
        for (const game of COMPLETED_GAMES) {
            if (game.id === gameID) {
                return true;
            }
        }

        return false;
    };

    const checkResults = () => {
        const games = [...document.getElementsByClassName('in spreadsheet')];

        const gamesCustom = [];
        for (const game of games) {
            if (!game.hasButton) {
                game.hasButton = true;
                const name = game.firstElementChild.firstElementChild.innerText;
                const id = game.firstElementChild.href.split("gid=")[1];
                gamesCustom.push({
                    name,
                    id,
                });

                // quick add button
                let btn = document.createElement("button");
                btn.className = "quick-add-button";
                btn.mainDiv = game;
                btn.gameID = id;
                btn.innerHTML = "Quick Add";
                btn.onclick = () => {
                    // console.log(name, id);
                    sendQuickAddRequest(name, id);
                    game.firstElementChild.firstElementChild.style = "background-color: #00FF0035;"; // make green on success
                    btn.disabled = true;
                }
                game.appendChild(btn);
            }
        }

        // console.log("checking results...", gamesCustom);
        clearInterval(BUTTON_TIMER);
        getCompletedGames();
    };

    const createCustomOptions = () => {
        const attachDiv = document.getElementById("main_title");

        // select dropdown
        var select = document.createElement("select");
        select.onchange = () => {
            PLATFORM = select.options[select.selectedIndex].text;
            // console.log("platform is now", PLATFORM);
        };
        select.style = "position: fixed; right: 10px; top: 350px;";
        var options = PLATFORM_LIST;

        for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var el = document.createElement("option");
            el.textContent = opt;
            el.value = opt;
            select.appendChild(el);
        }

        attachDiv.appendChild(select);
    };

    const findSearchBar = () => {
		if (!USER_ID || USER_ID === "undefined") {
			console.warn("no user id, navigate to submit page to obtain");
			return;
		}

        USERNAME = document.getElementsByClassName("login")[0].firstElementChild.firstElementChild.firstElementChild.innerText;
        const searchBar = document.querySelectorAll('[name="game_name"]')[0];
        if (searchBar) {
            SEARCH_BAR = searchBar;
            console.log("search bar found", searchBar);
            const onKeyUp = searchBar.onkeyup;
            searchBar.onkeyup = (event) => {
                onKeyUp(event);
                if (BUTTON_TIMER) {
                    clearInterval(BUTTON_TIMER);
                }
                BUTTON_TIMER = setInterval(checkResults, SEARCH_TIME * 1000);
            }

            createCustomOptions();

            //<iframe name="hiddenFrame" width="0" height="0" border="0" style="display: none;"></iframe>
            // iframe to prevent page re-direct on quick add. doesn't matter if site doesn't allow "X-Frame-Options", since only target
            let iframe = document.createElement("iframe");
            iframe.name = "hiddenFrame";
            iframe.width = 0;
            iframe.height = 0;
            iframe.border = 0;
            iframe.style = "display: none;";
            document.body.appendChild(iframe);

            return;
        }

        console.warn("search bar not found");
    };

	const getUserID = () => {
		if (!USER_ID) {
			USER_ID = localStorage.getItem("tmp_user_id");
			const tmpUserID = document.querySelectorAll('[name="user_id"]')[0]?.value;
			USER_ID = USER_ID || tmpUserID;
			localStorage.setItem("tmp_user_id", USER_ID);
			console.info("user id", USER_ID);
		}

		findSearchBar();
	};

    window.addEventListener('load', function() {
        TIMER = setTimeout(getUserID, WAIT_TIME * 1000);
    }, false);

})();
