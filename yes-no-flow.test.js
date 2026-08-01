'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, 'game-help.js'), 'utf8');

assert(source.includes("Would you like to hear the instructions for Duck Race?")
  && source.includes("Would you like to hear the keyboard commands for Duck Race?")
  && source.includes("Would you like to configure Duck Race game options?")
  && source.includes("'Instructions?'")
  && source.includes("'Keyboard commands?'"), 'Missing Duck-specific or generic Y/N prompt text.');
assert(source.includes("if(startStage==='how')startContent.textContent='Instructions?'") && source.includes("else if(startStage==='keys')startContent.textContent='Keyboard commands?'") && source.includes("else if(startStage==='options')startContent.textContent='Game options?'") && source.includes("else if(startStage==='computer')startContent.textContent='Add one computer opponent?';"), 'Missing RS-style prompt reminder text.');
assert(source.includes("function announcePrompt(text)"), 'Missing spoken prompt announcer for blind-player flow.');
assert(source.includes('utterance.rate=1;utterance.pitch=1'), 'Shared prompt speech must use the standard rate and pitch.');
assert(source.includes("yesNoRow.hidden=true"), 'Prompt buttons are still visible; expected keyboard-only Y/N prompt mode.');
assert(source.includes('function parseYesNoKey(event)'), 'Missing normalized Y/N key parser.');
assert(source.includes('function handlePromptKeys(event,isKeyup=false)'), 'Missing unified prompt key handler.');
assert(source.includes("if(isKeyup&&lastPromptKey===yesNo&&(event.timeStamp-lastPromptKeyTime)<700)return true;"), 'Missing keyup dedupe to prevent accidental double-advance.');
assert(source.includes("const keyCode=Number(event.keyCode||event.which||0);if(keyCode===89)return'y';if(keyCode===78)return'n';"), 'Missing legacy keyCode fallback for Y/N prompts.');
assert(source.includes("document.addEventListener('keypress',event=>{if(!['how','keys','options','computer'].includes(startStage))return;if(parseYesNoKey(event))handlePromptKeys(event,false);},true);"), 'Missing keypress fallback listener for Y/N prompts.');
assert(source.includes("document.addEventListener('keyup',event=>{if(['y','n','Y','N'].includes(event.key))handlePromptKeys(event,true);},true);"), 'Missing keyup fallback listener for Y/N prompts.');
assert(source.includes('function visibleOptionControls()') && source.includes('function nextVisibleOption(currentControl)') && source.includes('function submitOptionSelection(advance=false,currentControl=null)'), 'Missing RS-style option advance flow.');
assert(source.includes('function selectByShortcut(control,key)') && source.includes('function applyOptionShortcut(key)'), 'Missing shortcut-driven option selection helpers.');
assert(source.includes("/^[a-z]$/.test(key)") && source.includes('&&applyOptionShortcut(key)'), 'Missing letter-key shortcut handling for options.');
assert(source.includes("optionsForm.addEventListener('keydown',event=>{if(event.key!=='Enter')return;const control=event.target;if(!['SELECT','INPUT'].includes(control.tagName))return;event.preventDefault();submitOptionSelection(true,control)});"), 'Missing Enter-to-save-and-advance option handling.');
assert(source.includes('function moveOptionSelection(control,event)') && source.includes("keyCode===40") && source.includes("keyCode===38"), 'Option selectors must explicitly support modern and legacy Up/Down keys.');
assert(source.includes('control.dispatchEvent(new Event(\'change\',{bubbles:true}))') && source.includes('if(!isKeyup&&moveOptionSelection(target,event))'), 'Arrow-key option changes must update dependent choices and be handled during setup.');
assert(source.includes('currentControl.focus();announcePrompt'), 'Letter shortcuts must keep focus on the option selector.');
assert(source.includes("if(!isKeyup&&event.key==='Enter'&&startStage===null"), 'Missing Enter-to-start behavior after setup is complete.');
assert(source.includes("startStage='ready'") && source.includes('Setup complete. Press Enter to start the game.'), 'Hosts must remain in the setup prompt until Enter starts the game.');
assert(source.includes("if(startStage==='ready')") && source.includes('startGameFromPrompt()'), 'The ready prompt must start the game with Enter.');
assert(source.includes("if(startDialog.open)startDialog.close();start.click()"), 'Enter must close the modal before activating the otherwise inert Start button.');
assert(source.includes('function reopenReadyPrompt(message)') && source.includes("if(startStage==='starting'&&!start.hidden)"), 'A failed start must restore the ready prompt.');
assert(source.includes("if(startStage==='how'){if(answerYes)"), 'Missing instructions stage decision branch.');
assert(source.includes("else ask('keys')"), 'Missing N->bypass behavior from instructions to keyboard commands.');
assert(source.includes("else if(startStage==='keys'){if(answerYes)"), 'Missing keyboard commands stage decision branch.');
assert(source.includes("else afterKeys()"), 'Missing N->bypass behavior from keyboard commands to options/start.');
assert(source.includes("function afterKeys(){ask('options')}"), 'Every game, including Monopoly, must ask before opening options.');
assert(source.includes('Monopoly table settings could not load.'), 'Monopoly options need a recoverable missing-room error.');

console.log('Y/N setup flow checks passed for instructions, keyboard commands, and bypass paths.');
