'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, 'ducks-race.html'), 'utf8');
const source = fs.readFileSync(path.join(__dirname, 'ducks-race.js'), 'utf8');
const skipBo = fs.readFileSync(path.join(__dirname, 'skipbo.js'), 'utf8');
const horseRace = fs.readFileSync(path.join(__dirname, 'horserace.js'), 'utf8');
const dominoes = fs.readFileSync(path.join(__dirname, 'dominoes.js'), 'utf8');
const uno = fs.readFileSync(path.join(__dirname, 'uno.js'), 'utf8');

assert.match(html, /id="cards"[^>]*role="listbox"[^>]*aria-label="Your cards"/, 'The Duck Race hand must be exposed as a named listbox.');
assert(source.includes("item.setAttribute('role', 'option')"), 'Each Duck Race card must be exposed as an option.');
assert(source.includes('item.tabIndex = index === selectedCardIndex ? 0 : -1'), 'Only the selected card should be in the tab order.');
assert(source.includes("item.setAttribute('aria-selected', String(index === selectedCardIndex))"), 'The selected card must be conveyed to screen readers.');
assert(source.includes("if (event.key === 'ArrowUp' || event.key === 'ArrowDown')") && source.includes('else cycleCard(direction)'), 'Up and Down must cycle through the hand.');
assert(html.includes("role=\"listbox\" aria-label=\"Card targets\"") && source.includes("item.setAttribute('aria-selected', String(index === selectedTargetIndex))"), 'Duck Race player targets must expose selection to screen readers.');
assert(skipBo.includes('li.tabIndex = selection.source === \'hand\'') && skipBo.includes('el.hand.children[index]?.focus()'), 'Skip-Bo arrows must move screen-reader focus through the hand.');
assert(horseRace.includes("b.setAttribute('aria-label',`${cardText(name)} Card ${index+1} of ${game.myHand.length}.`)") && horseRace.includes("b.setAttribute('aria-disabled',String(!active))"), 'Horse Race cards must stay readable outside the player turn.');
assert(dominoes.includes("button.setAttribute('aria-label',`${tileText(shown)}. Tile ${index+1} of ${game.myHand.length}.`)") && dominoes.includes("button.setAttribute('aria-disabled',String(!active))"), 'Domino tiles must stay readable outside the player turn.');
assert(uno.includes("li.setAttribute('role','option')") && uno.includes('li.tabIndex=index===selected?0:-1'), 'UNO and DOS cards must expose focused listbox options.');

console.log('Card-hand and player-target accessibility checks passed for every card game.');
