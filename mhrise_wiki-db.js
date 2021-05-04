// ==UserScript==
// @name         MHRise Wiki Set Builder Improvements
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds some quality of life improvements to the wiki's set builder tool
// @author       InfexiousBand
// @match        https://mhrise.wiki-db.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    let chosenOne = undefined;
    var TIMER;
    const WAIT_TIME = 3; //how many seconds to wait before running script. if you have errors or if you have slow page load times (cause of internet?), try increasing this

    const labelDropdowns = () => {
        clearInterval(TIMER);
        var parentDiv = document.getElementById("Botanist").parentElement;
        var skillDropdowns = [...parentDiv.children].filter(x => x.id);

        // sort by skill names, alphabetically
        skillDropdowns.sort((a, b) => {
            if (a.id < b.id) { return -1; }
            if (a.id > b.id) { return 1; }
            return 0;
        });

        for (const dd of skillDropdowns) {
            var testLabel = document.createElement("label");
            testLabel.setAttribute("for", dd.id);
            testLabel.innerHTML = dd.id;
            testLabel.style.padding = "5px";
            testLabel.style.cursor = "pointer";
            testLabel.style.textDecoration = "underline";

            testLabel.onclick = () => onLabelClick(dd);
            document.body.appendChild(testLabel);
        }
    }

    const onLabelClick = newChosenOne => {
        if (chosenOne) {
            chosenOne.style.outline = "";
        }

        chosenOne = newChosenOne;
        console.log(chosenOne);
        chosenOne.style.outline = "solid red";
    }

    window.addEventListener('load', function() {
        TIMER = setInterval(labelDropdowns(), WAIT_TIME * 1000);
    }, false);

})();
