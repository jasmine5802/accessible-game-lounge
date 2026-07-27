'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, 'game-help.js'), 'utf8');

assert(source.includes('Would you like instructions? Press Y for yes or N for no.'), 'Missing instructions Y/N prompt text.');
assert(source.includes('Would you like the keyboard commands? Press Y for yes or N for no.'), 'Missing keyboard commands Y/N prompt text.');
assert(source.includes('Would you like to set up game options? Press Y for yes or N for no.'), 'Missing options Y/N prompt text.');
assert(source.includes('function parseYesNoKey(event)'), 'Missing normalized Y/N key parser.');
assert(source.includes('function handlePromptKeys(event,isKeyup=false)'), 'Missing unified prompt key handler.');
assert(source.includes("if(isKeyup&&lastPromptKey===yesNo&&(event.timeStamp-lastPromptKeyTime)<700)return;"), 'Missing keyup dedupe to prevent accidental double-advance.');
assert(source.includes("const keyCode=Number(event.keyCode||event.which||0);if(keyCode===89)return'y';if(keyCode===78)return'n';"), 'Missing legacy keyCode fallback for Y/N prompts.');
assert(source.includes("document.addEventListener('keypress',event=>{if(!['how','keys','options','computer'].includes(startStage))return;if(parseYesNoKey(event))handlePromptKeys(event,false);},true);"), 'Missing keypress fallback listener for Y/N prompts.');
assert(source.includes("document.addEventListener('keyup',event=>{if(['y','n','Y','N'].includes(event.key))handlePromptKeys(event,true);},true);"), 'Missing keyup fallback listener for Y/N prompts.');
assert(source.includes("if(startStage==='how'){if(answerYes)"), 'Missing instructions stage decision branch.');
assert(source.includes("else ask('keys')"), 'Missing N->bypass behavior from instructions to keyboard commands.');
assert(source.includes("else if(startStage==='keys'){if(answerYes)"), 'Missing keyboard commands stage decision branch.');
assert(source.includes("else afterKeys()"), 'Missing N->bypass behavior from keyboard commands to options/start.');

console.log('Y/N setup flow checks passed for instructions, keyboard commands, and bypass paths.');
