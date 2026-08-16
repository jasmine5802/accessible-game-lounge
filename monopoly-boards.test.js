'use strict';

const assert = require('node:assert/strict');
const MonopolyBoards = require('./monopoly-boards');

const board = MonopolyBoards.createBoard('Classic');
const brown = board.filter(space => space.group === 'brown');
const lightBlue = board.filter(space => space.group === 'light-blue');
const owners = {
  [brown[0].index]: 'player-one',
  [lightBlue[0].index]: 'player-one'
};

let progress = MonopolyBoards.ownershipProgress(board, owners, 'player-one');
assert.deepEqual(progress.map(group => [group.group, group.owned, group.total, group.needed, group.complete]), [
  ['brown', 1, 2, 1, false],
  ['light-blue', 1, 3, 2, false]
]);
assert.deepEqual(progress[0].properties, [brown[0].name]);

owners[brown[1].index] = 'player-one';
progress = MonopolyBoards.ownershipProgress(board, owners, 'player-one');
assert.equal(progress[0].complete, true);
assert.equal(progress[0].needed, 0);
assert.deepEqual(MonopolyBoards.ownershipProgress(board, owners, 'player-two'), []);

const christmasCarol = MonopolyBoards.createBoard('A Christmas Carol');
assert.equal(christmasCarol.length, 40);
assert.equal(christmasCarol.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(christmasCarol.filter(space => space.type === 'Transit').map(space => space.name), ['Ghost of Jacob Marley', 'Ghost of Christmas Past', 'Ghost of Christmas Present', 'Ghost of Christmas Yet to Come']);
assert.deepEqual(christmasCarol.filter(space => space.type === 'Utility').map(space => space.name), ['Door Knocker', 'Prize Turkey']);
assert(christmasCarol.some(space => space.name === "Scrooge and Marley's Counting House"));
assert(christmasCarol.some(space => space.name === 'Ebenezer Scrooge'));
assert.deepEqual(MonopolyBoards.tokens['A Christmas Carol'].map(token => token.name), ["Tiny Tim's Crutch", "Marley's Chain", 'Prize Turkey', 'Candle Snuffer', 'Door Knocker', "Scrooge's Nightcap"]);

const aircraft = MonopolyBoards.createBoard('Aircraft');
assert.equal(aircraft.length, 40);
assert.equal(aircraft.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(aircraft.filter(space => space.type === 'Transit').map(space => space.name), ['Boeing 747 Mixed Configuration', 'Boeing 767-300', 'Boeing 777-200', 'Boeing 777-300']);
assert.deepEqual(aircraft.filter(space => space.type === 'Utility').map(space => space.name), ['Concorde', 'Airbus A380']);
assert(aircraft.some(space => space.name === 'CRJ-100'));
assert(aircraft.some(space => space.name === 'Boeing 747-400'));
assert.deepEqual(MonopolyBoards.tokens.Aircraft.map(token => token.name), ['Jet Engine', 'Pilot Wings', 'Control Tower', 'Suitcase', 'Boarding Pass', 'Propeller']);

const alaskaUsaopoly = MonopolyBoards.createBoard('Alaska Edition Monopoly (1996) (USAopoly)');
assert.equal(alaskaUsaopoly.length, 40);
assert.equal(alaskaUsaopoly.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(alaskaUsaopoly.filter(space => space.type === 'Transit').map(space => space.name), ['White Pass Railroad', 'Dog Sled', 'Float Plane', 'Cruise Ship']);
assert.deepEqual(alaskaUsaopoly.filter(space => space.type === 'Utility').map(space => space.name), ['Pipeline', 'Northern Lights']);
assert(alaskaUsaopoly.some(space => space.name === 'Arctic Sunset'));
assert(alaskaUsaopoly.some(space => space.name === 'Mount McKinley'));
assert.deepEqual(MonopolyBoards.tokens['Alaska Edition Monopoly (1996) (USAopoly)'].map(token => token.name), ['Silver Salmon', 'Moose', 'Dog Sled', 'Float Plane', 'Cruise Ship', 'Bald Eagle']);

const halloween = MonopolyBoards.createBoard('Aspects of Halloween');
assert.equal(halloween.length, 40);
assert.equal(halloween.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(halloween.filter(space => space.type === 'Transit').map(space => space.name), ['Stores Decorated for Halloween', 'Terrifying Treats', 'Treat Bags', 'Wolf Howls']);
assert.deepEqual(halloween.filter(space => space.type === 'Utility').map(space => space.name), ['Costume Parades', 'Trick-or-Treaters']);
assert.equal(halloween.find(space => space.type === 'Go').name, 'Happy Halloween');
assert.equal(halloween.find(space => space.type === 'Jail').name, "Frankenstein's Lab");
assert.equal(halloween.find(space => space.type === 'Free Parking').name, 'Trick or Treat');
assert.deepEqual(halloween.filter(space => space.type === 'Tax').map(space => space.name), ['Costume Purchase', 'Candy Purchase']);
assert.deepEqual(MonopolyBoards.tokens['Aspects of Halloween'].map(token => token.name), ['Candy Corn', 'Bat', 'Black Cat', 'Pumpkin', 'Skeleton', 'Witch']);

const atlanta = MonopolyBoards.createBoard('Atlanta');
assert.equal(atlanta.length, 40);
assert.equal(atlanta.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(atlanta.filter(space => space.type === 'Transit').map(space => space.name), ['Five Points Station', 'Hartsfield Atlanta International Airport', 'Martin Luther King Station', 'Delta Airlines']);
assert.deepEqual(atlanta.filter(space => space.type === 'Utility').map(space => space.name), ['Georgia Power', 'Atlanta Gas and Light Company']);
assert(atlanta.some(space => space.name === 'The Griffin Company'));
assert(atlanta.some(space => space.name === 'Maier and Berkele Jewelers'));
assert.deepEqual(MonopolyBoards.tokens.Atlanta.map(token => token.name), ['Georgia Peach', 'Griffin', 'MARTA Train', 'Airplane', 'Coca-Cola Bottle', 'Atlanta Skyline']);

const baseball = MonopolyBoards.createBoard('Baseball');
assert.equal(baseball.length, 40);
assert.equal(baseball.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(baseball.filter(space => space.type === 'Transit').map(space => space.name), ['Yankee Stadium', 'Fenway Park', 'Wrigley Field', 'Hall of Fame Museum']);
assert.deepEqual(baseball.filter(space => space.type === 'Utility').map(space => space.name), ['Mutual Broadcasting System', 'ESPN']);
assert(baseball.some(space => space.name === 'Tampa Bay Devil Rays'));
assert(baseball.some(space => space.name === 'New York Yankees'));
assert.deepEqual(MonopolyBoards.tokens.Baseball.map(token => token.name), ['Baseball', 'Baseball Bat', 'Fielding Glove', "Catcher's Mask", 'Championship Pennant', 'Ballpark Hot Dog']);

const beatles = MonopolyBoards.createBoard('The Beatles');
assert.equal(beatles.length, 40);
assert.equal(beatles.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(beatles.filter(space => space.type === 'Transit').map(space => space.name), ['The Mersey', 'Yellow Submarine', 'Hollywood Bowl', 'Film Studios']);
assert.deepEqual(beatles.filter(space => space.type === 'Utility').map(space => space.name), ['Amplified Electricity', 'Aquatics Inc.']);
assert(beatles.some(space => space.name === 'Abbey Road'));
assert(beatles.some(space => space.name === 'Paul McCartney'));
assert.deepEqual(MonopolyBoards.tokens['The Beatles'].map(token => token.name), ['Yellow Submarine', 'Acoustic Guitar', 'Drum Kit', 'Round Glasses', 'Vinyl Record', 'Green Apple']);

const bedrock = MonopolyBoards.createBoard('Bedrock');
assert.equal(bedrock.length, 40);
assert.equal(bedrock.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(bedrock.filter(space => space.type === 'Transit').map(space => space.name), ['Pterodactyl Airlines', 'Bedrock Bus Company', 'Fred and Barney Railroad', 'Short Slab Railroad']);
assert.deepEqual(bedrock.filter(space => space.type === 'Utility').map(space => space.name), ['Bedrock Firewood Supply', 'Aqueduct']);
assert(bedrock.some(space => space.name === 'Medatter Rockean Avenue'));
assert(bedrock.some(space => space.name === 'Chateau Rockon Bleu'));
assert.deepEqual(MonopolyBoards.tokens.Bedrock.map(token => token.name), ['Stone-Wheel Car', 'Dinosaur', 'Bowling Ball', 'Stone Club', 'Brontosaurus Rib', 'Slate Tablet']);

const boston = MonopolyBoards.createBoard('Boston');
assert.equal(boston.length, 40);
assert.equal(boston.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(boston.filter(space => space.type === 'Transit').map(space => space.name), ['Massport', 'North Station', 'The Boston Common Parking Garage', 'South Station']);
assert.deepEqual(boston.filter(space => space.type === 'Utility').map(space => space.name), ['Boston Edison', 'Boston Gas']);
assert(boston.some(space => space.name === 'The Boston Public Library'));
assert(boston.some(space => space.name === 'Shreve, Crump & Low'));
assert.deepEqual(MonopolyBoards.tokens.Boston.map(token => token.name), ['Lobster', 'Tea Crate', 'Swan Boat', 'Baseball Cap', 'Freedom Trail Brick', 'Make Way for Duckling']);

const candyLand = MonopolyBoards.createBoard('Candy Land');
assert.equal(candyLand.length, 40);
assert.equal(candyLand.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(candyLand.filter(space => space.type === 'Transit').map(space => space.name), ['Rainbow Trail', 'Rainbow Pass', 'Gumdrop Pass', 'Ice Cream Sea']);
assert.deepEqual(candyLand.filter(space => space.type === 'Utility').map(space => space.name), ['Peppermint Stick Forest', 'Gumdrop Mountains']);
assert(candyLand.some(space => space.name === 'Gingerbread Man'));
assert(candyLand.some(space => space.name === 'King Kandy'));
assert.deepEqual(MonopolyBoards.tokens['Candy Land'].map(token => token.name), ['Gingerbread Man', 'Gingerbread Woman', 'Candy Cane', 'Gumdrop', 'Lollipop', 'Ice Cream Cone']);

const chicago = MonopolyBoards.createBoard('Chicago');
assert.equal(chicago.length, 40);
assert.equal(chicago.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(chicago.filter(space => space.type === 'Transit').map(space => space.name), ['The Blue Line', 'The Green Line', 'The Red Line', 'The Brown Line']);
assert.deepEqual(chicago.filter(space => space.type === 'Utility').map(space => space.name), ['The Chicago Sun-Times', 'Chicago Water Works']);
assert(chicago.some(space => space.name === 'Ashland Avenue'));
assert(chicago.some(space => space.name === 'Willis Tower'));
assert.deepEqual(MonopolyBoards.tokens.Chicago.map(token => token.name), ['Cloud Gate', 'Deep-Dish Pizza', 'L Train', 'Chicago Hot Dog', 'Chicago Skyline', 'Chicago Bull']);

const chicagoHilton = MonopolyBoards.createBoard('Chicago Hilton Properties');
assert.equal(chicagoHilton.length, 40);
assert.equal(chicagoHilton.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(chicagoHilton.filter(space => space.type === 'Transit').map(space => space.name), ['Union Station', "O'Hare Airport", 'Midway Airport', 'Chicago Hotel Shuttle']);
assert.deepEqual(chicagoHilton.filter(space => space.type === 'Utility').map(space => space.name), ['The Chicago Sun-Times', 'Chicago Hotel Services']);
assert(chicagoHilton.some(space => space.name === 'Hampton Inn Alsip'));
assert(chicagoHilton.some(space => space.name === 'DoubleTree Chicago Magnificent Mile'));
assert.deepEqual(MonopolyBoards.tokens['Chicago Hilton Properties'].map(token => token.name), ['Hotel Key', 'Bellhop Cart', 'Suitcase', 'Hotel Pillow', 'Chicago Skyline', 'Service Bell']);

const christmasGoodies = MonopolyBoards.createBoard('Christmas Goodies');
assert.equal(christmasGoodies.length, 40);
assert.equal(christmasGoodies.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(christmasGoodies.filter(space => space.type === 'Transit').map(space => space.name), ["Rudolph's Cookie Kisses", "Santa's Victorian Candy Canes", 'Snowman Cupcakes', 'Peppermint Punch']);
assert.deepEqual(christmasGoodies.filter(space => space.type === 'Utility').map(space => space.name), ['Christmas Eve Cinnamon Buns', 'Christmas Morning Cinnamon Toast']);
assert.equal(christmasGoodies.find(space => space.type === 'Go').name, 'The Buffet Table');
assert.equal(christmasGoodies.find(space => space.type === 'Jail').name, 'The Trash Can');
assert.equal(christmasGoodies.find(space => space.type === 'Free Parking').name, 'The Christmas Party');
assert.deepEqual(christmasGoodies.filter(space => space.type === 'Tax').map(space => space.name), ['Entrance Fee', 'Food Purchase']);
assert.deepEqual(MonopolyBoards.tokens['Christmas Goodies'].map(token => token.name), ['Angel', 'Bell', 'Candy Cane', 'Ceramic Mug', 'Gingerbread Man', 'Snowman']);

const cleveland = MonopolyBoards.createBoard('Cleveland');
assert.equal(cleveland.length, 40);
assert.equal(cleveland.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(cleveland.filter(space => space.type === 'Transit').map(space => space.name), ['Red Line', 'Blue Line', 'Green Line', 'Continental Airlines']);
assert.deepEqual(cleveland.filter(space => space.type === 'Utility').map(space => space.name), ['Cleveland Public Power', 'City of Cleveland Water']);
assert(cleveland.some(space => space.name === 'Cleveland Metroparks Zoo'));
assert(cleveland.some(space => space.name === 'Rock and Roll Hall of Fame Museum'));
assert.deepEqual(MonopolyBoards.tokens.Cleveland.map(token => token.name), ['Rock Hall Guitar', 'Terminal Tower', 'Lake Erie Ship', 'Rapid Train', 'Football Helmet', 'Pierogi']);

const computer = MonopolyBoards.createBoard('Computer');
assert.equal(computer.length, 40);
assert.equal(computer.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(computer.filter(space => space.type === 'Transit').map(space => space.name), ['DOS', 'Windows 11', 'Floppy Drive', 'Computer Network']);
assert.deepEqual(computer.filter(space => space.type === 'Utility').map(space => space.name), ['Sound Card', 'Motherboard']);
assert(computer.some(space => space.name === 'Digital Camera'));
assert(computer.some(space => space.name === 'Linux'));
assert(computer.some(space => space.name === 'macOS'));
assert.deepEqual(MonopolyBoards.tokens.Computer.map(token => token.name), ['Laptop', 'Keyboard', 'Mouse', 'Joystick', 'Compact Disc', 'Microchip']);

const countryMusic = MonopolyBoards.createBoard('Country Music');
assert.equal(countryMusic.length, 40);
assert.equal(countryMusic.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(countryMusic.filter(space => space.type === 'Transit').map(space => space.name), ['Wabash Cannonball', 'City of New Orleans', 'Old 97', 'Silver Eagle']);
assert.deepEqual(countryMusic.filter(space => space.type === 'Utility').map(space => space.name), ['WSM Radio', 'Jamboree in the Hills']);
assert(countryMusic.some(space => space.name === 'Gene Autry'));
assert(countryMusic.some(space => space.name === 'Patsy Cline'));
assert.deepEqual(MonopolyBoards.tokens['Country Music'].map(token => token.name), ['Cowboy Hat', 'Acoustic Guitar', 'Silver Eagle', 'Country Train', 'Radio Microphone', 'Western Boot']);

const dallas = MonopolyBoards.createBoard('Dallas');
assert.equal(dallas.length, 40);
assert.equal(dallas.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(dallas.filter(space => space.type === 'Transit').map(space => space.name), ['Dallas Union Station', 'Dallas Love Field', 'Victory Station', 'Southwest Airlines']);
assert.deepEqual(dallas.filter(space => space.type === 'Utility').map(space => space.name), ['TXU Energy', 'Lone Star Gas']);
assert(dallas.some(space => space.name === 'Dealey Plaza'));
assert(dallas.some(space => space.name === 'Texas Stadium'));
assert.deepEqual(MonopolyBoards.tokens.Dallas.map(token => token.name), ['Reunion Tower', 'Cowboy Hat', 'Longhorn', 'Southwest Airplane', 'Cowboy Boot', 'Lone Star']);

const dallasHilton = MonopolyBoards.createBoard('Dallas Area Hilton Properties');
assert.equal(dallasHilton.length, 40);
assert.equal(dallasHilton.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(dallasHilton.filter(space => space.type === 'Transit').map(space => space.name), ['DFW Airport', 'Union Station', 'Love Field Hotel Shuttle', 'Dallas Hotel Express']);
assert.deepEqual(dallasHilton.filter(space => space.type === 'Utility').map(space => space.name), ['TXU Energy', 'Hilton Guest Services']);
assert(dallasHilton.some(space => space.name === 'Hilton Arlington'));
assert(dallasHilton.some(space => space.name === 'DoubleTree Campbell Centre'));
assert.deepEqual(MonopolyBoards.tokens['Dallas Area Hilton Properties'].map(token => token.name), ['Hotel Key', 'Bellhop Cart', 'Suitcase', 'Hotel Pillow', 'Dallas Skyline', 'Service Bell']);

const disneyParks = MonopolyBoards.createBoard('Disney Parks');
assert.equal(disneyParks.length, 40);
assert.equal(disneyParks.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(disneyParks.filter(space => space.type === 'Transit').map(space => space.name), ['Disneyland Monorail', 'Disneyland Railroad', 'Walt Disney World Monorail', 'Walt Disney World Railroad']);
assert.deepEqual(disneyParks.filter(space => space.type === 'Utility').map(space => space.name), ['Carousel of Progress', 'Spaceship Earth']);
assert(disneyParks.some(space => space.name === 'Alice in Wonderland'));
assert(disneyParks.some(space => space.name === 'Cinderella Castle'));
assert.deepEqual(MonopolyBoards.tokens['Disney Parks'].map(token => token.name), ['Castle', 'Mouse Ears', 'Monorail', 'Pirate Ship', 'Haunted Mansion', 'Space Rocket']);

const disney = MonopolyBoards.createBoard('Disney');
assert.equal(disney.length, 40);
assert.equal(disney.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(disney.filter(space => space.type === 'Transit').map(space => space.name), ['Acme Factory', 'Monstropolis', 'Neverland', 'Wonderland']);
assert.deepEqual(disney.filter(space => space.type === 'Utility').map(space => space.name), ["Geppetto's Toy Shop", 'Rescue Aid Society']);
assert(disney.some(space => space.name === "Aladdin's Palace"));
assert(disney.some(space => space.name === "Yen Sid's Castle"));
assert.deepEqual(MonopolyBoards.tokens.Disney.map(token => token.name), ['Magic Wand', 'Glass Slipper', 'Magic Lamp', 'Flying Carpet', 'Storybook', 'Castle']);

const boondocks = MonopolyBoards.createBoard('Down in the Boondocks');
assert.equal(boondocks.length, 40);
assert.equal(boondocks.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(boondocks.filter(space => space.type === 'Transit').map(space => space.name), ['Coal Train', 'Foggy Mountain Railroad', 'Farm Train Limited', 'Modern Transit Rail Lines']);
assert.deepEqual(boondocks.filter(space => space.type === 'Utility').map(space => space.name), ['Acme Coal Mining Corp.', 'Midville Port Authority']);
assert.equal(boondocks.find(space => space.type === 'Go').name, 'Get Paid');
assert.equal(boondocks.find(space => space.type === 'Jail').name, 'The Slammer');
assert.equal(boondocks.find(space => space.type === 'Free Parking').name, 'Win the Gawl-Dang Lotto');
assert.deepEqual(boondocks.filter(space => space.type === 'Tax').map(space => space.name), ['Income Tax', 'Gambling Loss']);
assert.deepEqual(MonopolyBoards.tokens['Down in the Boondocks'].map(token => token.name), ['Buck', 'Cabin', 'Mansion', 'Coal Cart', 'Tobacco Leaf', 'Farm Tractor']);

const downOnFarm = MonopolyBoards.createBoard('Down on the Farm');
assert.equal(downOnFarm.length, 40);
assert.equal(downOnFarm.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(downOnFarm.filter(space => space.type === 'Transit').map(space => space.name), ['Tool Shed', 'Chicken Coop', 'The Barn', 'Outhouse']);
assert.deepEqual(downOnFarm.filter(space => space.type === 'Utility').map(space => space.name), ['Power House', 'Well House']);
assert.equal(downOnFarm.find(space => space.type === 'Go').name, 'The Crossroads');
assert.equal(downOnFarm.find(space => space.type === 'Jail').name, 'The Calaboose');
assert.equal(downOnFarm.find(space => space.type === 'Free Parking').name, 'Win the Lottery');
assert.deepEqual(downOnFarm.filter(space => space.type === 'Tax').map(space => space.name), ['Blood Suckers', 'Screw Me Over']);
assert.deepEqual(MonopolyBoards.tokens['Down on the Farm'].map(token => token.name), ['Gold Nugget', 'Branding Iron', 'Pickup Truck', 'Horseshoe', 'Cowboy Hat', 'Boots and Spurs']);

const etBoard = MonopolyBoards.createBoard('E.T.');
assert.equal(etBoard.length, 40);
assert.equal(etBoard.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(etBoard.filter(space => space.type === 'Transit').map(space => space.name), ['Spaceship', 'Keys Van', 'Flying Bicycle', 'Government Van']);
assert.deepEqual(etBoard.filter(space => space.type === 'Utility').map(space => space.name), ['Speak & Spell', 'Communicator']);
assert(etBoard.some(space => space.name === 'The Forest'));
assert(etBoard.some(space => space.name === 'E.T.'));
assert.deepEqual(MonopolyBoards.tokens['E.T.'].map(token => token.name), ['Flying Bicycle', 'Spaceship', "Reese's Pieces", 'Communicator', 'Geranium', 'Red Hoodie']);

const flintstones = MonopolyBoards.createBoard('Flintstones');
assert.equal(flintstones.length, 40);
assert.equal(flintstones.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(flintstones.filter(space => space.type === 'Transit').map(space => space.name), ["Flintstones' Car", 'Bedrock Taxi Company', 'Bedrock Railroad', 'Bedrock International Airport']);
assert.deepEqual(flintstones.filter(space => space.type === 'Utility').map(space => space.name), ['Bedrock TV Network', 'Bedrock Water Works']);
assert(flintstones.some(space => space.name === "Flintstones' House"));
assert(flintstones.some(space => space.name === 'Honolulu-Rock'));
assert.deepEqual(MonopolyBoards.tokens.Flintstones.map(token => token.name), ['Stone Car', 'Dinosaur', 'Bowling Ball', 'Water Buffalo Hat', 'Stone Club', 'Brontosaurus Rib']);

const forbiddenCities = MonopolyBoards.createBoard('Forbidden Cities');
assert.equal(forbiddenCities.length, 40);
assert.equal(forbiddenCities.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(forbiddenCities.filter(space => space.type === 'Transit').map(space => space.name), ['Union Square', 'Skunk Train', 'Caltrain Morgan Hill', 'Metrolink']);
assert.deepEqual(forbiddenCities.filter(space => space.type === 'Utility').map(space => space.name), ['Edison', 'San Francisco Power Authority']);
assert(forbiddenCities.some(space => space.name === 'Landers'));
assert(forbiddenCities.some(space => space.name === 'Great America San Jose'));
assert.deepEqual(MonopolyBoards.tokens['Forbidden Cities'].map(token => token.name), ['California Road Sign', 'Passenger Train', 'Palm Tree', 'Golden Gate Bridge', 'Map Pin', 'Water Tower']);

const greatComedians = MonopolyBoards.createBoard('Great Comedians');
assert.equal(greatComedians.length, 40);
assert.equal(greatComedians.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(greatComedians.filter(space => space.type === 'Transit').map(space => space.name), ['Airplane!', 'Saturday Night Live', 'Spaceballs', 'Planes, Trains and Automobiles']);
assert.deepEqual(greatComedians.filter(space => space.type === 'Utility').map(space => space.name), ['Analyze This', 'Stand-Up Spotlight']);
assert(greatComedians.some(space => space.name === 'Harry Anderson'));
assert(greatComedians.some(space => space.name === 'George Carlin'));
assert.deepEqual(MonopolyBoards.tokens['Great Comedians'].map(token => token.name), ['Microphone', 'Laughing Face', 'Spotlight', 'Comedy Stage', 'Joke Book', 'Comedy Mask']);

const hallmarkChristmas = MonopolyBoards.createBoard('Hallmark 70s and 80s');
assert.equal(hallmarkChristmas.length, 40);
assert.equal(hallmarkChristmas.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(hallmarkChristmas.filter(space => space.type === 'Transit').map(space => space.name), ['Candyville Express', 'Village Express', 'Country Express', 'Ornament Express']);
assert.deepEqual(hallmarkChristmas.filter(space => space.type === 'Utility').map(space => space.name), ['Sounds of Christmas', 'Christmas Carousel']);
assert.equal(hallmarkChristmas.find(space => space.type === 'Go').name, 'Hallmark');
assert.equal(hallmarkChristmas.find(space => space.type === 'Jail').name, 'The Storage Room');
assert.equal(hallmarkChristmas.find(space => space.type === 'Free Parking').name, 'Keepsake Club');
assert.deepEqual(hallmarkChristmas.filter(space => space.type === 'Tax').map(space => space.name), ["Designers' Expenses", 'Shipping and Handling']);
assert.deepEqual(MonopolyBoards.tokens['Hallmark 70s and 80s'].map(token => token.name), ['Bell Wreath', 'Christmas Angel', 'Christmas Star', 'Drummer Boy', 'Jolly Snowman', 'Tin Soldier']);

const hallmarkModernChristmas = MonopolyBoards.createBoard('Hallmark 90s and 2000s');
assert.equal(hallmarkModernChristmas.length, 40);
assert.equal(hallmarkModernChristmas.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(hallmarkModernChristmas.filter(space => space.type === 'Transit').map(space => space.name), ['Claus and Company Railroad', 'Christmas Crossing', 'Rock Candy Railroad', 'Holiday Railroad']);
assert.deepEqual(hallmarkModernChristmas.filter(space => space.type === 'Utility').map(space => space.name), ['Christmas Broadcast', 'Ringing in Christmas']);
assert.equal(hallmarkModernChristmas.find(space => space.type === 'Go').name, 'Hallmark');
assert.equal(hallmarkModernChristmas.find(space => space.type === 'Jail').name, 'The Storage Room');
assert.equal(hallmarkModernChristmas.find(space => space.type === 'Free Parking').name, 'Keepsake Club');
assert.deepEqual(hallmarkModernChristmas.filter(space => space.type === 'Tax').map(space => space.name), ["Designers' Expenses", 'Shipping and Handling']);
assert.deepEqual(MonopolyBoards.tokens['Hallmark 90s and 2000s'].map(token => token.name), ['Charlie Brown', "Charlie Brown's Christmas Tree", 'Dancing Nutcracker', 'Ebenezer Scrooge', 'Grinchy Claus', 'Sugarplum Fairy']);

const hallmarkDisney = MonopolyBoards.createBoard('Hallmark Disney Ornaments');
assert.equal(hallmarkDisney.length, 40);
assert.equal(hallmarkDisney.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(hallmarkDisney.filter(space => space.type === 'Transit').map(space => space.name), ['Christmas Express', "Mickey's Locomotive", "Mickey's Jingle Bell Express", '100 Acre Express']);
assert.deepEqual(hallmarkDisney.filter(space => space.type === 'Utility').map(space => space.name), ['50 Years of Music and Fun', 'Tinker Bell Wind-Up']);
assert.equal(hallmarkDisney.find(space => space.type === 'Go').name, 'Hallmark');
assert.equal(hallmarkDisney.find(space => space.type === 'Jail').name, 'The Storage Room');
assert.equal(hallmarkDisney.find(space => space.type === 'Free Parking').name, 'Keepsake Club');
assert.deepEqual(hallmarkDisney.filter(space => space.type === 'Tax').map(space => space.name), ["Designers' Expenses", 'Shipping and Handling']);
assert.deepEqual(MonopolyBoards.tokens['Hallmark Disney Ornaments'].map(token => token.name), ['Castle', 'Cocoa Mug', 'Fairy', 'Nutcracker', 'Snowflake', 'Christmas Train']);

const hallmarkPopCulture = MonopolyBoards.createBoard('Hallmark Pop Culture');
assert.equal(hallmarkPopCulture.length, 40);
assert.equal(hallmarkPopCulture.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(hallmarkPopCulture.filter(space => space.type === 'Transit').map(space => space.name), ['Hopalong Cassidy Lunchbox', 'Super Friends Lunchbox', 'Jetsons Lunchbox', 'Malibu Barbie Lunchbox']);
assert.deepEqual(hallmarkPopCulture.filter(space => space.type === 'Utility').map(space => space.name), ['Wheel of Fortune', 'Magic 8 Ball']);
assert.equal(hallmarkPopCulture.find(space => space.type === 'Go').name, 'Hallmark');
assert.equal(hallmarkPopCulture.find(space => space.type === 'Jail').name, 'The Storage Room');
assert.equal(hallmarkPopCulture.find(space => space.type === 'Free Parking').name, 'Keepsake Club');
assert.deepEqual(hallmarkPopCulture.filter(space => space.type === 'Tax').map(space => space.name), ["Designers' Expenses", 'Shipping and Handling']);
assert.deepEqual(MonopolyBoards.tokens['Hallmark Pop Culture'].map(token => token.name), ['Ballerina Barbie', 'Batmobile', 'Bugs Bunny', 'G.I. Joe Soldier', 'Mr. Potato Head', 'Scooby-Doo']);

const halloweenGoodies2 = MonopolyBoards.createBoard('Halloween Goodies 2');
assert.equal(halloweenGoodies2.length, 40);
assert.equal(halloweenGoodies2.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(halloweenGoodies2.filter(space => space.type === 'Transit').map(space => space.name), ['Cobweb Cupcakes', 'Frankenstein Cupcakes', 'Little Pumpkin Cakes', 'Pumpkin Cupcakes']);
assert.deepEqual(halloweenGoodies2.filter(space => space.type === 'Utility').map(space => space.name), ['Bobbing Apple Punch', 'Trick-or-Treat Punch']);
assert.equal(halloweenGoodies2.find(space => space.type === 'Go').name, 'The Buffet Table');
assert.equal(halloweenGoodies2.find(space => space.type === 'Jail').name, 'The Trash Can');
assert.equal(halloweenGoodies2.find(space => space.type === 'Free Parking').name, 'The Halloween Party');
assert.deepEqual(halloweenGoodies2.filter(space => space.type === 'Tax').map(space => space.name), ['Entrance Fee', 'Food Purchase']);
assert.deepEqual(MonopolyBoards.tokens['Halloween Goodies 2'].map(token => token.name), ['Bat', 'Black Cat', 'Ghost', 'Skeleton', 'Spider', 'Witch']);

const halloweenGoodies = MonopolyBoards.createBoard('Halloween Goodies');
assert.equal(halloweenGoodies.length, 40);
assert.equal(halloweenGoodies.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(halloweenGoodies.filter(space => space.type === 'Transit').map(space => space.name), ['Black Cat Cupcakes', 'Creeping Caterpillar Cupcakes', 'Jack-o-Lantern Cupcakes', "Wigglin' Jigglin' Cupcakes"]);
assert.deepEqual(halloweenGoodies.filter(space => space.type === 'Utility').map(space => space.name), ["Eerie Witch's Brew", 'Ghoul-Aid']);
assert.equal(halloweenGoodies.find(space => space.type === 'Go').name, 'The Buffet Table');
assert.equal(halloweenGoodies.find(space => space.type === 'Jail').name, 'The Trash Can');
assert.equal(halloweenGoodies.find(space => space.type === 'Free Parking').name, 'The Halloween Party');
assert.deepEqual(halloweenGoodies.filter(space => space.type === 'Tax').map(space => space.name), ['Entrance Fee', 'Food Purchase']);
assert.deepEqual(MonopolyBoards.tokens['Halloween Goodies'].map(token => token.name), ['Gravestone', 'Gummy Worm', 'Happy Halloween Goody Bag', 'Mallow-Cream Pumpkin', 'Monster', 'Skull']);

const hollywood = MonopolyBoards.createBoard('Hollywood');
assert.equal(hollywood.length, 40);
assert.equal(hollywood.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(hollywood.filter(space => space.type === 'Transit').map(space => space.name), ['CBS Network', 'NBC Network', 'ABC Network', 'Fox Network']);
assert.deepEqual(hollywood.filter(space => space.type === 'Utility').map(space => space.name), ['Panavision Woodland Hills', 'Dolby Digital']);
assert(hollywood.some(space => space.name === 'Hollywood & Vine'));
assert(hollywood.some(space => space.name === 'Paramount'));
assert.deepEqual(MonopolyBoards.tokens.Hollywood.map(token => token.name), ['Film Reel', 'Clapperboard', 'Hollywood Star', 'Movie Camera', 'Award Statue', 'Limousine']);

const houston = MonopolyBoards.createBoard('Houston');
assert.equal(houston.length, 40);
assert.equal(houston.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(houston.filter(space => space.type === 'Transit').map(space => space.name), ['Metro', 'Port of Houston Authority', 'BMW', 'Southwest Airlines']);
assert.deepEqual(houston.filter(space => space.type === 'Utility').map(space => space.name), ['Houston Lighting & Power', 'Southwestern Bell']);
assert(houston.some(space => space.name === 'Theater District'));
assert(houston.some(space => space.name === 'Astrodome'));
assert.deepEqual(MonopolyBoards.tokens.Houston.map(token => token.name), ['Space Rocket', 'Cowboy Hat', 'Oil Derrick', 'Astronaut Helmet', 'Rodeo Boot', 'Houston Skyline']);

const indianapolis = MonopolyBoards.createBoard('Indianapolis');
assert.equal(indianapolis.length, 40);
assert.equal(indianapolis.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(indianapolis.filter(space => space.type === 'Transit').map(space => space.name), ['American Trans Air', 'Union Station', 'Indiana Railroad', 'IndyGo']);
assert.deepEqual(indianapolis.filter(space => space.type === 'Utility').map(space => space.name), ['IPALCO Enterprises', 'Ameritech']);
assert(indianapolis.some(space => space.name === "The Children's Museum"));
assert(indianapolis.some(space => space.name === 'Indianapolis Speedway'));
assert.deepEqual(MonopolyBoards.tokens.Indianapolis.map(token => token.name), ['Indy Race Car', 'Checkered Flag', 'Soldiers and Sailors Monument', 'Basketball', 'Passenger Train', 'Museum Dinosaur']);

const kansasCity = MonopolyBoards.createBoard('Kansas City');
assert.equal(kansasCity.length, 40);
assert.equal(kansasCity.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(kansasCity.filter(space => space.type === 'Transit').map(space => space.name), ['Burlington Northern Railroad', 'Rock Island Railroad', 'Santa Fe Railroad', 'Kansas City International Airport']);
assert.deepEqual(kansasCity.filter(space => space.type === 'Utility').map(space => space.name), ['Kansas City Power & Light', 'BPU Water']);
assert(kansasCity.some(space => space.name === 'Quindaro Avenue'));
assert(kansasCity.some(space => space.name === 'Mission Hills'));
assert.deepEqual(MonopolyBoards.tokens['Kansas City'].map(token => token.name), ['City Fountain', 'Barbecue Grill', 'Shuttlecock', 'Jazz Saxophone', 'Railroad Train', 'Kansas City Skyline']);

const kansasState = MonopolyBoards.createBoard('Kansas State');
assert.equal(kansasState.length, 40);
assert.equal(kansasState.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(kansasState.filter(space => space.type === 'Transit').map(space => space.name), ['Burlington Northern', 'Santa Fe Railroad', 'Rock Island Railroad', 'Johnson County Executive Airport']);
assert.deepEqual(kansasState.filter(space => space.type === 'Utility').map(space => space.name), ['Atmos Energy', 'BPU Water']);
assert(kansasState.some(space => space.name === 'Stockton Road'));
assert(kansasState.some(space => space.name === 'Mission Hills'));
assert.deepEqual(MonopolyBoards.tokens['Kansas State'].map(token => token.name), ['Sunflower', 'Wheat Sheaf', 'American Bison', 'Covered Wagon', 'Kansas State Outline', 'Small Airplane']);

const looneyTunes = MonopolyBoards.createBoard('Looney Tunes');
assert.equal(looneyTunes.length, 40);
assert.equal(looneyTunes.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(looneyTunes.filter(space => space.type === 'Transit').map(space => space.name), ["Witch Hazel's Shuttle", "Marvin's Spaceship: The Martian Maggot", 'Wile E. Delivery', 'Rocket Airlines']);
assert.deepEqual(looneyTunes.filter(space => space.type === 'Utility').map(space => space.name), ['ACME Power', 'ACME Pipeline']);
assert(looneyTunes.some(space => space.name === 'Slowpoke Rodriguez'));
assert(looneyTunes.some(space => space.name === 'Road Runner'));
assert.deepEqual(MonopolyBoards.tokens['Looney Tunes'].map(token => token.name), ['Carrot', 'ACME Anvil', 'Rocket', 'Dynamite', 'Road Runner Feather', 'ACME Crate']);

const newYorkCity = MonopolyBoards.createBoard('New York City');
assert.equal(newYorkCity.length, 40);
assert.equal(newYorkCity.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(newYorkCity.filter(space => space.type === 'Transit').map(space => space.name), ['LaGuardia Airport', 'Penn Station', 'John F. Kennedy International Airport', 'Grand Central Station']);
assert.deepEqual(newYorkCity.filter(space => space.type === 'Utility').map(space => space.name), ['Con Edison Electric', 'Con Edison Gas']);
assert(newYorkCity.some(space => space.name === 'South Street Seaport'));
assert(newYorkCity.some(space => space.name === 'Trump Tower'));
assert.deepEqual(MonopolyBoards.tokens['New York City'].map(token => token.name), ['Yellow Taxi', 'Statue of Liberty', 'Big Apple', 'Subway Train', 'Empire State Building', 'New York Pizza']);

const nfl = MonopolyBoards.createBoard('NFL');
assert.equal(nfl.length, 40);
assert.equal(nfl.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(nfl.filter(space => space.type === 'Transit').map(space => space.name), ['The Hula Bowl', 'The Senior Bowl', 'All-Star Pro Bowl', 'Super Bowl']);
assert.deepEqual(nfl.filter(space => space.type === 'Utility').map(space => space.name), ['Radio', 'Television']);
assert(nfl.some(space => space.name === 'Indianapolis Colts'));
assert(nfl.some(space => space.name === 'Denver Broncos'));
assert(nfl.some(space => space.name === 'Washington Commanders'));
assert.deepEqual(MonopolyBoards.tokens.NFL.map(token => token.name), ['Football', 'Football Helmet', 'Goalpost', 'Championship Trophy', 'Referee Whistle', 'Football Cleat']);

const northPole = MonopolyBoards.createBoard('North Pole');
assert.equal(northPole.length, 40);
assert.equal(northPole.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(northPole.filter(space => space.type === 'Transit').map(space => space.name), ['Polar Bear Taxi Service', 'North Star Commuter Train Station', 'North Pole Express Depot', 'North Pole Express']);
assert.deepEqual(northPole.filter(space => space.type === 'Utility').map(space => space.name), ['Polar Power Company', 'North Pole Maintenance']);
assert(northPole.some(space => space.name === 'Candy Cane Shack'));
assert(northPole.some(space => space.name === 'Santa and Mrs. Claus'));
assert.deepEqual(MonopolyBoards.tokens['North Pole'].map(token => token.name), ['Candy Cane', 'Polar Bear', 'Santa Sleigh', 'Reindeer', 'Toymaker Elf', 'Santa Hat']);

const ohio = MonopolyBoards.createBoard('Ohio');
assert.equal(ohio.length, 40);
assert.equal(ohio.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(ohio.filter(space => space.type === 'Transit').map(space => space.name), ['Reading Railroad', 'Pennsylvania Railroad', 'B. & O. Railroad', 'Short Line Railroad']);
assert.deepEqual(ohio.filter(space => space.type === 'Utility').map(space => space.name), ['FirstEnergy Electric Company', 'Water Works']);
assert(ohio.some(space => space.name === 'Cleveland'));
assert(ohio.some(space => space.name === 'Rock & Roll Hall of Fame'));
assert.deepEqual(MonopolyBoards.tokens.Ohio.map(token => token.name), ['Buckeye', 'Northern Cardinal', 'Football', 'Rock Guitar', 'Roller Coaster', 'Lake Erie Lighthouse']);

const philadelphia = MonopolyBoards.createBoard('Philadelphia');
assert.equal(philadelphia.length, 40);
assert.equal(philadelphia.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(philadelphia.filter(space => space.type === 'Transit').map(space => space.name), ['Market East SEPTA Station', 'University City SEPTA Station', 'Suburban SEPTA Station', 'Frankford SEPTA Station']);
assert.deepEqual(philadelphia.filter(space => space.type === 'Utility').map(space => space.name), ['Philadelphia Electric Company', 'Philadelphia Gas Company']);
assert(philadelphia.some(space => space.name === 'Mummers Museum'));
assert(philadelphia.some(space => space.name === 'Independence Hall'));
assert.deepEqual(MonopolyBoards.tokens.Philadelphia.map(token => token.name), ['Liberty Bell', 'Cheesesteak', 'Soft Pretzel', 'Philadelphia Rowhouse', 'Museum Steps', 'SEPTA Train']);

const sanDiego = MonopolyBoards.createBoard('San Diego');
assert.equal(sanDiego.length, 40);
assert.equal(sanDiego.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(sanDiego.filter(space => space.type === 'Transit').map(space => space.name), ['Old Town Trolley Tours', 'San Diego Trolley', 'Southwest Airlines', 'San Diego Naval Base']);
assert.deepEqual(sanDiego.filter(space => space.type === 'Utility').map(space => space.name), ['San Diego Electric Company', 'San Diego Water Company']);
assert(sanDiego.some(space => space.name === "Seau's The Restaurant"));
assert(sanDiego.some(space => space.name === 'SeaWorld'));
assert.deepEqual(MonopolyBoards.tokens['San Diego'].map(token => token.name), ['Surfboard', 'Red Trolley', 'Zoo Panda', 'Navy Ship', 'California Sun', 'Baseball']);

const sanFrancisco = MonopolyBoards.createBoard('San Francisco');
assert.equal(sanFrancisco.length, 40);
assert.equal(sanFrancisco.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(sanFrancisco.filter(space => space.type === 'Transit').map(space => space.name), ['SamTrans', 'Southwest Airlines', 'Caltrain', 'Hornblower Dining Yachts']);
assert.deepEqual(sanFrancisco.filter(space => space.type === 'Utility').map(space => space.name), ['San Francisco Electric Company', 'San Francisco Water Works']);
assert(sanFrancisco.some(space => space.name === 'Coit Tower'));
assert(sanFrancisco.some(space => space.name === "Gump's"));
assert.deepEqual(MonopolyBoards.tokens['San Francisco'].map(token => token.name), ['Cable Car', 'Golden Gate Bridge', 'Pier 39 Sea Lion', 'Sourdough Bread', 'San Francisco Fog', 'Coit Tower']);

const sesameStreet = MonopolyBoards.createBoard('Sesame Street');
assert.equal(sesameStreet.length, 40);
assert.equal(sesameStreet.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(sesameStreet.filter(space => space.type === 'Transit').map(space => space.name), ["Oscar's Taxi Service", 'Furry Monster Ferry Line', 'Bus Stop', 'Sesame Street Subway']);
assert.deepEqual(sesameStreet.filter(space => space.type === 'Utility').map(space => space.name), ["Oscar's Recycling Center", "Super Grover's Phone Booth"]);
assert.equal(sesameStreet.find(space => space.type === 'Community Chest').name, 'Street Smarts');
assert.equal(sesameStreet.find(space => space.type === 'Chance').name, 'Block Party');
assert(sesameStreet.some(space => space.name === 'Official Twiddlebug Window Box'));
assert(sesameStreet.some(space => space.name === '123 Sesame Street'));
assert.deepEqual(MonopolyBoards.tokens['Sesame Street'].map(token => token.name), ['Abby Cadabby', 'Big Bird', 'Cookie Monster', 'Count von Count', 'Oscar', 'Super Grover']);

const supermarket = MonopolyBoards.createBoard('Supermarket');
assert.equal(supermarket.length, 40);
assert.equal(supermarket.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(supermarket.filter(space => space.type === 'Transit').map(space => space.name), ['Ford Pickup', 'Dodge Van', 'Volkswagen Microbus', 'Jalopy']);
assert.deepEqual(supermarket.filter(space => space.type === 'Utility').map(space => space.name), ['Pay Phone', 'Water Fountain']);
assert(supermarket.some(space => space.name === 'Canned Fruit'));
assert(supermarket.some(space => space.name === 'Porterhouse Steak'));
assert.deepEqual(MonopolyBoards.tokens.Supermarket.map(token => token.name), ['Shopping Cart', 'Grocery Basket', 'Milk Carton', 'Bread Loaf', 'Red Apple', 'Steak']);

const tacoBell = MonopolyBoards.createBoard('Taco Bell');
assert.equal(tacoBell.length, 40);
assert.equal(tacoBell.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(tacoBell.filter(space => space.type === 'Transit').map(space => space.name), ['Mild Sauce', 'Volcano Sauce', 'Hot Sauce', 'Baja Sauce']);
assert.deepEqual(tacoBell.filter(space => space.type === 'Utility').map(space => space.name), ['Oven', 'Freezer']);
assert.equal(tacoBell.find(space => space.type === 'Go').name, 'The Kitchen');
assert.equal(tacoBell.find(space => space.type === 'Jail').name, 'The Trash');
assert.equal(tacoBell.find(space => space.type === 'Free Parking').name, 'The Drive-Through');
assert.deepEqual(tacoBell.filter(space => space.type === 'Tax').map(space => space.name), ['Property Tax', 'Food Tax']);
assert.equal(tacoBell.find(space => space.type === 'Community Chest').name, 'Crunch');
assert.equal(tacoBell.find(space => space.type === 'Chance').name, 'Chomp');
assert.deepEqual(MonopolyBoards.tokens['Taco Bell'].map(token => token.name), ['Chihuahua', 'Spork', 'Sauce Packet', 'Cash Register', 'Soda Fountain', 'Drink Cup']);

const tv1 = MonopolyBoards.createBoard('TV 1');
assert.equal(tv1.length, 40);
assert.equal(tv1.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(tv1.filter(space => space.type === 'Transit').map(space => space.name), ['Knight Rider', 'CHiPs', 'My Mother the Car', 'Enterprise']);
assert.deepEqual(tv1.filter(space => space.type === 'Utility').map(space => space.name), ['WKRP in Cincinnati', 'NewsRadio']);
assert(tv1.some(space => space.name === 'Due South'));
assert(tv1.some(space => space.name === 'Quantum Leap'));
assert.deepEqual(MonopolyBoards.tokens['TV 1'].map(token => token.name), ['Television Set', 'Remote Control', 'TV Antenna', "Director's Chair", 'Studio Camera', 'Clapperboard']);

const tv2 = MonopolyBoards.createBoard('TV 2');
assert.equal(tv2.length, 40);
assert.equal(tv2.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(tv2.filter(space => space.type === 'Transit').map(space => space.name), ['Wide World of Sports', 'Monday Night Football', 'Speed Racer', 'Hardball']);
assert.deepEqual(tv2.filter(space => space.type === 'Utility').map(space => space.name), ['The Electric Company', '60 Minutes']);
assert(tv2.some(space => space.name === 'Card Sharks'));
assert(tv2.some(space => space.name === 'Married... with Children'));
assert.deepEqual(MonopolyBoards.tokens['TV 2'].map(token => token.name), ['Game Show Buzzer', 'Playing Cards', 'Question Mark', 'Prize Wheel', 'Superhero Cape', 'Family Television']);

const unitedStates = MonopolyBoards.createBoard('United States');
assert.equal(unitedStates.length, 40);
assert.equal(unitedStates.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(unitedStates.filter(space => space.type === 'Transit').map(space => space.name), ['Rhode Island Railroad', 'Pennsylvania Railroad', 'Georgia Railroad', 'Louisiana Railroad']);
assert.deepEqual(unitedStates.filter(space => space.type === 'Utility').map(space => space.name), ['Utah Electric Company', 'Hawaii Water Works']);
assert(unitedStates.some(space => space.name === 'Kansas'));
assert(unitedStates.some(space => space.name === 'Virginia'));
assert.deepEqual(MonopolyBoards.tokens['United States'].map(token => token.name), ['Bald Eagle', 'American Flag', 'Statue of Liberty', 'U.S. Capitol', 'United States Map', 'American Bison']);

const countryEraBoards = {
  '80s Country Music': ['Cassette', 'Cowboy Hat', 'Honky-Tonk Guitar', 'Tour Bus', 'Vinyl Record', 'Rodeo Star'],
  '90s Country Music': ['Compact Disc', 'Music Video Camera', 'Cowboy Boot', 'Acoustic Guitar', 'Tour Bus', 'Backstage Pass'],
  '2000s Country Music': ['MP3 Player', 'Pickup Truck', 'Country Guitar', 'Festival Ticket', 'Cowboy Hat', 'Award Trophy'],
  'Modern Country Music': ['Smartphone', 'Streaming Headphones', 'Festival Wristband', 'Acoustic Guitar', 'Tour Van', 'Neon Cowboy Hat']
};
for (const [edition, expectedTokens] of Object.entries(countryEraBoards)) {
  const eraBoard = MonopolyBoards.createBoard(edition);
  assert.equal(eraBoard.length, 40, `${edition} should have 40 spaces`);
  assert.equal(eraBoard.filter(space => space.type === 'Property').length, 22, `${edition} should have 22 properties`);
  assert.equal(eraBoard.filter(space => space.type === 'Transit').length, 4, `${edition} should have four transit spaces`);
  assert.equal(eraBoard.filter(space => space.type === 'Utility').length, 2, `${edition} should have two utilities`);
  assert.deepEqual(MonopolyBoards.tokens[edition].map(token => token.name), expectedTokens);
}

const christmas = MonopolyBoards.createBoard('Christmas');
assert.equal(christmas.length, 40);
assert.equal(christmas.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(christmas.filter(space => space.type === 'Transit').map(space => space.name), ['Decorated Carriage Ride', 'Holiday Hay Rides', 'Snowmobile', 'Sleigh Ride']);
assert.deepEqual(christmas.filter(space => space.type === 'Utility').map(space => space.name), ['Candle Shop', 'Christmas Light Store']);
assert(christmas.some(space => space.name === 'Cozy House'));
assert(christmas.some(space => space.name === "Santa's Workshop"));
assert.deepEqual(MonopolyBoards.tokens.Christmas.map(token => token.name), ['Christmas Tree', 'Poinsettia', 'Present', 'Angel', 'Sleigh Bell', 'Midnight Star']);

const classicRock = MonopolyBoards.createBoard('Classic Rock');
assert.equal(classicRock.length, 40);
assert.equal(classicRock.filter(space => space.type === 'Property').length, 22);
assert.deepEqual(classicRock.filter(space => space.type === 'Transit').map(space => space.name), ['Private Jet', 'Tour Bus', 'Motorcycle', 'Private Yacht']);
assert.deepEqual(classicRock.filter(space => space.type === 'Utility').map(space => space.name), ['CD Player', 'FM Radio']);
assert.deepEqual([...new Set(classicRock.filter(space => space.type === 'Property').map(space => space.group))], ['purple', 'cyan', 'magenta', 'gold', 'red', 'yellow', 'green', 'blue']);
assert(classicRock.some(space => space.name === 'Jefferson Starship'));
assert(classicRock.some(space => space.name === 'The Rolling Stones'));
assert.deepEqual(MonopolyBoards.tokens['Classic Rock'].map(token => token.name), ['Electric Guitar', 'Drum Kit', 'Vinyl Record', 'Tour Bus', 'Amplifier', 'Backstage Pass']);

const companionMusicBoards = {
  'Pop Music': ['Microphone', 'Pop Star', 'Headphones', 'Disco Ball', 'Stage Light', 'Gold Record'],
  'Hip Hop': ['Turntable', 'Boom Box', 'Gold Chain', 'Microphone', 'High-Top Sneaker', 'Spray Can'],
  'Old School R&B': ['Vinyl Record', 'Vintage Microphone', 'Saxophone', 'Piano', 'Heart', 'Stage Light'],
  'Country Legends': ['Cowboy Hat', 'Cowboy Boot', 'Acoustic Guitar', 'Banjo', 'Horseshoe', 'Pickup Truck'],
  '80s Dance': ['Disco Ball', 'Cassette', 'Leg Warmers', 'Boom Box', 'Neon Star', 'Roller Skate'],
  Oldies: ['Jukebox', '45 RPM Record', 'Classic Car', 'Soda Glass', 'Vintage Microphone', 'Dance Shoes'],
  '90s Music': ['Compact Disc', 'Pager', 'Cassette', 'Game Controller', 'Rollerblades', 'Flip Phone']
};
for (const [edition, expectedTokens] of Object.entries(companionMusicBoards)) {
  const musicBoard = MonopolyBoards.createBoard(edition);
  assert.equal(musicBoard.length, 40, `${edition} should have 40 spaces`);
  assert.equal(musicBoard.filter(space => space.type === 'Property').length, 22, `${edition} should have 22 properties`);
  assert.equal(musicBoard.filter(space => space.type === 'Transit').length, 4, `${edition} should have four transit spaces`);
  assert.equal(musicBoard.filter(space => space.type === 'Utility').length, 2, `${edition} should have two utilities`);
  assert.deepEqual(MonopolyBoards.tokens[edition].map(token => token.name), expectedTokens);
}

console.log('Monopoly ownership color-set progress tests passed.');
