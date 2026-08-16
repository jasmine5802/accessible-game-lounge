'use strict';

(function exposeMonopolyBoards(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MonopolyBoards = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const groups = ['brown', 'light-blue', 'pink', 'orange', 'red', 'yellow', 'green', 'dark-blue'];
  const prices = [60, 60, 100, 100, 120, 140, 140, 160, 180, 180, 200, 220, 220, 240, 260, 260, 280, 300, 300, 320, 350, 400];
  const rents = [2, 4, 6, 6, 8, 10, 10, 12, 14, 14, 16, 18, 18, 20, 22, 22, 24, 26, 26, 28, 35, 50];
  const groupSizes = [2, 3, 3, 3, 3, 3, 3, 2];

  function property(name, propertyIndex, themeName, groupNames = groups) {
    let offset = 0;
    let group = groups[0];
    for (let index = 0; index < groupSizes.length; index += 1) {
      if (propertyIndex < offset + groupSizes[index]) { group = groupNames[index] || groups[index]; break; }
      offset += groupSizes[index];
    }
    return { name, type: 'Property', group, price: prices[propertyIndex], rent: rents[propertyIndex], description: `${name} is a purchasable ${themeName} landmark in the ${group.replace('-', ' ')} color group.` };
  }

  function transport(name, themeName) { return { name, type: 'Transit', group: 'transit', price: 200, rent: 25, description: `${name} is a purchasable ${themeName} transportation space.` }; }
  function utility(name, themeName) { return { name, type: 'Utility', group: 'utility', price: 150, rent: 20, description: `${name} is a purchasable ${themeName} utility.` }; }
  function special(name, type, amount = 0) {
    const descriptions = { Go: 'Collect the board salary when you pass or land here.', 'Community Chest': 'Draw a community reward or expense.', Chance: 'Draw a surprise reward or expense.', Tax: 'Pay the displayed assessment.', Jail: 'Visit the jail area without penalty unless you were sent here.', 'Free Parking': 'Take a free rest with no payment due.', 'Go to Jail': 'Move directly to Jail.' };
    return { name, type, amount, description: descriptions[type] || `${name} special space.` };
  }

  const classicProperties = [
    'Mediterranean Avenue', 'Baltic Avenue', 'Oriental Avenue', 'Vermont Avenue', 'Connecticut Avenue',
    'St. Charles Place', 'States Avenue', 'Virginia Avenue', 'St. James Place', 'Tennessee Avenue', 'New York Avenue',
    'Kentucky Avenue', 'Indiana Avenue', 'Illinois Avenue', 'Atlantic Avenue', 'Ventnor Avenue', 'Marvin Gardens',
    'Pacific Avenue', 'North Carolina Avenue', 'Pennsylvania Avenue', 'Park Place', 'Boardwalk'
  ];

  const themeData = {
    Classic: {
      currency: 'cash', properties: classicProperties,
      transit: ['Reading Railroad', 'Pennsylvania Railroad', 'B. & O. Railroad', 'Short Line'],
      utilities: ['Electric Company', 'Water Works']
    },
    'Bakersfield Local': {
      currency: 'cash',
      properties: ['East Bakersfield', 'Chester Avenue', 'Panorama Bluffs', 'College Heights', 'Bakersfield College', 'Kern River', 'Hart Park', 'CALM Zoo', 'Rosedale Highway', 'River Walk', 'The Marketplace', "Buck Owens' Crystal Palace", 'Mechanics Bank Arena', 'Fox Theater', 'Seven Oaks', 'Stockdale Country Club', 'Kern County Museum', 'Ming Lake', 'Lake Ming Marina', 'Tejon Ranch', 'Downtown Bakersfield', 'The Padre Hotel'],
      transit: ['Golden Empire Transit', 'Amtrak Bakersfield', 'Meadows Field Airport', 'Highway 99 Express'],
      utilities: ['Kern Energy Station', 'California Water Service']
    },
    'Electronic Banking': {
      currency: 'card',
      properties: ['Pixel Plaza', 'Circuit Court', 'Cloud Commons', 'Streaming Street', 'App Arcade', 'Crypto Crescent', 'Server Square', 'Data Drive', 'Silicon Station', 'Virtual Vista', 'Neon Network', 'Innovation Hub', 'Robot Row', 'Quantum Quarter', 'Touchscreen Tower', 'Wireless Way', 'Smart Home Heights', 'Cyber City', 'Augmented Avenue', 'Digital Domain', 'AI Boulevard', 'The Mainframe'],
      transit: ['Metro Tap Line', 'Hyperloop Terminal', 'Drone Transit Hub', 'Autonomous Express'],
      utilities: ['Fusion Grid', 'Fiber Network']
    },
    'Space Exploration': {
      currency: 'cash',
      properties: ['Moon Base Alpha', 'Lunar Highlands', 'Mercury Station', 'Venus Cloud City', 'Earth Orbit', 'Mars Colony', 'Olympus Mons', 'Valles Marineris', 'Ceres Outpost', 'Asteroid Belt', 'Jupiter Station', 'Europa Ocean Lab', 'Ganymede Port', 'Saturn Ring City', 'Titan Colony', 'Enceladus Geysers', 'Uranus Station', 'Neptune Deep Space Array', 'Triton Base', 'Kuiper Belt', 'Pluto Research Camp', 'Interstellar Gateway'],
      transit: ['Cape Canaveral Space Port', 'Lunar Space Port', 'Mars Space Port', 'Deep Space Port'],
      utilities: ['Solar Array', 'Antimatter Reactor']
    },
    'Country Music Hall of Fame': {
      currency: 'cash', audioProfile: 'country',
      properties: ['Music Row', 'Honky Tonk Highway', 'Bluebird Cafe', 'Tammy Cochran Stage', 'RCA Studio B', 'Sun Records Gallery', 'Johnny Cash Museum', 'Patsy Cline Promenade', 'Dolly Parton Theater', 'Willie Nelson Way', 'Loretta Lynn Lodge', 'Ryman Auditorium', 'Hank Williams Hall', 'Reba McEntire Arena', 'Garth Brooks Pavilion', 'Shania Twain Showcase', 'Country Music Hall of Fame', 'Nashville Songwriters Hall', 'Opry Mills', 'Cumberland Concert Lawn', 'Grand Ole Opry', 'Country Legends Boulevard'],
      transit: ['Music City Star', 'Nashville Tour Bus', 'Opry Shuttle', 'Country Roads Express'],
      utilities: ['Studio Sound Board', 'Stage Lighting Company']
    },
    'Latin Music Legends': {
      currency: 'cash', audioProfile: 'latin',
      properties: ['Salsa Street', 'Bachata Boulevard', 'Selena Plaza', 'Celia Cruz Corner', 'Tito Puente Park', 'Olga Tañón Arena', 'Gloria Estefan Gardens', 'Marc Anthony Marquee', 'Shakira Square', 'Carlos Santana Stage', 'Ricky Martin Row', 'Maná Club', 'Juanes Junction', 'Luis Miguel Lounge', 'Thalía Terrace', 'Daddy Yankee District', 'Bad Bunny Boardwalk', 'Karol G Gardens', 'J Balvin Boulevard', 'Enrique Iglesias Esplanade', 'Mariana Seoane Theater', 'Legends Fiesta Palace'],
      transit: ['Caribbean Rhythm Line', 'Pan-American Express', 'Fiesta Metro', 'Latin Legends Tour Bus'],
      utilities: ['Brass Works', 'Percussion Power']
    },
    'Retro Pop & Rock Icons': {
      currency: 'cash', audioProfile: 'retro',
      properties: ['Vinyl Avenue', 'Cassette Corner', 'Jackson 5 Studio', 'Disco Drive', 'Fleetwood Mac Forum', 'Olivia Newton-John Pavilion', 'Bee Gees Ballroom', 'Blondie Boulevard', 'David Bowie Dome', 'Queen Concert Hall', 'ABBA Arena', 'Genesis Coliseum', 'Journey Junction', 'Heart Highway', 'Pat Benatar Plaza', 'Hall and Oates Hall', 'The Police Precinct', 'Eurythmics Estate', 'Duran Duran Drive', 'Cyndi Lauper Lane', 'Prince Purple Palace', 'Retro Icons Boulevard'],
      transit: ['Tour Van Line', 'Rock Star Railway', 'Pop Video Transit', 'Backstage Express'],
      utilities: ['Analog Synth Works', 'Amplifier Power Company']
    },
    'Mall Madness Crossover': {
      currency: 'cash', audioProfile: 'mall',
      properties: ['Parking Lot', 'Mall Entrance', 'Fashion Boutique', 'Shoe Store', 'Jewelry Counter', "Babbage's", 'Music Shop', 'Bookstore', 'Toy Store', 'Arcade Alley', 'Cinema Complex', 'Food Court', 'Pizza Parlor', 'Ice Cream Shop', 'Department Store', 'Beauty Salon', 'Photo Studio', 'Sporting Goods', 'Furniture Gallery', 'Electronics Superstore', 'Grand Atrium', 'Mall Madness Megastore'],
      transit: ['Escalator Express', 'Glass Elevator', 'Mall Shuttle', 'Monorail Station'],
      utilities: ['Mall Security', 'Customer Service']
    },
    'Ultimate Board Game Mashup': {
      currency: 'cash', audioProfile: 'mashup',
      properties: ['Pawn Plaza', 'Checkerboard Court', 'Skip-Bo Square', 'Candy Trail', 'Sorry Slide', 'Uno Corner', 'Chess Castle', 'Scrabble Street', 'Domino Junction', 'Clue Mansion', 'Risk Territory', 'Life Highway', 'Battleship Bay', 'Connect Four Crossing', 'Yahtzee Yard', 'Catan Harbor', 'Ticket to Ride Terminal', 'Pictionary Park', 'Trivial Pursuit Plaza', 'Sequence Station', 'Game Night Boulevard', 'Ultimate Victory Lane'],
      transit: ['Game Piece Railway', 'Spinner Transit', 'Dice Coach Line', 'Tabletop Express'],
      utilities: ['Card Deck Company', 'Game Timer Works']
    },
    'Disney Animation': {
      currency: 'cash', audioProfile: 'disney',
      properties: ['Mickey’s Toon House', 'Minnie’s Garden', 'Snow White’s Cottage', 'Pinocchio’s Workshop', 'Dumbo’s Circus', 'Never Land', 'Hundred Acre Wood', 'Wonderland Tea Garden', 'Cinderella Castle', 'Sleeping Beauty Castle', 'Agrabah Marketplace', 'Pride Rock', 'Atlantica', 'Beast’s Castle', 'Arendelle Village', 'Motunui Island', 'Zootopia Central', 'Casa Madrigal', 'Radiator Springs', 'Monstropolis', 'Walt Disney Animation Studio', 'Fantasy Kingdom'],
      transit: ['Monorail Red', 'Magic Carpet Route', 'Pixie Dust Flight', 'Storybook Express'], utilities: ['Animation Ink Works', 'Imagineering Power']
    },
    'SpongeBob SquarePants': {
      currency: { singular: 'Crabby Patty', plural: 'Crabby Patties' }, audioProfile: 'spongebob',
      properties: ['SpongeBob’s Pineapple', 'Squidward’s Tiki House', 'Patrick’s Rock', 'Jellyfish Fields', 'Goo Lagoon', 'Mrs. Puff’s Boating School', 'Sandy’s Treedome', 'Krusty Krab', 'Chum Bucket', 'Bikini Bottom Hospital', 'Barg’N-Mart', 'Glove World', 'Weenie Hut Junior’s', 'Mermaid Man Museum', 'Kelp Forest', 'Flying Dutchman’s Ship', 'Rock Bottom', 'Conch Street', 'Krusty Krab Kitchen', 'Krusty Towers', 'Bikini Bottom Downtown', 'King Neptune’s Palace'],
      transit: ['Bikini Bottom Bus', 'Invisible Boatmobile', 'Bubble Taxi', 'Submarine Express'], utilities: ['Jellyfish Power', 'Bikini Bottom Water']
    },
    'Back to the Future': {
      currency: { singular: 'Gigawatt', plural: 'Gigawatts' }, audioProfile: 'future',
      properties: ['Twin Pines Mall', 'Lone Pine Mall', 'Doc Brown’s Garage', 'Hill Valley High School', 'Lou’s Cafe 1955', 'Cafe 80s', 'Biff’s Auto Detailing', 'McFly Residence', 'Peabody Farm', 'Hill Valley Courthouse', 'Clock Tower Square', 'Enchantment Under the Sea Dance', 'Griff’s Hoverboard Track', 'Alternate 1985 Casino', 'Old West Saloon', 'Hilldale 2015', 'Jennifer’s House', 'Marty’s Garage', 'Doc’s Laboratory', 'Hill Valley Railroad Bridge', 'Temporal Junction', 'Flux Capacitor Complex'],
      transit: ['DeLorean Time Machine', 'Hoverboard Route', 'Time Train', 'Lightning Cable Express'], utilities: ['Mr. Fusion', 'Flux Capacitor']
    },
    'A Christmas Carol': {
      currency: 'cash',
      properties: ["Scrooge and Marley's Counting House", 'Fred Hollywell', 'Charity Collectors', 'Christmas Carolers', "Scrooge's Apartments", 'Sitting Room', 'Boarding School', 'Fan', "Fezziwig's Shop", 'Belle', 'Janet Hollywell', 'Cratchit House', 'Emily Cratchit', 'Tiny Tim', 'Rag Shop', 'Old Joe', 'Mrs Dilber', 'Churchyard', "Scrooge's Grave", 'Christmas Morning', 'Bob Cratchit', 'Ebenezer Scrooge'],
      transit: ['Ghost of Jacob Marley', 'Ghost of Christmas Past', 'Ghost of Christmas Present', 'Ghost of Christmas Yet to Come'],
      utilities: ['Door Knocker', 'Prize Turkey'],
      chanceName: 'Christmas Carol Chance', chestName: 'Christmas Carol Community Chest'
    },
    Aircraft: {
      currency: 'cash',
      properties: ['CRJ-100', 'ATR-32S', 'Boeing 727', 'Boeing 727-200', 'Boeing 737', 'Boeing 73G', 'Boeing 737-800', 'Airbus A319', 'Airbus A320', 'Airbus A330-200', 'Boeing MD-83', 'Boeing MD-88', 'Douglas DC-10', 'Ilyushin IL-62', 'Ilyushin IL-76', 'Boeing 757-200', 'Airbus A310-300', 'Airbus A340-300', 'Airbus A340-600', 'Douglas MD-11', 'Boeing 747', 'Boeing 747-400'],
      transit: ['Boeing 747 Mixed Configuration', 'Boeing 767-300', 'Boeing 777-200', 'Boeing 777-300'],
      utilities: ['Concorde', 'Airbus A380'],
      chanceName: 'Flight Chance', chestName: 'Airport Community Chest'
    },
    'Alaska Edition Monopoly (1996) (USAopoly)': {
      currency: 'cash',
      properties: ['Arctic Sunset', 'Silver Salmon', 'King Salmon', 'Seward Harbor', 'Otter', 'Walrus', 'Whale', 'Moose', 'Caribou', 'Wolf', 'Ketchikan', 'Juneau', 'Anchorage', 'Black Bear', 'Grizzly Bear', 'Portage Glacier', 'Polar Bear', 'Kenai Fjords', 'Glacier Bay', 'Denali National Park', 'Bald Eagle', 'Mount McKinley'],
      transit: ['White Pass Railroad', 'Dog Sled', 'Float Plane', 'Cruise Ship'],
      utilities: ['Pipeline', 'Northern Lights'],
      chanceName: 'Alaska Chance', chestName: 'Alaska Community Chest'
    },
    'Aspects of Halloween': {
      currency: 'cash',
      properties: ['Costume Contests', 'Ghost Stories by the Fire', 'Blood-curdling Screams', 'Halloween Cartoons', 'Halloween Costumes', 'Halloween Parties', 'Halloween Specialty Stores', 'Bobbing for Apples', 'The Harvest Moon', 'Haunted Houses', 'Cackling Witches', 'Hayrides', 'Horror Movies', 'Jack-o-Lanterns', 'Monster Cereals', 'Orange and Black Balloons', 'Pumpkin Patches', 'Ghostly Groans', 'Rubber Masks', "Scary Sound and Music CDs", 'Spooky Games', 'Spook Alleys'],
      transit: ['Stores Decorated for Halloween', 'Terrifying Treats', 'Treat Bags', 'Wolf Howls'],
      utilities: ['Costume Parades', 'Trick-or-Treaters'],
      goName: 'Happy Halloween', jailName: "Frankenstein's Lab", freeParkingName: 'Trick or Treat',
      incomeTaxName: 'Costume Purchase', luxuryTaxName: 'Candy Purchase',
      chanceName: 'Sound Effect', chestName: 'Party Activity'
    },
    Atlanta: {
      currency: 'cash',
      properties: ['The Griffin Company', 'Dorsey Alston Realtors', 'Fernbank', 'Zoo Atlanta', 'Atlanta Botanical Garden', "Georgia's Stone Mountain Park", 'Underground Atlanta', 'The World of Coca-Cola', 'Georgia Tech', 'Georgia State University', 'Oglethorpe University', 'Crowne Plaza', 'Hotel Nikko Atlanta', 'The Westin Peachtree Plaza Atlanta', "Macy's", "Haverty's Furniture", 'Design Limited', 'One Peachtree Center', 'Tower Place', 'Concourse', 'Mori Luggage and Gifts', 'Maier and Berkele Jewelers'],
      transit: ['Five Points Station', 'Hartsfield Atlanta International Airport', 'Martin Luther King Station', 'Delta Airlines'],
      utilities: ['Georgia Power', 'Atlanta Gas and Light Company'],
      chanceName: 'Atlanta Chance', chestName: 'Atlanta Community Chest'
    },
    Baseball: {
      currency: 'cash',
      properties: ['Tampa Bay Devil Rays', 'Kansas City Royals', 'Chicago White Sox', 'Detroit Tigers', 'Toronto Blue Jays', 'Baltimore Orioles', 'Cleveland Indians', 'Oakland Athletics', 'Chicago Cubs', 'Atlanta Braves', 'New York Mets', 'St. Louis Cardinals', 'Washington Nationals', 'Florida Marlins', 'Cincinnati Reds', 'Los Angeles Dodgers', 'San Francisco Giants', 'Los Angeles Angels of Anaheim', 'San Diego Padres', 'Philadelphia Phillies', 'Boston Red Sox', 'New York Yankees'],
      transit: ['Yankee Stadium', 'Fenway Park', 'Wrigley Field', 'Hall of Fame Museum'],
      utilities: ['Mutual Broadcasting System', 'ESPN'],
      chanceName: 'Baseball Chance', chestName: 'Baseball Community Chest'
    },
    'The Beatles': {
      currency: 'cash', audioProfile: 'retro',
      properties: ['Council House', 'George Harrison', 'The Club at Hamburg', 'The Casbah Club', 'The Pub', 'Abbey Road', 'Menlove Avenue', 'Penny Lane', 'Ringo Starr', 'Dylan Avenue', 'Presley Lane', 'Rolling Stones Ridge', 'Art College', 'Dovedale Primary', 'Quarry Bank High School', 'John Lennon', 'Norwegian Wood', 'Strawberry Fields', 'Capitol Records', 'EMI Records', 'Apple Records', 'Paul McCartney'],
      transit: ['The Mersey', 'Yellow Submarine', 'Hollywood Bowl', 'Film Studios'],
      utilities: ['Amplified Electricity', 'Aquatics Inc.'],
      chanceName: 'Beatles Chance', chestName: 'Beatles Community Chest'
    },
    Bedrock: {
      currency: 'cash', audioProfile: 'classic-tv',
      properties: ['Medatter Rockean Avenue', 'Boulder Avenue', 'Bedrock Bowling Alley', 'Water Buffalo Lodge', 'Concreetycut Avenue', "Sam Shale's Place", "Slate's Avenue", 'Montague Gypsum Road', "Joe Rockhead's Place", 'Tennessee Ment Avenue', 'New Rock Avenue', 'Kentucky Slab Road', 'Rockianna Avenue', 'Illirock Avenue', 'Atlantic Tarpits', 'Ventnorock Avenue', "Marvin's Gravel", 'Pacific Tarpits', 'North Carra Limestone Avenue', 'Pebbles Vania Avenue', 'Bedrock Towers', 'Chateau Rockon Bleu'],
      transit: ['Pterodactyl Airlines', 'Bedrock Bus Company', 'Fred and Barney Railroad', 'Short Slab Railroad'],
      utilities: ['Bedrock Firewood Supply', 'Aqueduct'],
      chanceName: 'Bedrock Chance', chestName: 'Bedrock Community Chest'
    },
    Boston: {
      currency: 'cash',
      properties: ['The Boston Public Library', 'USS Constitution Museum', 'Fenway Park', 'Boston Garden', 'The Sports Museum of New England', "The Children's Museum", 'Isabella Stewart Gardner Museum', 'The New Museum', 'Legal Sea Foods', 'The Capital Grille', 'Ye Olde Union Oyster House', "Bloomingdale's", 'Prudential Center', "Filene's", 'The Lenox Hotel', 'The Bostonian Hotel', 'The Colonnade', 'Deloitte & Touche LLP', 'Smith Barney', 'Federated Services Company', 'BankBoston', 'Shreve, Crump & Low'],
      transit: ['Massport', 'North Station', 'The Boston Common Parking Garage', 'South Station'],
      utilities: ['Boston Edison', 'Boston Gas'],
      chanceName: 'Boston Chance', chestName: 'Boston Community Chest'
    },
    'Candy Land': {
      currency: { singular: 'Candy', plural: 'Candies' },
      properties: ['Gingerbread Man', 'Gingerbread Woman', 'Gingerbread Plum Trees', 'Plumpy the Plum Tree', 'Mr. Mint', 'Peppermint Candy Canes', 'Jolly Gumdrop', 'Gooey Gumdrop', 'Licorice Castle', 'Lord Licorice', 'Licorice Laces', 'Peanut Brittle House', 'Gramma Nutt', 'Lollipop Woods', 'Princess Lolly', 'Lost in Lollipop Woods', "Frostine's Iceberg", 'Queen Frostine', 'Molasses Swamp', 'Gloppy the Molasses Monster', 'Candy Castle', 'King Kandy'],
      transit: ['Rainbow Trail', 'Rainbow Pass', 'Gumdrop Pass', 'Ice Cream Sea'],
      utilities: ['Peppermint Stick Forest', 'Gumdrop Mountains'],
      chanceName: 'Candy Land Chance', chestName: 'Candy Land Community Chest'
    },
    Chicago: {
      currency: 'cash',
      properties: ['Ashland Avenue', 'Damen Avenue', 'North Avenue', 'Armitage Avenue', 'Fullerton Avenue', 'Humboldt Park', 'Logan Square', 'Wicker Park', 'Lincoln Park Zoo', 'Brookfield Zoo', 'Brookfield, Illinois', 'The Magnificent Mile', 'Navy Pier', 'Millennium Park', 'Cloud Gate', 'Chicago Riverwalk', 'Wrigley Field', 'Guaranteed Rate Field', 'Museum of Science and Industry', 'Field Museum', 'Shedd Aquarium', 'Willis Tower'],
      transit: ['The Blue Line', 'The Green Line', 'The Red Line', 'The Brown Line'],
      utilities: ['The Chicago Sun-Times', 'Chicago Water Works'],
      chanceName: 'Chicago Chance', chestName: 'Chicago Community Chest'
    },
    'Chicago Hilton Properties': {
      currency: 'cash',
      properties: ['Hampton Inn Alsip', 'Hampton Inn Tinley Park', 'DoubleTree Wood Dale', 'DoubleTree Skokie', 'Homewood Suites Schaumburg', "Chicago O'Hare Hilton", 'Embassy Suites Rosemont', 'DoubleTree Rosemont', 'DoubleTree Arlington Heights', 'Embassy Suites Lakefront', 'Embassy Suites Downtown', 'Hilton Chicago', 'Palmer House, a Hilton Hotel', 'The Drake', 'Hilton Chicago Magnificent Mile Suites', "Hilton Rosemont Chicago O'Hare", 'Hilton Garden Inn Chicago Downtown Magnificent Mile', "Hilton Garden Inn Chicago O'Hare Airport", 'Hampton Inn & Suites Chicago-Downtown', 'Homewood Suites Chicago Downtown', 'Embassy Suites Chicago Downtown Magnificent Mile', 'DoubleTree Chicago Magnificent Mile'],
      transit: ['Union Station', "O'Hare Airport", 'Midway Airport', 'Chicago Hotel Shuttle'],
      utilities: ['The Chicago Sun-Times', 'Chicago Hotel Services'],
      chanceName: 'Hilton Guest Chance', chestName: 'Hilton Guest Services'
    },
    'United States': {
      currency: 'cash',
      properties: ['Kansas', 'Kentucky', 'Alabama', 'Alaska', 'Arkansas', 'Idaho', 'Indiana', 'Iowa', 'Massachusetts', 'Minnesota', 'Montana', 'New Hampshire', 'New Jersey', 'New York', 'Ohio', 'Oklahoma', 'Oregon', 'Washington', 'Wisconsin', 'Wyoming', 'Vermont', 'Virginia'],
      transit: ['Rhode Island Railroad', 'Pennsylvania Railroad', 'Georgia Railroad', 'Louisiana Railroad'],
      utilities: ['Utah Electric Company', 'Hawaii Water Works'], chanceName: 'United States Chance', chestName: 'United States Community Chest'
    },
    'TV 2': {
      currency: { singular: 'Rating Point', plural: 'Rating Points' }, audioProfile: 'classic-tv',
      properties: ['Card Sharks', 'Blockbusters', 'Hollywood Squares', 'Match Game', 'Whammy!', 'Sesame Street', 'Mister Rogers', 'Colonel Bleep', 'The Gong Show', 'Jeopardy!', 'Wheel of Fortune', 'Superman', 'Batman', 'Underdog', 'Frasier', 'The Addams Family', 'The Munsters', 'The Waltons', 'The Honeymooners', 'The Brady Bunch', 'All in the Family', 'Married... with Children'],
      transit: ['Wide World of Sports', 'Monday Night Football', 'Speed Racer', 'Hardball'],
      utilities: ['The Electric Company', '60 Minutes'], chanceName: 'Channel Surfing Chance', chestName: 'TV Community Chest'
    },
    'TV 1': {
      currency: { singular: 'Rating Point', plural: 'Rating Points' }, audioProfile: 'classic-tv',
      properties: ['Due South', 'The West Wing', 'The Dukes of Hazzard', 'Growing Pains', 'Family Ties', 'Night Court', 'The Cosby Show', 'Cheers', 'M*A*S*H', 'Gunsmoke', 'Bonanza', 'Have Gun – Will Travel', 'The Beverly Hillbillies', "Gilligan's Island", 'Robin Hood', 'Perry Mason', 'Columbo', 'Ironside', 'Bewitched', 'I Dream of Jeannie', 'I Love Lucy', 'Quantum Leap'],
      transit: ['Knight Rider', 'CHiPs', 'My Mother the Car', 'Enterprise'],
      utilities: ['WKRP in Cincinnati', 'NewsRadio'], chanceName: 'Channel Surfing Chance', chestName: 'TV Community Chest'
    },
    'Taco Bell': {
      currency: { singular: 'Dollar', plural: 'Dollars' },
      properties: ['Nachos', 'Cinnamon Twists', 'Chicken Taco', 'Beef Taco', 'Chalupa', 'Cheesy Potatoes', 'Caramel Apple Empanada', 'Gordita Supreme', 'Cheesy Gordita Crunch', 'Double Decker Supreme', 'Meximelt', 'Chicken Quesadilla', 'Mexican Pizza', 'Beef Burrito', 'Chicken Burrito', 'Bean Burrito', 'Beef Taco Salad', 'Chicken Taco Salad', 'Nachos BellGrande', 'Fresco Style', 'Potato Burrito', 'Grilled Stuft Burrito'],
      transit: ['Mild Sauce', 'Volcano Sauce', 'Hot Sauce', 'Baja Sauce'],
      utilities: ['Oven', 'Freezer'],
      goName: 'The Kitchen', jailName: 'The Trash', freeParkingName: 'The Drive-Through',
      incomeTaxName: 'Property Tax', luxuryTaxName: 'Food Tax', chanceName: 'Chomp', chestName: 'Crunch'
    },
    Supermarket: {
      currency: { singular: 'Grocery Dollar', plural: 'Grocery Dollars' },
      properties: ['Canned Fruit', 'Canned Vegetables', 'Eggs', 'Butter', 'Milk', 'Bread', 'Hot Dog Buns', 'Hamburger Buns', 'Tomatoes', 'Carrots', 'Lettuce', 'Apples', 'Oranges', 'Bananas', 'Ice Cream', 'Cool Whip', 'Strawberry and Chocolate Topping', 'Light Bulbs', 'Extension Cords', 'Batteries', 'Prime Rib', 'Porterhouse Steak'],
      transit: ['Ford Pickup', 'Dodge Van', 'Volkswagen Microbus', 'Jalopy'],
      utilities: ['Pay Phone', 'Water Fountain'], chanceName: 'Aisle Special Chance', chestName: 'Supermarket Community Chest'
    },
    'Sesame Street': {
      currency: { singular: 'Dollar', plural: 'Dollars' }, audioProfile: 'cartoon',
      properties: ['Official Twiddlebug Window Box', "Barkley's Doghouse", "Sherlock Hemlock's Detective Agency", "Martians' Home on Mars", "Biff and Sully's Construction Company", "Charlie's Restaurant", 'Sesame Street Library', 'The Mail-It Shop', "Guy Smiley's Game Show", "Mumford's Magic Shop", "The Count's Castle", "Bert's Rooftop Pigeon Coop", "Ernie's Bathtub", "Elmo's World", "Oscar's Trash Can", 'Sesame Street Fire Department', "Cookie Monster's Bakery", 'Furry Arms Hotel', 'Sesame Street Courtyard', "Big Bird's Nest", "Hooper's Store", '123 Sesame Street'],
      transit: ["Oscar's Taxi Service", 'Furry Monster Ferry Line', 'Bus Stop', 'Sesame Street Subway'],
      utilities: ["Oscar's Recycling Center", "Super Grover's Phone Booth"], chanceName: 'Block Party', chestName: 'Street Smarts'
    },
    'San Francisco': {
      currency: 'cash',
      properties: ['Coit Tower', 'Golden Gate Bridge', 'San Francisco Museum of Modern Art', 'San Francisco Zoo', 'Pier 39', 'San Francisco Chronicle', 'San Francisco Focus', 'Big 98.1', 'Vertigo', 'Fog City Diner', "Masa's", 'I. Magnin', 'Emporium Department Store', "Macy's", 'Smith Barney', 'Deloitte & Touche', 'Citibank', 'The Westin St. Francis', 'InterContinental Mark Hopkins', 'The Fairmont', 'Wilkes Bashford', "Gump's"],
      transit: ['SamTrans', 'Southwest Airlines', 'Caltrain', 'Hornblower Dining Yachts'],
      utilities: ['San Francisco Electric Company', 'San Francisco Water Works'], chanceName: 'San Francisco Chance', chestName: 'San Francisco Community Chest'
    },
    'San Diego': {
      currency: 'cash',
      properties: ["Seau's The Restaurant", 'San Diego Hall of Champions Sports Museum', 'Giant Dipper at Belmont Park', 'Balboa Park', 'Mission Bay Park', 'Shelter Island', 'U.S. Olympic Training Center San Diego', 'Reuben H. Fleet Space Theater and Science Park', 'San Diego Wild Animal Park', 'Robinsons-May', "Brady's", 'Z Gallerie', "Macy's", 'FAO Schwarz', 'Horton Plaza', 'Aviara Golf Club', 'Qualcomm Stadium', 'Petco Park', 'Old Town Mexican Cafe', "Bully's East", 'Corvette Diner', 'SeaWorld'],
      transit: ['Old Town Trolley Tours', 'San Diego Trolley', 'Southwest Airlines', 'San Diego Naval Base'],
      utilities: ['San Diego Electric Company', 'San Diego Water Company'], chanceName: 'San Diego Chance', chestName: 'San Diego Community Chest'
    },
    Philadelphia: {
      currency: 'cash',
      properties: ['Mummers Museum', 'Italian Market', 'Franklin Mills', "Strawbridge's", 'The Shops at Liberty Place', 'The Philadelphia Zoo', 'The Franklin Institute Science Museum', 'Philadelphia Museum of Art', 'Di Lullo', 'Katmandu', "The Old Original Bookbinder's", 'Temple Owls', 'Academy of Music of Philadelphia', 'Avenue of the Arts', 'Veterans Stadium', 'CoreStates Complex', 'Citizens Bank Park', 'City Hall', 'Boathouse Row', 'The Free Library of Philadelphia', 'Independence Hall', 'CoreStates'],
      transit: ['Market East SEPTA Station', 'University City SEPTA Station', 'Suburban SEPTA Station', 'Frankford SEPTA Station'],
      utilities: ['Philadelphia Electric Company', 'Philadelphia Gas Company'], chanceName: 'Philadelphia Chance', chestName: 'Philadelphia Community Chest'
    },
    Ohio: {
      currency: 'cash',
      properties: ['Cleveland', 'Youngstown', 'Toledo', 'Cincinnati', 'Columbus', 'Akron', 'Canton', 'Dayton', 'Kirtland', 'Mentor', 'Chardon', 'Cleveland State University', 'Kent State University', 'Ohio State University', 'Big Creek State Park', 'Mohican State Park', 'Punderson State Park', "Kings Island", 'Geauga Lake Park', 'Cedar Point', 'Pro Football Hall of Fame', 'Rock & Roll Hall of Fame'],
      transit: ['Reading Railroad', 'Pennsylvania Railroad', 'B. & O. Railroad', 'Short Line Railroad'],
      utilities: ['FirstEnergy Electric Company', 'Water Works'], chanceName: 'Ohio Chance', chestName: 'Ohio Community Chest'
    },
    'North Pole': {
      currency: { singular: 'Candy Cane', plural: 'Candy Canes' },
      properties: ['Candy Cane Shack', 'Countdown to Christmas Headquarters', 'Frosty Pines Outfitters', 'Glacier Park', 'Hall of Records', 'Kringle Street', "Letrinka's Candy", "Mrs. Claus's Cookies and Milk", "Mrs. Claus's Handmade Christmas Stockings", "Needle's Tree Farm", "Nettie's Mistletoe Manor", 'North Pole Dolls', 'Poinsettia Palace', 'Reindeer Flight School', "Santa's Hat Inn", "Santa's Sleigh Launch", "Santa's Visiting Center", "Santa's Workshop", 'Sweet Rock Candy Company', 'Toymaker Elves', 'Sleigh and Eight Tiny Reindeer', 'Santa and Mrs. Claus'],
      transit: ['Polar Bear Taxi Service', 'North Star Commuter Train Station', 'North Pole Express Depot', 'North Pole Express'],
      utilities: ['Polar Power Company', 'North Pole Maintenance'], chanceName: 'North Pole Magic Chance', chestName: 'Christmas Community Chest'
    },
    NFL: {
      currency: { singular: 'Yard', plural: 'Yards' }, audioProfile: 'nfl',
      properties: ['Indianapolis Colts', 'Arizona Cardinals', 'Chicago Bears', 'Los Angeles Rams', 'New Orleans Saints', 'Dallas Cowboys', 'Buffalo Bills', 'Baltimore Ravens', 'Cincinnati Bengals', 'Carolina Panthers', 'Seattle Seahawks', 'Tennessee Titans', 'Washington Commanders', 'New York Jets', 'Minnesota Vikings', 'New England Patriots', 'Tampa Bay Buccaneers', 'New York Giants', 'Jacksonville Jaguars', 'Pittsburgh Steelers', 'Green Bay Packers', 'Denver Broncos'],
      transit: ['The Hula Bowl', 'The Senior Bowl', 'All-Star Pro Bowl', 'Super Bowl'],
      utilities: ['Radio', 'Television'], chanceName: 'Game-Day Chance', chestName: 'NFL Community Chest'
    },
    'New York City': {
      currency: 'cash',
      properties: ['South Street Seaport', 'World Trade Center', 'Holland Tunnel', 'Brooklyn Bridge', 'George Washington Bridge', 'Central Park', 'Statue of Liberty', 'Empire State Building', 'Yankee Stadium', 'American Museum of Natural History', 'Lincoln Center', "Macy's", 'FAO Schwarz', "Bloomingdale's", 'Les Célébrités', 'The Rainbow Room', 'The Four Seasons', 'The Regency Hotel', 'Essex House', 'The Plaza', 'Tiffany & Company', 'Trump Tower'],
      transit: ['LaGuardia Airport', 'Penn Station', 'John F. Kennedy International Airport', 'Grand Central Station'],
      utilities: ['Con Edison Electric', 'Con Edison Gas'], chanceName: 'New York Chance', chestName: 'New York Community Chest'
    },
    'Looney Tunes': {
      currency: { singular: 'ACME Credit', plural: 'ACME Credits' }, audioProfile: 'cartoon',
      properties: ['Slowpoke Rodriguez', 'Speedy Gonzales', 'Sylvester Junior', 'Michigan J. Frog', 'Hippety Hopper', 'Foghorn Leghorn', 'Mandrake', 'Miss Prissy', 'Tweety Bird', 'Granny', 'Sylvester', 'Yosemite Sam', 'She-Devil', 'Tasmanian Devil', 'Marvin the Martian', 'Daffy Duck', 'Porky Pig', 'Elmer Fudd', 'Bugs Bunny', 'Pepé Le Pew', 'Wile E. Coyote', 'Road Runner'],
      transit: ["Witch Hazel's Shuttle", "Marvin's Spaceship: The Martian Maggot", 'Wile E. Delivery', 'Rocket Airlines'],
      utilities: ['ACME Power', 'ACME Pipeline'], chanceName: 'ACME Chance', chestName: 'Looney Tunes Community Chest'
    },
    'Kansas State': {
      currency: 'cash',
      properties: ['Stockton Road', 'Westfield Avenue', 'Downs Road', 'Altoona Boulevard', 'Goodland Avenue', 'Kansas State University', 'State Avenue', 'Independence Avenue', 'University of Kansas', 'Topeka Avenue', 'Kansas Avenue', 'Wichita Boulevard', 'El Dorado Avenue', 'Leavenworth Road', 'Dodge City Road', 'Abilene Avenue', 'Garden City', 'Lenexa Avenue', 'Shawnee Mission Parkway', 'Blue Valley Boulevard', 'Leawood', 'Mission Hills'],
      transit: ['Burlington Northern', 'Santa Fe Railroad', 'Rock Island Railroad', 'Johnson County Executive Airport'],
      utilities: ['Atmos Energy', 'BPU Water'], chanceName: 'Kansas Chance', chestName: 'Kansas Community Chest'
    },
    'Kansas City': {
      currency: 'cash',
      properties: ['Quindaro Avenue', 'Prospect Avenue', 'Troost Avenue', 'Ohio Avenue', 'Wyandotte Avenue', 'Roeland Park', 'State Avenue', 'Nebraska Avenue', 'Northland', 'McGee Avenue', 'Rockhill Road', 'Nieman Road', 'Johnson Drive', 'Oak Avenue', 'Southwest Boulevard', 'Broadway', 'Prairie Village', 'Metcalf Avenue', 'Cherry Road', 'Overland Parkway', 'Leawood', 'Mission Hills'],
      transit: ['Burlington Northern Railroad', 'Rock Island Railroad', 'Santa Fe Railroad', 'Kansas City International Airport'],
      utilities: ['Kansas City Power & Light', 'BPU Water'], chanceName: 'Kansas City Chance', chestName: 'Kansas City Community Chest'
    },
    Indianapolis: {
      currency: 'cash',
      properties: ["The Children's Museum", 'Eiteljorg Museum', 'Circle Centre', 'L. S. Ayres', 'Parisian', 'RCA Dome', 'Victory Field', 'Market Square Arena', 'Indiana Roof Ballroom', 'Rathskeller Restaurant', 'St. Elmo Steak House', 'St. Vincent Hospitals', 'DowBrands', 'Eli Lilly and Company', 'Indianapolis Business Journal', 'The Saturday Evening Post', 'The Indianapolis Star', "Talk to Tucker Realtors", 'Bank One', 'Anthem', 'American United Life Insurance Company', 'Indianapolis Speedway'],
      transit: ['American Trans Air', 'Union Station', 'Indiana Railroad', 'IndyGo'],
      utilities: ['IPALCO Enterprises', 'Ameritech'], chanceName: 'Indy Chance', chestName: 'Indianapolis Community Chest'
    },
    Houston: {
      currency: 'cash',
      properties: ['Theater District', 'The Cynthia Woods Mitchell Pavilion', "Joe's Crab Shack", "Willie G's Oyster Bar", "Landry's Seafood House", 'The Houston Zoo', 'FAO Schwarz', "The Children's Museum of Houston", 'Houston Livestock Show and Rodeo', 'TPC The Woodlands', 'Minute Maid Park', "Oshman's SuperSports USA", "Macy's", "Foley's", 'Hermann', 'TIRR Systems', "Texas Children's Hospital", 'George R. Brown Convention Center', 'The Houstonian Hotel, Club and Spa', 'The Wyndham Warwick Hotel', 'Space Center Houston', 'Astrodome'],
      transit: ['Metro', 'Port of Houston Authority', 'BMW', 'Southwest Airlines'],
      utilities: ['Houston Lighting & Power', 'Southwestern Bell'], chanceName: 'Houston Chance', chestName: 'Houston Community Chest'
    },
    Hollywood: {
      currency: { singular: 'Studio Credit', plural: 'Studio Credits' },
      properties: ['Hollywood & Vine', 'Hollywood Boulevard', 'Color by Deluxe', 'Hollywood Bowl', 'Golden Globe Awards at the Beverly Hilton Hotel', 'Palace', 'Capitol Records', 'Billboard Live', 'Premiere Movie Magazine', 'The Hollywood Reporter', 'California Film Commission', 'United Talent Agency', 'International Creative Management', 'Miramax Films', 'Dimension Films', 'The Academy Awards at Dorothy Chandler Pavilion', 'PolyGram Films', 'TriStar', 'Columbia', 'Sony Pictures', 'Twentieth Century Fox', 'Paramount'],
      transit: ['CBS Network', 'NBC Network', 'ABC Network', 'Fox Network'],
      utilities: ['Panavision Woodland Hills', 'Dolby Digital'], chanceName: 'Casting Call Chance', chestName: 'Studio Community Chest'
    },
    'Halloween Goodies': {
      currency: { singular: 'Ticket', plural: 'Tickets' },
      properties: ['Caramel Apple Witches', 'Chocolate Spiders', 'Cool Ghoul Treats', 'Creepy Critters', 'Decadent Halloween Brownies', 'Field of Ghosts', 'Fudgy Bat Cookies', 'Ghost Cookies', 'Ghosts in the Graveyard', 'Glowing Jack-o-Lantern Cookies', 'Good Morning Pumpkin Pancakes', 'Graveyard Pudding', 'Halloween Pizza', 'Halloween Sugar Cookies', 'Huge Scary Spiders', 'Mashed Potato Ghosts', 'Monster Munch', 'Pumpkin Patch Cake', 'Spiderweb Cake', "Witches' Hats", 'Peanut Butter and Jelly-Filled Spiders', 'Pumpkin Cookies'],
      transit: ['Black Cat Cupcakes', 'Creeping Caterpillar Cupcakes', 'Jack-o-Lantern Cupcakes', "Wigglin' Jigglin' Cupcakes"],
      utilities: ["Eerie Witch's Brew", 'Ghoul-Aid'],
      goName: 'The Buffet Table', jailName: 'The Trash Can', freeParkingName: 'The Halloween Party',
      incomeTaxName: 'Entrance Fee', luxuryTaxName: 'Food Purchase', chanceName: 'Punch Cauldron', chestName: 'Haunted Candy Bowl'
    },
    'Halloween Goodies 2': {
      currency: { singular: 'Ticket', plural: 'Tickets' },
      properties: ['Anti-Vampire Garlic Bites', 'Banana Ghouls', 'Black Magic Cake', 'Boo-Berry Oatmeal', 'Bugs in a Blanket', 'Cheery Jack-o-Lanterns', 'Candy Corn Cookies', 'Chocolate Gremlins', 'Cinnamon Roll Bats', 'Creamy Caramel Apple Cider', 'Coffin Sandwiches', 'Gingerbread Skeletons', 'Gumdrop Pumpkins', 'Haunting Hot Chocolate', 'Lollipop Ghosts', 'Monster Mish-Mash', 'Vampire Bite Cookies', 'Peanut Butter Pumpkins', 'Pizza Witches', "Witch's Brew Chicken Noodle Soup", 'Green and Gooey Macaroni and Cheese', 'Mummy Dogs'],
      transit: ['Cobweb Cupcakes', 'Frankenstein Cupcakes', 'Little Pumpkin Cakes', 'Pumpkin Cupcakes'],
      utilities: ['Bobbing Apple Punch', 'Trick-or-Treat Punch'],
      goName: 'The Buffet Table', jailName: 'The Trash Can', freeParkingName: 'The Halloween Party',
      incomeTaxName: 'Entrance Fee', luxuryTaxName: 'Food Purchase', chanceName: 'Punch Cauldron', chestName: 'Haunted Candy Bowl'
    },
    'Hallmark Pop Culture': {
      currency: { singular: 'Gold Crown Point', plural: 'Gold Crown Points' },
      properties: ['Barney', 'Etch A Sketch', 'Izzy', 'Barbie and Ken', 'Howdy Doody', 'Elvis', 'The Lone Ranger', 'Mr. Monopoly', 'Samantha Stephens', 'E.T. the Extra-Terrestrial', 'Job Switching', 'Chatty Cathy', "Rock 'Em Sock 'Em Robots", 'See N Say', 'Friendly Neighborhood Spider-Man', 'The Beatles', 'Pac-Man', 'Galaga', 'Next Stop: The Twilight Zone', 'Robby the Robot', 'Hugga Bunch', 'Rainbow Brite and Starlite'],
      transit: ['Hopalong Cassidy Lunchbox', 'Super Friends Lunchbox', 'Jetsons Lunchbox', 'Malibu Barbie Lunchbox'],
      utilities: ['Wheel of Fortune', 'Magic 8 Ball'],
      goName: 'Hallmark', jailName: 'The Storage Room', freeParkingName: 'Keepsake Club',
      incomeTaxName: "Designers' Expenses", luxuryTaxName: 'Shipping and Handling', chanceName: 'Ornament Preview', chestName: 'Christmas Season'
    },
    'Hallmark Disney Ornaments': {
      currency: { singular: 'Gold Crown Point', plural: 'Gold Crown Points' }, audioProfile: 'disney',
      properties: ['Bambi Discovers Winter', 'Best Night of the Week', 'Cocoa for Two', 'Dashing Through the Mall', 'It Was All Started by a Mouse', 'Always a Princess', 'Making Sweet Memories', 'Merry Coral Christmas Tree', "Mickey's Christmas Carol", 'Nutcracker Mickey', 'Piano Player Mickey', 'Pinocchio and Geppetto', "Pooh's Twinkly Snowflake", 'Presents from Pooh', 'Spaghetti Supper', 'Sweet Christmas Smackerels', 'Princess Dreams', "Waitin' on Santa", 'Warm and Cozy Christmas', 'Welcome to Christmas Town', "Cinderella's Castle", 'Small World'],
      transit: ['Christmas Express', "Mickey's Locomotive", "Mickey's Jingle Bell Express", '100 Acre Express'],
      utilities: ['50 Years of Music and Fun', 'Tinker Bell Wind-Up'],
      goName: 'Hallmark', jailName: 'The Storage Room', freeParkingName: 'Keepsake Club',
      incomeTaxName: "Designers' Expenses", luxuryTaxName: 'Shipping and Handling', chanceName: 'Ornament Preview', chestName: 'Christmas Season'
    },
    'Hallmark 90s and 2000s': {
      currency: { singular: 'Gold Crown Point', plural: 'Gold Crown Points' },
      properties: ['Angel Kitty', 'Snoopy Plays Santa', 'God with Us', 'Sunday Evening Sleigh Ride', 'Play It Again Santa', 'First Gift of Christmas', 'Barbie as the Sugarplum Fairy', 'City Sidewalks', 'Jingle Bell Memories', 'Sugarplum Dreams', 'Merry Christmas, Charlie Brown!', 'Santy Claus and Cindy Lou Who', "You'll Shoot Your Eye Out, Kid", 'Candy Cane Lane', "It's Beginning to Sound a Lot Like Christmas", 'The Magic of Frosty', 'Barbie as Eden Starling', 'Ralphie Saves the Day', 'Rodney and Rhonda Reindeer', 'Heaven and Nature Sing', 'Snowman Band', 'Waltz of the Snowflakes'],
      transit: ['Claus and Company Railroad', 'Christmas Crossing', 'Rock Candy Railroad', 'Holiday Railroad'],
      utilities: ['Christmas Broadcast', 'Ringing in Christmas'],
      goName: 'Hallmark', jailName: 'The Storage Room', freeParkingName: 'Keepsake Club',
      incomeTaxName: "Designers' Expenses", luxuryTaxName: 'Shipping and Handling', chanceName: 'Ornament Preview', chestName: 'Christmas Season'
    },
    "Hallmark 70s and 80s": {
      currency: { singular: 'Gold Crown Point', plural: 'Gold Crown Points' },
      properties: ['Christmas Is Love', 'Peace on Earth', 'Angel Delight', 'Frosty Friends', 'Calico Kitty', 'Stocking Mouse', 'Gingham Dog', 'Let Us Adore Him', 'Porcelain Bear', 'Kit the Shepherd', 'Muffin the Angel', 'Stardust Angel', 'Cookies for Santa', 'Happy Christmas to Owl', 'Season of the Heart', 'Merry Mint Unicorn', 'Chris Mouse', 'Sleighful of Dreams', 'Travels with Santa', 'Rodney Reindeer', "Santa's on His Way", 'Savior Is Born'],
      transit: ['Candyville Express', 'Village Express', 'Country Express', 'Ornament Express'],
      utilities: ['Sounds of Christmas', 'Christmas Carousel'],
      goName: 'Hallmark', jailName: 'The Storage Room', freeParkingName: 'Keepsake Club',
      incomeTaxName: "Designers' Expenses", luxuryTaxName: 'Shipping and Handling', chanceName: 'Ornament Preview', chestName: 'Christmas Season'
    },
    'Great Comedians': {
      currency: { singular: 'Laugh', plural: 'Laughs' },
      properties: ['Harry Anderson', 'Yakov Smirnoff', 'George Wallace', 'Martin Mull', 'Robert Klein', 'Weird Al Yankovic', 'Tom Lehrer', 'Allan Sherman', 'Bob Hope', 'Steve Martin', 'Billy Crystal', 'Gilda Radner', 'Lily Tomlin', 'Joan Rivers', 'The Goon Show', 'Monty Python', 'Benny Hill', 'Spike Jones', 'Mel Brooks', 'Cheech and Chong', 'George Carlin', 'Bill Cosby'],
      transit: ['Airplane!', 'Saturday Night Live', 'Spaceballs', 'Planes, Trains and Automobiles'],
      utilities: ['Analyze This', 'Stand-Up Spotlight'], chanceName: 'Punchline Chance', chestName: 'Comedy Club Community Chest'
    },
    'Forbidden Cities': {
      currency: 'cash',
      properties: ['Landers', 'Banning', 'Orange', 'Salinas', 'San Martin', 'Monterey', 'Kingsburg', 'Prunedale', 'San Jose', 'Barstow', 'Reedley', 'Palm Springs', 'San Ardo', 'San Francisco', 'Novato', 'Tracy', 'Fremont', 'Lake Arrowhead', 'Blythe', 'Cartago', 'Oasis Water Park', 'Great America San Jose'],
      transit: ['Union Square', 'Skunk Train', 'Caltrain Morgan Hill', 'Metrolink'],
      utilities: ['Edison', 'San Francisco Power Authority'], chanceName: 'California Road Chance', chestName: 'Forbidden Cities Community Chest'
    },
    Flintstones: {
      currency: { singular: 'Clam', plural: 'Clams' }, audioProfile: 'cartoon',
      properties: ["Flintstones' House", 'Gravel Pit', 'Slate Cave Construction Company', "Barney Rubble's Workplace", 'Bedrock Beauty Parlor', 'Bedrock Bowling Alley', 'Bedrock Candle Company', 'Bedrock Pool Hall', 'Water Buffalo Lodge', 'Daily Slab Newspaper', 'Radio Bedrock', 'Bedrock Hospital', 'Bedrock Police Department', 'Bedrock Fire Department', 'Community Theater', 'Movie Cinema', 'Stone Gardens', "The Gruesomes' House", 'Hatrock Farm', "Mr. Slate's Mansion", 'Rock Vegas', 'Honolulu-Rock'],
      transit: ["Flintstones' Car", 'Bedrock Taxi Company', 'Bedrock Railroad', 'Bedrock International Airport'],
      utilities: ['Bedrock TV Network', 'Bedrock Water Works'], chanceName: 'Yabba-Dabba-Doo Chance', chestName: 'Bedrock Community Chest'
    },
    'E.T.': {
      currency: { singular: 'Reese\'s Piece', plural: "Reese's Pieces" },
      properties: ['The Forest', 'Keys', 'Michael', 'Steve', 'Tyler', 'Greg', 'Mary', 'Harvey', "Reese's Pieces", 'Gertie', 'Geraniums', 'Science Teacher', 'Pretty Girl', 'Trick-or-Treaters', 'The Bald Spot', 'Policeman', 'Government Agents', 'Medics', 'Playground', 'Rainbow', 'Elliott', 'E.T.'],
      transit: ['Spaceship', 'Keys Van', 'Flying Bicycle', 'Government Van'],
      utilities: ['Speak & Spell', 'Communicator'], chanceName: 'Phone Home Chance', chestName: 'E.T. Community Chest'
    },
    'Down on the Farm': {
      currency: { singular: 'Gold Nugget', plural: 'Gold Nuggets' },
      properties: ['Dogs', 'Cats', 'Horses', 'Cattle', 'Pigs', 'Ducks', 'Chickens', 'Turkeys', 'Sheep', 'Goats', 'Lambs', 'Corn', 'Barley', 'Wheat', 'Silo', 'Windmill', 'Haystack', 'Cultivator', 'Tractor', 'Plow', 'Ranch House', 'Swimming Hole'],
      transit: ['Tool Shed', 'Chicken Coop', 'The Barn', 'Outhouse'],
      utilities: ['Power House', 'Well House'],
      goName: 'The Crossroads', jailName: 'The Calaboose', freeParkingName: 'Win the Lottery',
      incomeTaxName: 'Blood Suckers', luxuryTaxName: 'Screw Me Over', chanceName: 'Good Luck Jack', chestName: 'Not Again!'
    },
    'Down in the Boondocks': {
      currency: { singular: 'Buck', plural: 'Bucks' },
      properties: ['Shack Town', 'Poor Boy Flats', 'Mining Camp', 'Tobacco Road', 'Rugged Cross Village', 'Buckeye Swamp', 'Genessee Pits', "Harnell's Holler", 'Kree Bo Creek', "Duncan's Hill", 'The Farms', 'Middleville', 'Community College', "Duckbee's Marsh", 'Industrial Park', 'Shipping Docks', 'Port of Midville', 'Rugged Cross Cemetery', 'Richland Country Club', 'Arboretum', 'Eden Gardens', 'Board Room'],
      transit: ['Coal Train', 'Foggy Mountain Railroad', 'Farm Train Limited', 'Modern Transit Rail Lines'],
      utilities: ['Acme Coal Mining Corp.', 'Midville Port Authority'],
      goName: 'Get Paid', jailName: 'The Slammer', freeParkingName: 'Win the Gawl-Dang Lotto',
      incomeTaxName: 'Income Tax', luxuryTaxName: 'Gambling Loss', chanceName: 'Lady Luck', chestName: 'Daily Horoscope'
    },
    Disney: {
      currency: { singular: 'Magic Star', plural: 'Magic Stars' }, audioProfile: 'disney',
      properties: ["Aladdin's Palace", "Andy Davis's Bedroom", "Ariel's Grotto", "Bambi's Thicket", "Belle and Beast's Castle", 'Briar Patch', "Briar Rose's Forest Cottage", "Cinderella's Chateau", 'Dalmatian Plantation', "Dick Tracy's Apartment", "Dumbo's Circus", "Dwarfs' Cottage", "Fagin's Barge", 'Hundred Acre Wood', "Lilo and Nani's House", "Melody's Bedroom", 'Notre Dame Cathedral', 'Powhatan Village', 'Pride Rock', '17 Cherry Tree Lane', "Tarzan's Tree House", "Yen Sid's Castle"],
      transit: ['Acme Factory', 'Monstropolis', 'Neverland', 'Wonderland'],
      utilities: ["Geppetto's Toy Shop", 'Rescue Aid Society'], chanceName: 'Disney Magic Chance', chestName: 'Disney Community Chest'
    },
    'Disney Parks': {
      currency: { singular: 'Park Ticket', plural: 'Park Tickets' }, audioProfile: 'disney',
      properties: ['Alice in Wonderland', 'Big Thunder Mountain Railroad', "Buzz Lightyear's Space Ranger Spin", 'Great Movie Ride', 'The Haunted Mansion', "It's a Small World", 'Journey Into Imagination', 'Matterhorn Bobsleds', 'Mission: Space', "Peter Pan's Flight", "Pinocchio's Daring Journey", 'Pirates of the Caribbean', "Rock 'n' Roller Coaster", "Roger Rabbit's Car Toon Spin", 'Space Mountain', 'Splash Mountain', 'Star Tours', 'Temple of the Forbidden Eye', 'Test Track', 'Tower of Terror', 'Sleeping Beauty Castle', 'Cinderella Castle'],
      transit: ['Disneyland Monorail', 'Disneyland Railroad', 'Walt Disney World Monorail', 'Walt Disney World Railroad'],
      utilities: ['Carousel of Progress', 'Spaceship Earth'], chanceName: 'Disney Magic Chance', chestName: 'Park Community Chest'
    },
    'Dallas Area Hilton Properties': {
      currency: { singular: 'Hilton Point', plural: 'Hilton Points' },
      properties: ['Hilton Arlington', 'Fort Worth Hilton', 'DFW Lakes Hilton', 'Hilton Southlake', 'Lincoln Centre', 'Embassy Suites Love Field', 'Embassy Suites Outdoor World', 'Embassy Suites DFW South', 'Embassy Suites Park Central', 'Embassy Suites Market Center', 'DoubleTree Campbell Centre', 'Hilton Anatole', 'Hilton Dallas Park Cities', 'Hilton Richardson Dallas', 'Hilton Garden Inn Downtown Dallas', 'Hilton Garden Inn Dallas Market Center', 'Homewood Suites Dallas Downtown', 'Hampton Inn & Suites Dallas Downtown', 'Canopy by Hilton Dallas Uptown', 'DoubleTree Dallas Love Field', 'Embassy Suites Dallas Downtown', 'The Statler Dallas'],
      transit: ['DFW Airport', 'Union Station', 'Love Field Hotel Shuttle', 'Dallas Hotel Express'],
      utilities: ['TXU Energy', 'Hilton Guest Services'], chanceName: 'Hilton Guest Chance', chestName: 'Hilton Honors Community Chest'
    },
    Dallas: {
      currency: 'cash',
      properties: ['Dealey Plaza', 'Reunion Arena', 'Patrizio', 'Cafe Pacific', 'Star Canyon New Texas Cuisine', 'Zen Floral Design Studio', "Weir's Furniture Village", 'Simon David and Tom Thumb', 'EDS', 'Ebby Halliday Realtors', 'The Staubach Company', "Foley's", "Macy's", 'Neiman Marcus', 'Quadrangle', 'Highland Park Village', 'NorthPark Center', 'The Stoneleigh Hotel', 'The Fairmont', 'The Mansion of Dallas-Fort Worth', 'Ameriquest Field in Arlington', 'Texas Stadium'],
      transit: ['Dallas Union Station', 'Dallas Love Field', 'Victory Station', 'Southwest Airlines'],
      utilities: ['TXU Energy', 'Lone Star Gas'], chanceName: 'Dallas Chance', chestName: 'Dallas Community Chest'
    },
    'Country Music': {
      currency: { singular: 'Country Note', plural: 'Country Notes' }, audioProfile: 'country',
      properties: ['Gene Autry', 'Tex Ritter', 'George Strait', 'George Jones', 'Tammy Wynette', 'Marty Robbins', 'Jerry Lee Lewis', 'Tom T. Hall', 'Lorrie Morgan', 'Dolly Parton', 'Skeeter Davis', 'Loretta Lynn', 'Bill Monroe', 'The Statler Brothers', 'Bob Wills', 'Kitty Wells', 'Reba McEntire', 'Johnny Cash', 'Johnny Horton', 'Jim Reeves', 'Hank Williams', 'Patsy Cline'],
      transit: ['Wabash Cannonball', 'City of New Orleans', 'Old 97', 'Silver Eagle'],
      utilities: ['WSM Radio', 'Jamboree in the Hills'], chanceName: 'Country Road Chance', chestName: 'Grand Ole Community Chest'
    },
    '80s Country Music': {
      currency: { singular: 'Country Note', plural: 'Country Notes' }, audioProfile: 'country',
      properties: ['Alabama', 'The Oak Ridge Boys', 'The Judds', 'Ricky Skaggs', 'George Strait', 'Reba McEntire', 'Randy Travis', 'Dwight Yoakam', 'Rosanne Cash', 'Earl Thomas Conley', 'John Anderson', 'Lee Greenwood', 'Ronnie Milsap', 'T. G. Sheppard', 'The Bellamy Brothers', 'Hank Williams Jr.', 'Don Williams', 'Kathy Mattea', 'Steve Wariner', 'Highway 101', 'Patty Loveless', 'Keith Whitley'],
      transit: ['Honky-Tonk Tour Bus', 'Nashville Starliner', 'Country Music Train', 'Arena Tour Jet'], utilities: ['FM Country Radio', 'Recording Studio'], chanceName: 'Mixtape Chance', chestName: 'Fan Club Community Chest'
    },
    '90s Country Music': {
      currency: { singular: 'Country Note', plural: 'Country Notes' }, audioProfile: 'country',
      properties: ['Garth Brooks', 'Shania Twain', 'Alan Jackson', 'George Strait', 'Reba McEntire', 'Brooks & Dunn', 'Vince Gill', 'Clint Black', 'Travis Tritt', 'Martina McBride', 'Faith Hill', 'Tim McGraw', 'Jo Dee Messina', 'The Chicks', 'LeAnn Rimes', 'Trisha Yearwood', 'Patty Loveless', 'Mary Chapin Carpenter', 'Diamond Rio', 'Sawyer Brown', 'BlackHawk', 'Lonestar'],
      transit: ['Tour Bus', 'Festival Shuttle', 'Nashville Express', 'World Tour Jet'], utilities: ['Country Music Television', 'Digital Recording Studio'], chanceName: 'Music Video Chance', chestName: 'Backstage Community Chest'
    },
    '2000s Country Music': {
      currency: { singular: 'Country Note', plural: 'Country Notes' }, audioProfile: 'country',
      properties: ['Carrie Underwood', 'Keith Urban', 'Brad Paisley', 'Kenny Chesney', 'Toby Keith', 'Rascal Flatts', 'Sugarland', 'Dierks Bentley', 'Blake Shelton', 'Miranda Lambert', 'Josh Turner', 'Sara Evans', 'Martina McBride', 'Tim McGraw', 'Faith Hill', 'Trace Adkins', 'Montgomery Gentry', 'Little Big Town', 'Billy Currington', 'Gary Allan', 'Joe Nichols', 'Gretchen Wilson'],
      transit: ['Tour Coach', 'Music Festival Bus', 'Country Highway', 'Charter Jet'], utilities: ['Satellite Radio', 'Digital Music Studio'], chanceName: 'Download Chance', chestName: 'Concert Community Chest'
    },
    'Modern Country Music': {
      currency: { singular: 'Country Stream', plural: 'Country Streams' }, audioProfile: 'country',
      properties: ['Chris Stapleton', 'Luke Combs', 'Morgan Wallen', 'Kacey Musgraves', 'Lainey Wilson', 'Jelly Roll', 'Zach Bryan', 'Maren Morris', 'Thomas Rhett', 'Kane Brown', 'Dan + Shay', 'Old Dominion', 'Brothers Osborne', 'Ashley McBryde', 'Cody Johnson', 'Jordan Davis', 'Megan Moroney', 'Bailey Zimmerman', 'Hardy', 'Tyler Childers', 'Carly Pearce', 'Gabby Barrett'],
      transit: ['Tour Bus', 'Festival Shuttle', 'Country Highway', 'Private Jet'], utilities: ['Streaming Service', 'Home Recording Studio'], chanceName: 'Viral Hit Chance', chestName: 'Fan Community Chest'
    },
    Computer: {
      currency: { singular: 'Byte', plural: 'Bytes' },
      properties: ['Power Cords', 'Surge Protector', 'Keyboard', 'Mouse', 'Joystick', 'Microsoft', 'Modem', 'Video Card', 'Printer', 'Scanner', 'Digital Camera', 'Right Speaker', 'Subwoofer', 'Linux', 'CD-ROM', 'Intel', 'DVD Burner', 'Processor', 'Hard Drive', 'macOS', 'Monitor', 'PC'],
      transit: ['DOS', 'Windows 11', 'Floppy Drive', 'Computer Network'],
      utilities: ['Sound Card', 'Motherboard'],
      chanceName: 'Software Update Chance', chestName: 'Computer Community Chest'
    },
    Cleveland: {
      currency: 'cash',
      properties: ['Cleveland Metroparks Zoo', 'SeaWorld', 'Sun Newspapers', 'WMJI Magic 105.7', 'Cleveland Magazine', 'Playhouse Square Center', 'Karamu House Inc.', 'Severance Hall', 'Gund Arena', 'Cleveland Browns Stadium', 'Jacobs Field', "Pierre's", "Kaufmann's", 'Cleveland Museum of Art Store', 'Marymount', 'Fairview Health System', 'The Cleveland Clinic Center', 'Sherwin-Williams', 'National City', 'Ameritech', 'The Avenue at Tower City Center', 'Rock and Roll Hall of Fame Museum'],
      transit: ['Red Line', 'Blue Line', 'Green Line', 'Continental Airlines'],
      utilities: ['Cleveland Public Power', 'City of Cleveland Water'],
      chanceName: 'Cleveland Chance', chestName: 'Cleveland Community Chest'
    },
    'Christmas Goodies': {
      currency: { singular: 'Treat', plural: 'Treats' },
      properties: ['Angel Whispers', 'Buckeyes', 'Christmas Carol Punch', 'Candy Cane Cookies', 'Cherry Bells', 'Chewy Noels', 'Christmas Angel Cookies', 'Cinnamon Stars', 'Christmas Cheer Cookies', 'Christmas Kisses', 'Christmas Joy Cider', 'Christmas Tree Cupcakes', 'Christmas Wreath Cookies', 'Eskimo Cookies', 'Ginger Kringles', 'Gingerbread Pancakes', "Little Jack Horner's Christmas Pie", 'Fireside Punch', 'Magical Sparkling Snowflakes', "Mom's Cut-out Christmas Cookies", 'Vanilla Stars', 'Red Velvet Christmas Cupcakes'],
      transit: ["Rudolph's Cookie Kisses", "Santa's Victorian Candy Canes", 'Snowman Cupcakes', 'Peppermint Punch'],
      utilities: ['Christmas Eve Cinnamon Buns', 'Christmas Morning Cinnamon Toast'],
      goName: 'The Buffet Table', jailName: 'The Trash Can', freeParkingName: 'The Christmas Party',
      incomeTaxName: 'Entrance Fee', luxuryTaxName: 'Food Purchase',
      chanceName: 'Punch Bowl', chestName: 'Party Tray'
    },
    Christmas: {
      currency: 'cash',
      properties: ['Cozy House', 'Christmas Party', "Frosty's Snow House", "Rudolph's Cave", "Jesus' Manger", 'Christmas Tree', 'Poinsettias', 'Holly Wreath', 'Christmas Cookies and Hot Chocolate', 'Candy Canes and Hot Tea', 'Pumpkin Pie and Hot Cider', 'Presents', 'TV Specials', 'Fun in the Snow', 'Angels', 'Midnight Star', 'Nativity Scene', 'Sleigh Bells', 'Christmas Carols', 'Holiday Wishes', "Santa's Castle", "Santa's Workshop"],
      transit: ['Decorated Carriage Ride', 'Holiday Hay Rides', 'Snowmobile', 'Sleigh Ride'],
      utilities: ['Candle Shop', 'Christmas Light Store'],
      chanceName: 'Christmas Chance', chestName: 'Christmas Community Chest'
    },
    'Classic Rock': {
      currency: { singular: 'Backstage Pass', plural: 'Backstage Passes' }, audioProfile: 'retro',
      groups: ['purple', 'cyan', 'magenta', 'gold', 'red', 'yellow', 'green', 'blue'],
      properties: ['Jefferson Starship', 'Molly Hatchet', 'Jimi Hendrix', 'Johnny Winter', 'Led Zeppelin', 'Pink Floyd', 'Canned Heat', 'Cream', 'The Doors', 'The Grateful Dead', 'The Eagles', 'Lynyrd Skynyrd', 'Grand Funk Railroad', 'Iron Butterfly', 'Ten Years After', 'Janis Joplin', 'Black Sabbath', 'Deep Purple', 'ZZ Top', 'Electric Light Orchestra', 'The Beatles', 'The Rolling Stones'],
      transit: ['Private Jet', 'Tour Bus', 'Motorcycle', 'Private Yacht'], utilities: ['CD Player', 'FM Radio'],
      chanceName: 'Classic Rock Chance', chestName: 'Backstage Community Chest'
    },
    'Pop Music': {
      currency: { singular: 'Chart Point', plural: 'Chart Points' }, audioProfile: 'music',
      properties: ['Madonna', 'Michael Jackson', 'Prince', 'Whitney Houston', 'George Michael', 'Janet Jackson', 'Cyndi Lauper', 'Cher', 'Elton John', 'Britney Spears', 'Christina Aguilera', 'Mariah Carey', 'Backstreet Boys', 'NSYNC', 'Spice Girls', 'Beyoncé', 'Lady Gaga', 'Rihanna', 'Katy Perry', 'Taylor Swift', 'Bruno Mars', 'Adele'],
      transit: ['Tour Bus', 'Private Jet', 'Limousine', 'World Tour Express'], utilities: ['Streaming Service', 'Music Video Network'], chanceName: 'Pop Chart Chance', chestName: 'Fan Club Community Chest'
    },
    'Hip Hop': {
      currency: { singular: 'Beat', plural: 'Beats' }, audioProfile: 'music',
      properties: ['DJ Kool Herc', 'Grandmaster Flash', 'Run-DMC', 'LL Cool J', 'Public Enemy', 'Beastie Boys', 'N.W.A', 'Ice-T', 'Queen Latifah', 'Salt-N-Pepa', 'Tupac Shakur', 'The Notorious B.I.G.', 'Snoop Dogg', 'Dr. Dre', 'Nas', 'Jay-Z', 'Outkast', 'Missy Elliott', 'Eminem', 'Kanye West', 'Kendrick Lamar', 'Nicki Minaj'],
      transit: ['Tour Van', 'Subway Line', 'Private Jet', 'Hip Hop Express'], utilities: ['Turntable Power', 'Studio Mixer'], chanceName: 'Freestyle Chance', chestName: 'Block Party Community Chest'
    },
    'Old School R&B': {
      currency: { singular: 'Soul Note', plural: 'Soul Notes' }, audioProfile: 'music',
      properties: ['Ray Charles', 'Sam Cooke', 'Jackie Wilson', 'James Brown', 'Aretha Franklin', 'Marvin Gaye', 'The Temptations', 'The Four Tops', 'The Supremes', 'Stevie Wonder', 'Al Green', 'Gladys Knight & the Pips', "The O'Jays", 'Earth, Wind & Fire', 'The Isley Brothers', 'The Commodores', 'Chaka Khan', 'Patti LaBelle', 'Luther Vandross', 'Anita Baker', 'New Edition', 'Keith Sweat'],
      transit: ['Soul Train', 'Motown Tour Bus', 'Midnight Limousine', 'R&B Express'], utilities: ['Analog Recording Studio', 'Soul Radio'], chanceName: 'Soulful Chance', chestName: 'Love Song Community Chest'
    },
    'Country Legends': {
      currency: { singular: 'Country Note', plural: 'Country Notes' }, audioProfile: 'country',
      properties: ['Hank Williams', 'Patsy Cline', 'Johnny Cash', 'Loretta Lynn', 'Willie Nelson', 'Dolly Parton', 'Waylon Jennings', 'Conway Twitty', 'Tammy Wynette', 'George Jones', 'Merle Haggard', 'Reba McEntire', 'Alabama', 'Garth Brooks', 'Shania Twain', 'Vince Gill', 'Alan Jackson', 'George Strait', 'Tim McGraw', 'Faith Hill', 'Keith Urban', 'Carrie Underwood'],
      transit: ['Tour Bus', 'Pickup Truck', 'Country Train', 'Nashville Express'], utilities: ['Country Radio', 'Recording Studio'], chanceName: 'Country Road Chance', chestName: 'Honky-Tonk Community Chest'
    },
    '80s Dance': {
      currency: { singular: 'Dance Token', plural: 'Dance Tokens' }, audioProfile: 'eighties',
      properties: ['Shannon', 'Lisa Lisa and Cult Jam', 'Exposé', 'The Cover Girls', 'Taylor Dayne', 'Debbie Gibson', 'Tiffany', 'Paula Abdul', 'Jody Watley', 'Nu Shooz', 'Stacey Q', 'Company B', 'Information Society', 'New Order', 'Depeche Mode', 'Pet Shop Boys', 'Erasure', 'Dead or Alive', 'Bananarama', 'The Human League', 'Duran Duran', 'A-ha'],
      transit: ['Dance Club Shuttle', 'Roller Rink Bus', 'Neon Limousine', 'Dance Floor Express'], utilities: ['Synthesizer Power', 'Disco Lighting'], chanceName: 'Dance Mix Chance', chestName: 'Club Night Community Chest'
    },
    Oldies: {
      currency: { singular: 'Jukebox Dime', plural: 'Jukebox Dimes' }, audioProfile: 'retro',
      properties: ['Chuck Berry', 'Little Richard', 'Buddy Holly', 'Fats Domino', 'The Everly Brothers', 'Jerry Lee Lewis', 'The Platters', 'The Drifters', 'The Coasters', 'The Shirelles', 'The Ronettes', 'The Beach Boys', 'The Four Seasons', 'The Righteous Brothers', 'Roy Orbison', 'Dion', 'Chubby Checker', 'Neil Sedaka', 'Brenda Lee', 'Lesley Gore', 'Sam the Sham and the Pharaohs', 'The Monkees'],
      transit: ['Classic Convertible', 'Dance Hall Bus', 'Rock and Roll Train', 'Oldies Express'], utilities: ['AM Radio', 'Jukebox Power'], chanceName: 'Golden Oldies Chance', chestName: 'Sock Hop Community Chest'
    },
    '90s Music': {
      currency: { singular: 'CD Single', plural: 'CD Singles' }, audioProfile: 'nineties',
      properties: ['Nirvana', 'Pearl Jam', 'Soundgarden', 'Alice in Chains', 'Stone Temple Pilots', 'The Smashing Pumpkins', 'Green Day', 'Oasis', 'Blur', 'Radiohead', 'No Doubt', 'The Cranberries', 'TLC', 'Boyz II Men', 'En Vogue', 'SWV', 'Ace of Base', 'Hanson', 'Alanis Morissette', 'Sheryl Crow', 'Matchbox Twenty', 'Foo Fighters'],
      transit: ['Tour Van', 'Festival Shuttle', 'Alternative Express', 'World Tour Jet'], utilities: ['CD Player', 'Music Television'], chanceName: '90s Remix Chance', chestName: 'Music Store Community Chest'
    },
    'The Godfather': {
      currency: 'cash', audioProfile: 'godfather',
      properties: ['Corleone Family Home', 'Genco Olive Oil', 'Little Italy Bakery', 'Sicilian Village', 'Don Vito’s Office', 'Clemenza’s Kitchen', 'Tessio’s Club', 'Luca Brasi’s Lounge', 'Connie’s Wedding Garden', 'Michael’s Restaurant', 'Lake Tahoe Estate', 'Havana Hotel', 'Las Vegas Casino', 'New York Courthouse', 'Family Compound', 'Tom Hagen’s Office', 'Sollozzo’s Meeting Place', 'Apollonia’s Village', 'Opera House', 'Corleone Olive Grove', 'Don’s Council Chamber', 'Five Families Avenue'],
      transit: ['Family Sedan', 'Sicily Coach', 'New York Train', 'Private Airport'], utilities: ['Family Telephone Exchange', 'Olive Oil Works']
    },
    'Nintendo / Animal Crossing': {
      currency: { singular: 'Bell', plural: 'Bells' }, audioProfile: 'animal',
      properties: ['Player’s Tent', 'Nook’s Cranny', 'Resident Services', 'Able Sisters', 'Museum Plaza', 'The Roost', 'Harv’s Island', 'Kapp’n’s Pier', 'Happy Home Paradise', 'Bamboo Island', 'Cherry Blossom Grove', 'Campsite', 'Redd’s Treasure Trawler', 'K.K. Concert Plaza', 'Turnip Market', 'Orchard Lane', 'Flower Garden', 'Dream Island', 'Golden Tool Workshop', 'Island Designer District', 'Nookington’s', 'Five-Star Island'],
      transit: ['Dodo Airlines', 'Kapp’n Boat', 'Island Seaplane', 'Nintendo Express'], utilities: ['NookPhone Network', 'Island Power Station']
    },
    'Pac-Man Arcade': {
      currency: { singular: 'Point', plural: 'Points' }, audioProfile: 'pacman',
      properties: ['Cherry Maze', 'Strawberry Maze', 'Orange Maze', 'Apple Maze', 'Melon Maze', 'Galaxian Stage', 'Bell Maze', 'Key Maze', 'Blinky’s Corner', 'Pinky’s Passage', 'Inky’s Intersection', 'Clyde’s Corridor', 'Power Pellet Plaza', 'Ghost House', 'Warp Tunnel West', 'Warp Tunnel East', 'Fruit Bonus Hall', 'Arcade Cabinet Row', 'High Score Alley', 'Bonus Round', 'Perfect Maze', 'Level 256'],
      transit: ['Maze Warp One', 'Maze Warp Two', 'Maze Warp Three', 'Maze Warp Four'], utilities: ['Power Pellet Plant', 'Arcade Circuit Board']
    },
    'National Parks': {
      currency: 'cash', audioProfile: 'parks',
      properties: ['Hot Springs', 'Gateway Arch', 'Cuyahoga Valley', 'Shenandoah', 'Acadia', 'Great Smoky Mountains', 'Mammoth Cave', 'Everglades', 'Badlands', 'Wind Cave', 'Theodore Roosevelt', 'Rocky Mountain', 'Grand Teton', 'Yellowstone', 'Arches', 'Bryce Canyon', 'Zion', 'Olympic', 'Redwood', 'Yosemite', 'Grand Canyon', 'Denali'],
      transit: ['Scenic Railway', 'Park Shuttle', 'Ranger Trail', 'National Parks Highway'], utilities: ['Ranger Station', 'Conservation Service']
    },
    'My NFL': {
      currency: 'cash', audioProfile: 'nfl',
      properties: ['Training Camp', 'Draft Stage', 'Locker Room', 'Practice Field', 'Tailgate Plaza', 'Team Store', 'Press Box', 'Red Zone', 'End Zone', 'Fifty-Yard Line', 'Monday Night Stadium', 'Thursday Night Stadium', 'Sunday Night Stadium', 'Wild Card Field', 'Divisional Round Dome', 'Conference Championship Field', 'Pro Bowl Stadium', 'Hall of Fame Village', 'Commissioner’s Office', 'League Headquarters', 'Lombardi Plaza', 'Championship Stadium'],
      transit: ['Team Bus', 'Charter Flight', 'Stadium Shuttle', 'League Express'], utilities: ['Stadium Lights', 'Broadcast Network']
    },
    'Harley-Davidson': {
      currency: 'cash', audioProfile: 'harley',
      properties: ['Garage Workshop', 'Main Street Dealership', 'Flathead Foundry', 'Knucklehead Corner', 'Panhead Parkway', 'Sportster Street', 'Softail Boulevard', 'Dyna Drive', 'Road King Route', 'Fat Boy Freeway', 'Heritage Classic Highway', 'Electra Glide Avenue', 'Street Glide Station', 'Road Glide Ridge', 'V-Rod Valley', 'Sturgis Main Street', 'Daytona Bike Week', 'Route 66 Roadhouse', 'Milwaukee Museum', 'Juneau Avenue Factory', 'Open Road', 'Harley-Davidson Headquarters'],
      transit: ['Touring Bike', 'Cruiser Convoy', 'Motorcycle Ferry', 'Freedom Express'], utilities: ['V-Twin Engine Works', 'Chrome and Steel Company']
    },
    'Classic TV Shows': {
      currency: { singular: 'Rating Point', plural: 'Rating Points' }, audioProfile: 'classic-tv',
      properties: ['I Love Lucy Living Room', 'Ricky’s Tropicana Club', 'Mayberry Courthouse', 'Gilligan’s Island Lagoon', 'The Addams Family Mansion', 'Bewitched Suburban Home', 'Jeannie’s Bottle', 'Brady Bunch House', 'Cheers Bar', 'Taxi Garage', 'Mork’s Boulder Home', 'Happy Days Diner', 'Dallas Southfork Ranch', 'Dynasty Mansion', 'Knight Rider Garage', 'A-Team Workshop', 'Golden Girls Lanai', 'Miami Vice Marina', 'Star Trek Bridge', 'Muppet Theater', 'Twilight Zone', 'Prime-Time Television City'],
      transit: ['Studio Tram One', 'Network Shuttle', 'Broadcast Van', 'Prime-Time Express'], utilities: ['Television Network', 'Studio Lighting']
    },
    "Totally 80's": {
      currency: { singular: 'Arcade Token', plural: 'Arcade Tokens' }, audioProfile: 'eighties',
      properties: ['Cassette Tape Store', 'Roller Rink', 'Video Rental Shop', 'The Arcade Mall', 'Food Court Neon', 'Boombox Boulevard', 'Mixtape Market', 'Aerobics Studio', 'Neon Boulevard', 'Hair Metal Hall', 'Synthesizer Shop', 'Moonwalk Plaza', 'Rubik’s Cube Corner', 'Saturday Morning Arcade', 'Radical Skate Park', 'VHS Video Palace', 'Prom Night Ballroom', 'New Wave Nightclub', 'Mall Fountain', 'Retro Computer Lab', 'Electric Avenue', 'Totally Awesome Arena'],
      transit: ['Skateboard Shuttle', 'BMX Route', 'Neon Metro', 'Time-Warp Express'], utilities: ['Cable Television', 'Arcade Power Grid']
    },
    'Blockbuster Movies': {
      currency: { singular: 'Ticket', plural: 'Tickets' }, audioProfile: 'cinema',
      properties: ['The DeLorean Garage', 'Rocky’s Training Steps', 'Ghostbusters Firehouse', 'Jurassic Park', 'Indiana Jones Temple', 'E.T. Forest Landing', 'Jaws Harbor', 'King Kong Tower', 'The Death Star', 'Rebel Base', 'Wizarding Castle', 'Pirate Treasure Island', 'Superhero City', 'Spy Headquarters', 'Titanic Grand Staircase', 'Emerald City', 'Middle-earth Shire', 'Pandora Rainforest', 'Monster Island', 'Hollywood Backlot', 'Premiere Theater', 'Blockbuster Boulevard'],
      transit: ['Studio Tour Tram', 'Movie Star Limousine', 'Stunt Train', 'Premiere Express'], utilities: ['Special Effects Studio', 'Cinema Projection Works']
    },
    'Baseball Fever': {
      currency: { singular: 'Run', plural: 'Runs' }, audioProfile: 'baseball',
      properties: ['Spring Training Field', 'Little League Park', 'Wrigley Field', 'Fenway Park', 'Camden Yards', 'Busch Stadium', 'Oracle Park', 'Petco Park', 'Dodger Stadium', 'Angel Stadium', 'Minute Maid Park', 'Truist Park', 'Citi Field', 'Yankee Stadium', 'Coors Field', 'T-Mobile Park', 'Kauffman Stadium', 'Progressive Field', 'Field of Dreams', 'All-Star Ballpark', 'Hall of Fame Gallery', 'World Series Stadium'],
      transit: ['Team Bus', 'Bullpen Cart', 'Clubhouse Shuttle', 'Pennant Express'], utilities: ['Stadium Lights', 'Scoreboard Control']
    },
    'Basketball Court': {
      currency: { singular: 'Point', plural: 'Points' }, audioProfile: 'basketball',
      properties: ['The Free Throw Lane', 'Rookie Practice Gym', 'College Fieldhouse', 'Streetball Court', 'Madison Square Garden', 'Boston Garden Parquet', 'Chicago Basketball Arena', 'Los Angeles Basketball Center', 'Miami Beach Court', 'Phoenix Arena', 'Dallas Hardwood', 'San Antonio Court', 'Milwaukee Deer District', 'Denver Mountain Arena', 'Golden State Bay Court', 'Portland Rose Court', 'Seattle Basketball Pavilion', 'All-Star Skills Court', 'Three-Point Contest Stage', 'Hall of Fame Court', 'Finals Center Court', 'Championship Arena'],
      transit: ['Team Coach', 'Arena Shuttle', 'Charter Flight', 'Fast-Break Express'], utilities: ['Shot Clock System', 'Arena Lighting']
    },
    'Fast Food Boulevard': {
      currency: { singular: 'Meal Token', plural: 'Meal Tokens' }, audioProfile: 'fast-food',
      properties: ['Burger Stand', 'French Fry Corner', "McDonald's Golden Arches", 'Wendy’s Square', 'Taco Bell Tower', 'KFC Bucket Plaza', 'Subway Station Sandwich Shop', 'In-N-Out Corner', 'Chick-fil-A Lane', 'Sonic Drive-In', 'Dairy Queen Court', 'Pizza Hut Pavilion', 'Popeyes Place', 'Five Guys Grill', 'Jack in the Box Junction', 'Whataburger Way', 'Shake Shack Street', 'Chipotle Corner', 'Drive-Thru District', 'Food Delivery Hub', 'Combo Meal Plaza', 'Fast Food Boulevard'],
      transit: ['Drive-Thru Lane', 'Delivery Scooter', 'Food Truck Route', 'Express Pickup'], utilities: ['Grill Gas Company', 'Soda Fountain Works']
    },
    'The Restaurant Tour': {
      currency: { singular: 'Dining Credit', plural: 'Dining Credits' }, audioProfile: 'restaurant',
      properties: ['The Diner', 'Breakfast Cafe', 'Neighborhood Bistro', 'Olive Garden', 'Sushi Bar', 'Taco Cantina', 'French Brasserie', 'Italian Trattoria', 'Seafood Pier', 'Barbecue Smokehouse', 'The Steakhouse', 'Farm-to-Table Kitchen', 'Rooftop Restaurant', 'Dim Sum Hall', 'Mediterranean Terrace', 'Fondue Chalet', 'Tapas Lounge', 'Chef’s Tasting Room', 'Waterfront Dining Room', 'Five-Star Restaurant', 'Grand Banquet Hall', 'World Cuisine Boulevard'],
      transit: ['Restaurant Trolley', 'Valet Shuttle', 'Culinary Tour Bus', 'Dining Express'], utilities: ['Kitchen Gas Works', 'Restaurant Supply Company']
    },
    'California State Edition': {
      currency: 'cash', audioProfile: 'california',
      properties: ['Bakersfield Rosedale Highway', 'Kern River Canyon', 'Fresno Tower District', 'Sacramento Capitol', 'Lake Tahoe Shore', 'Napa Valley', 'Sonoma Plaza', 'San Francisco Cable Car Hill', 'Hollywood Walk of Fame', 'Santa Monica Pier', 'Malibu Coast', 'Long Beach Harbor', 'San Diego Gaslamp Quarter', 'Joshua Tree Desert', 'Palm Springs', 'Big Sur Coast', 'Monterey Bay', 'Redwood National Park', 'Yosemite Valley', 'Sequoia Grove', 'Golden Gate Bridge', 'California Dream Boulevard'],
      transit: ['Pacific Surfliner', 'California Highway One', 'Bay Area Transit', 'Golden State Express'], utilities: ['California Solar Grid', 'State Water Project']
    },
    'North Carolina State Edition': {
      currency: 'cash', audioProfile: 'north-carolina',
      properties: ['Mocksville Comfort Inn', 'Mocksville Town Square', 'Winston-Salem Arts District', 'Greensboro Downtown', 'High Point Furniture Market', 'Charlotte Speedway', 'Charlotte Uptown', 'Bank of America Stadium', 'Raleigh State Capitol', 'Durham Tobacco District', 'Chapel Hill Franklin Street', 'Research Triangle Park', 'Wilmington Riverwalk', 'Outer Banks Lighthouse', 'Cape Hatteras', 'Asheville Arts District', 'Biltmore Estate', 'Blue Ridge Parkway', 'Great Smoky Mountains', 'Grandfather Mountain', 'Pisgah National Forest', 'Carolina Heritage Boulevard'],
      transit: ['Piedmont Train', 'Carolina Coach', 'Blue Ridge Shuttle', 'Tar Heel Express'], utilities: ['Carolina Power', 'Mountain Spring Water']
    },
    "Totally 90's": {
      currency: { singular: 'CD Credit', plural: 'CD Credits' }, audioProfile: 'nineties',
      properties: ['Blockbuster Video', 'Dial-Up Boulevard', 'Tamagotchi Plaza', 'Boy Band Arena', 'Grunge Garage', 'Rollerblade Park', 'Beanie Baby Boutique', 'Video Game Rental Shop', 'Mall Food Court 1995', 'Saturday Morning Cartoon Studio', 'Portable CD Player Store', 'Flannel Fashion Avenue', 'Chat Room Cafe', 'Skateboard Warehouse', 'Mixtape Radio Station', 'VHS Home Theater', 'Desktop Computer Lab', 'Comic Book Superstore', 'Pop Music Pavilion', 'Millennium Countdown Square', 'World Wide Web Center', 'Totally 90s Boulevard'],
      transit: ['Inline Skate Route', 'Dial-Up Data Line', 'Compact Disc Shuttle', 'Y2K Express'], utilities: ['Internet Service Provider', 'Cable Music Television']
    },
    'Atari Classics': {
      currency: { singular: 'Pixel', plural: 'Pixels' }, audioProfile: 'atari',
      properties: ['Pong Court', 'Breakout Wall', 'Combat Arena', 'Adventure Castle', 'Asteroids Belt', 'Centipede Forest', 'Missile Command Base', 'Tempest Tube', 'Pitfall Jungle', 'River Raid Channel', 'Crystal Castles', 'Yars’ Revenge Sector', 'Lunar Lander Pad', 'Gravitar Galaxy', 'Haunted House', 'Warlords Fortress', 'Kaboom Factory', 'Dig Dug Cavern', 'Pole Position Raceway', 'Atari Video Computer Lab', 'High Score Hall', 'Atari Classics Arcade'],
      transit: ['Joystick Port One', 'Joystick Port Two', 'Cartridge Shuttle', 'Pixel Express'], utilities: ['Console Power Supply', 'Television Signal Switch']
    },
    'Cinematic Blockbusters': {
      currency: { singular: 'Premiere Ticket', plural: 'Premiere Tickets' }, audioProfile: 'cinematic-blockbusters',
      properties: ['Jurassic Park Gates', 'Titanic Bow', 'The Matrix Code', 'Star Wars Galaxy', 'Gotham Skyline', 'Wizarding Great Hall', 'Middle-earth Citadel', 'Pandora Floating Mountains', 'Impossible Mission Headquarters', 'Dinosaur Research Island', 'Ocean Liner Grand Staircase', 'Cyber Simulation Core', 'Rebel Starfighter Hangar', 'Superhero Tower', 'Secret Agent Casino', 'Lost Temple', 'Pirate Ship Harbor', 'Monster City', 'Time Travel Laboratory', 'International Premiere', 'Hollywood Epic Studio', 'Cinematic Universe Boulevard'],
      transit: ['Studio Limousine', 'Stunt Helicopter', 'Premiere Train', 'Cinematic Express'], utilities: ['Orchestral Score Stage', 'Visual Effects Laboratory']
    },
    'Classic Cartoons': {
      currency: { singular: 'Toon Coin', plural: 'Toon Coins' }, audioProfile: 'classic-cartoons',
      properties: ['Acme Factory', 'Bedrock Quarry', 'Orbit City', 'Scooby-Doo Haunted Mansion', 'Jellystone Park', 'Cartoon Desert Canyon', 'Mystery Machine Garage', 'Stone Age Bowling Alley', 'Space-Age Apartment', 'Toon Town Theater', 'Saturday Morning Studio', 'Cat and Mouse House', 'Duck Pond Soundstage', 'Sailor’s Spinach Dock', 'Coyote Canyon', 'Roadrunner Raceway', 'Ghost Pirate Cove', 'Dinosaur Drive-In', 'Animation Ink House', 'Cartoon Network Tower', 'Golden Age Animation Hall', 'Classic Cartoon Boulevard'],
      transit: ['Mystery Machine', 'Flying Toon Car', 'Stone Wheel Bus', 'Saturday Express'], utilities: ['Acme Gadget Works', 'Animation Paint Company']
    },
    '50s-70s TV Classics': {
      currency: { singular: 'Broadcast Credit', plural: 'Broadcast Credits' }, audioProfile: 'vintage-tv',
      properties: ["Lucy's Chocolate Factory", 'Twilight Zone', 'Addams Family Parlor', 'Beverly Hillbillies Mansion', 'Mayberry Barber Shop', 'Gotham City Batcave', 'Gilligan’s Island Hut', 'Jeannie’s Bottle', 'Bewitched Living Room', 'Brady Bunch Staircase', 'Starship Bridge', 'MASH Field Hospital', 'Hooterville Station', 'Sanford and Son Yard', 'Mary Tyler Moore Newsroom', 'All in the Family Living Room', 'Happy Days Diner', 'Walton Mountain', 'Fantasy Island Resort', 'Three’s Company Apartment', 'Prime-Time Studio', 'Classic Television Boulevard'],
      transit: ['Studio Tram', 'Network Broadcast Van', 'Retro Television Shuttle', 'Prime-Time Express'], utilities: ['Analog Broadcast Tower', 'Television Tube Works']
    },
    '80s-90s TV Hits': {
      currency: { singular: 'Syndication Point', plural: 'Syndication Points' }, audioProfile: 'tv-hits',
      properties: ['Fresh Prince Mansion', 'Golden Girls Lanai', 'Cheers Bar', 'Seinfeld Diner', 'Miami Vice Marina', 'Knight Rider Garage', 'A-Team Workshop', 'Family Ties Kitchen', 'Full House Home', 'Saved by the Bell Hallway', 'Twin Peaks Diner', 'Baywatch Beach', 'Frasier’s Apartment', 'Friends Coffee House', 'ER Hospital', 'X-Files Basement Office', 'Beverly Hills High School', 'Home Improvement Workshop', 'Saturday Night Studio', 'Must-See TV Plaza', 'Network Premiere Theater', 'Television Hits Boulevard'],
      transit: ['Sitcom Studio Shuttle', 'Network Limo', 'Cable Television Tram', 'Syndication Express'], utilities: ['Studio Audience Lights', 'Television Soundstage']
    },
    'Coca-Cola Classic': {
      currency: { singular: 'Coca-Cola Cap', plural: 'Coca-Cola Caps' }, audioProfile: 'cola',
      properties: ['Vintage Glass Bottle', 'Bottling Plant', 'Retro Delivery Truck', 'Soda Fountain', 'Contour Bottle Gallery', 'Classic Red Sign', 'Ice-Cold Cooler', 'Corner Drugstore Fountain', 'Polar Bear Pavilion', 'Holiday Caravan', 'Secret Formula Vault', 'World of Coca-Cola', 'Cherry Cola Corner', 'Vanilla Cola Avenue', 'Fountain Service Plaza', 'Bottle Cap Workshop', 'Sparkling Refreshment Hall', 'Red Disc Boulevard', 'Classic Advertising Studio', 'Centennial Bottling Campus', 'Coca-Cola Heritage Center', 'Coca-Cola Classic Boulevard'],
      transit: ['Delivery Truck Route', 'Bottling Line Shuttle', 'Fountain Service Express', 'Refreshment Railway'], utilities: ['Carbonation Works', 'Refrigeration Plant']
    },
    "Hershey's Chocolate": {
      currency: { singular: 'Chocolate Coin', plural: 'Chocolate Coins' }, audioProfile: 'chocolate',
      properties: ['Hershey Bar', "Reese's Cup", 'Kisses', 'Twizzlers', 'Chocolate Avenue', 'Cocoa Bean Corner', 'Milk Chocolate Lane', 'Dark Chocolate Drive', 'Candy Wrapper Workshop', 'Chocolate Fountain', 'Caramel Kitchen', 'Peanut Butter Pavilion', 'Hersheypark Entrance', 'Chocolate World', 'Kisses Tower', 'Cocoa Garden', 'Sweet Treat Market', 'Candy Factory Floor', 'Confectionery Hall', 'Chocolate Town Square', 'Hershey Heritage Center', 'Chocolate Dream Boulevard'],
      transit: ['Chocolate Trolley', 'Candy Factory Shuttle', 'Cocoa Bean Railway', 'Sweet Treat Express'], utilities: ['Cocoa Roasting Works', 'Candy Cooling Plant']
    },
    'Bass Fishing': {
      currency: { singular: 'Fish Hook', plural: 'Fish Hooks' }, audioProfile: 'fishing',
      properties: ['Largemouth Bass', 'Walleye', 'Tackle Box', 'Fishing Pier', 'Smallmouth Bass Cove', 'Trout Stream', 'Crappie Creek', 'Catfish Channel', 'Spinnerbait Shore', 'Topwater Bay', 'Casting Dock', 'Boat Ramp', 'Lily Pad Lagoon', 'Reed Bed River', 'Tournament Weigh-In', 'Angler’s Marina', 'Deep Water Point', 'Sunrise Fishing Hole', 'Champion’s Lake', 'Bass Pro Camp', 'Trophy Bass Waters', 'Grand Fishing Reservoir'],
      transit: ['Bass Boat Route', 'Fishing Skiff Ferry', 'Marina Shuttle', 'Angler Express'], utilities: ['Bait and Tackle Shop', 'Fish Hatchery']
    },
    'Ice Cream Dream': {
      currency: { singular: 'Scoop', plural: 'Scoops' }, audioProfile: 'ice-cream',
      properties: ['Rocky Road Avenue', 'Mint Chocolate Chip Lane', 'Vanilla Bean Corner', 'Waffle Cone Boulevard', 'Strawberry Swirl Street', 'Cookie Dough Court', 'Chocolate Fudge Drive', 'Pistachio Plaza', 'Butter Pecan Park', 'Rainbow Sherbet Row', 'Sundae Station', 'Sprinkle Square', 'Banana Split Bay', 'Caramel Ribbon Road', 'Gelato Garden', 'Frozen Custard Corner', 'Ice Cream Parlor', 'Cherry Topping Terrace', 'Double Scoop District', 'Neapolitan Neighborhood', 'Dream Cone Castle', 'Ice Cream Dream Boulevard'],
      transit: ['Ice Cream Truck Route', 'Freezer Van Shuttle', 'Sundae Trolley', 'Frozen Treat Express'], utilities: ['Cone Bakery', 'Creamery Freezer Works']
    },
    'Burger Joint': {
      currency: { singular: 'Burger Buck', plural: 'Burger Bucks' }, audioProfile: 'burger',
      properties: ['Double Cheeseburger Corner', 'Crispy Fry Lane', 'Milkshake Boulevard', 'Secret Sauce Highway', 'Griddle Grill Street', 'Sesame Bun Square', 'Pickle Plaza', 'Onion Ring Road', 'Bacon Burger Bay', 'Drive-In Diner', 'Order Counter', 'Kitchen Pass', 'Flame-Broiled Avenue', 'Classic Burger Stand', 'Combo Meal Court', 'Fry Basket Boulevard', 'Shake Machine Station', 'Patty Melt Place', 'Late-Night Drive-Thru', 'Burger Festival Grounds', 'Grand Grill Hall', 'Burger Joint Boulevard'],
      transit: ['Drive-Thru Lane', 'Delivery Scooter', 'Food Truck Route', 'Burger Express'], utilities: ['Grill Gas Works', 'Kitchen Refrigeration']
    },
    'National Federation of the Blind': {
      currency: { singular: 'Federation Buck', plural: 'Federation Bucks' }, audioProfile: 'nfb',
      properties: ['Jernigan Place', 'Braille Monitor Boulevard', 'Federation Hall', 'National Center for the Blind', 'Independence Market', 'Braille Literacy Lane', 'White Cane Way', 'Accessible Technology Center', 'Washington Seminar Plaza', 'National Convention Hall', 'Blindness Skills Academy', 'Mentoring Commons', 'Advocacy Avenue', 'Scholarship Square', 'Newsline Studio', 'Community Outreach Center', 'Future Reflections Library', 'Affiliate Assembly Hall', 'Freedom Trail', 'Equality Plaza', 'Kenneth Jernigan Institute', 'Federation Family Boulevard'],
      transit: ['White Cane Transit', 'Convention Shuttle', 'Affiliate Connector', 'Independence Express'], utilities: ['Accessible Technology Lab', 'Braille Production Center']
    },
    'Lego Creator': {
      currency: { singular: 'Stud', plural: 'Studs' }, audioProfile: 'lego',
      properties: ['Brick Lane', 'Minifigure Plaza', 'Technic Center', 'Creator Workshop', 'City Construction Site', 'Castle Courtyard', 'Space Base', 'Pirate Harbor', 'Ninjago Temple', 'Friends Heartlake Park', 'Train Station', 'Modular Building Row', 'Brick Separator Shop', 'Master Builder Hall', 'Vehicle Design Garage', 'Robot Laboratory', 'Imagination Square', 'Brick Museum', 'Collector Set Gallery', 'Ultimate Build Studio', 'Creator Expert Center', 'Grand Brick Boulevard'],
      transit: ['Brick-Built Train', 'Technic Transporter', 'Minifigure Shuttle', 'Stud Express'], utilities: ['Brick Molding Plant', 'Instruction Design Studio']
    },
    'Coffee House': {
      currency: { singular: 'Bean', plural: 'Beans' }, audioProfile: 'coffee',
      properties: ['Espresso Express', 'Cappuccino Corner', 'Cold Brew Lane', 'Latte Art Studio', 'Mocha Market', 'Americano Avenue', 'Macchiato Square', 'Roastery Road', 'Coffee Bean Warehouse', 'Cozy Reading Nook', 'Pastry Counter', 'Open Mic Stage', 'Morning Blend Boulevard', 'French Press Place', 'Pour-Over Plaza', 'Coffee Garden', 'Barista Academy', 'Neighborhood Cafe', 'Single-Origin Gallery', 'Grand Roasting Hall', 'Coffee Culture Center', 'Coffee House Boulevard'],
      transit: ['Coffee Cart Route', 'Roastery Shuttle', 'Cafe Delivery Van', 'Morning Express'], utilities: ['Espresso Machine Works', 'Steam Wand Station']
    },
    'Cookie Jar': {
      currency: { singular: 'Crumb', plural: 'Crumbs' }, audioProfile: 'cookie',
      properties: ['Chocolate Chip Boulevard', 'Snickerdoodle Square', 'Oatmeal Raisin Road', 'Sugar Cookie Street', 'Peanut Butter Place', 'Gingerbread Lane', 'Shortbread Shore', 'Macadamia Market', 'Double Chocolate Drive', 'Cookie Dough Corner', 'Baking Sheet Boulevard', 'Cookie Cutter Court', 'Sprinkle Sugar Plaza', 'Molasses Mill', 'Biscuit Bakery', 'Cookie Exchange', 'Grandma’s Recipe Kitchen', 'Fresh Batch Hall', 'Cookie Tin Terrace', 'Bakery Showcase', 'Golden Cookie Castle', 'Cookie Jar Boulevard'],
      transit: ['Cookie Delivery Van', 'Bakery Trolley', 'Dough Mixer Shuttle', 'Fresh Batch Express'], utilities: ['Cookie Oven Works', 'Cooling Rack Station']
    },
    'Cake Palace': {
      currency: { singular: 'Slice', plural: 'Slices' }, audioProfile: 'cake',
      properties: ['Red Velvet Lane', 'Carrot Cake Corner', 'Funfetti Plaza', 'Chocolate Layer Road', 'Vanilla Sponge Square', 'Lemon Cake Lane', 'Black Forest Boulevard', 'Cheesecake Court', 'Birthday Cake Ballroom', 'Frosting Fountain', 'Fondant Workshop', 'Cupcake Courtyard', 'Wedding Cake Gallery', 'Bundt Cake Bay', 'Angel Food Avenue', 'Cake Decorating Studio', 'Candlelight Hall', 'Party Table Terrace', 'Grand Bakery Kitchen', 'Celebration Square', 'Royal Cake Tower', 'Cake Palace Boulevard'],
      transit: ['Cake Cart Route', 'Bakery Shuttle', 'Party Van', 'Celebration Express'], utilities: ['Frosting Mixer Works', 'Palace Oven Room']
    },
    'Candy Land Tour': {
      currency: { singular: 'Sweet Treat', plural: 'Sweet Treats' }, audioProfile: 'candy',
      properties: ['Lollipop Lane', 'Gummy Bear Boulevard', 'Licorice Loop', 'Peppermint Plaza', 'Jelly Bean Junction', 'Chocolate Riverbank', 'Caramel Castle', 'Marshmallow Meadow', 'Taffy Terrace', 'Candy Cane Corner', 'Gumdrop Garden', 'Cotton Candy Clouds', 'Sour Candy Street', 'Toffee Town', 'Nougat Neighborhood', 'Rock Candy Ridge', 'Sweet Shop Square', 'Rainbow Candy Road', 'Confectionery Kingdom', 'Sugar Crystal Palace', 'Candy Crown Castle', 'Candy Land Boulevard'],
      transit: ['Candy Cart', 'Gumdrop Shuttle', 'Lollipop Trolley', 'Sweet Treat Express'], utilities: ['Sugar Works', 'Candy Wrapper Factory']
    },
    'Cars and Trucks': {
      currency: { singular: 'Horsepower', plural: 'Horsepower' }, audioProfile: 'vehicles',
      properties: ['Muscle Car Highway', 'Monster Truck Mudway', 'Big Rig Route', 'Sports Car Speedway', 'Pickup Truck Parkway', 'Classic Car Corner', 'Off-Road Trail', 'Tow Truck Terrace', 'Race Car Row', 'Electric Vehicle Avenue', 'Diesel Garage', 'Custom Car Shop', 'Truck Stop Plaza', 'Auto Show Pavilion', 'Drag Strip Drive', 'Four-Wheel-Drive Forest', 'Motor City Factory', 'Highway Service Center', 'Grand Prix Circuit', 'Car Collector Hall', 'Automotive Museum', 'Open Road Boulevard'],
      transit: ['Car Carrier', 'Heavy Haul Truck', 'Auto Train', 'Interstate Express'], utilities: ['Fuel Station', 'Vehicle Charging Grid']
    },
    'Full House': {
      currency: { singular: 'Hug', plural: 'Hugs' }, audioProfile: 'full-house',
      properties: ['The Tanner Living Room', 'Smash Club', 'The Attic Apartment', 'San Francisco Painted Lady', 'Tanner Kitchen', 'Backyard Picnic Table', 'Jesse’s Recording Studio', 'Joey’s Comedy Corner', 'D.J.’s Bedroom', 'Stephanie’s Dance Studio', 'Michelle’s Playroom', 'Wake Up San Francisco Studio', 'Comet’s Doghouse', 'Family Garage', 'Beach Picnic Spot', 'School Auditorium', 'Bay Area Music Hall', 'Family Photo Staircase', 'Neighborhood Park', 'Golden Gate Family Outing', 'Tanner Family Home', 'Full House Boulevard'],
      transit: ['Family Station Wagon', 'Cable Car Shuttle', 'Tour Van', 'San Francisco Express'], utilities: ['Sitcom Soundstage', 'Studio Audience Lights']
    },
    'Horse Stable': {
      currency: { singular: 'Horseshoe', plural: 'Horseshoes' }, audioProfile: 'horse',
      properties: ['Mustang Meadows', 'Clydesdale Lane', 'Pony Paddock', 'Thoroughbred Track', 'Arabian Arena', 'Quarter Horse Crossing', 'Appaloosa Acres', 'Palomino Pasture', 'Shetland Stable', 'Morgan Horse Manor', 'Dressage Court', 'Jumping Field', 'Trail Riding Ridge', 'Hayloft Hall', 'Tack Room Terrace', 'Grooming Barn', 'Training Round Pen', 'Champion’s Corral', 'Equestrian Center', 'Grandstand Track', 'Royal Stable', 'Horse Country Boulevard'],
      transit: ['Horse Trailer', 'Carriage Route', 'Stable Shuttle', 'Equestrian Express'], utilities: ['Feed and Grain Mill', 'Veterinary Clinic']
    }
  };

  // Large edition families use eleven theme anchors twice to produce the
  // twenty-two property slots required by the standard dynamic 40-space map.
  // Keeping the source catalog compact makes it practical to add editions
  // without copying or hand-numbering board layouts.
  function addCatalogTheme(name, currency, audioProfile, anchors, transit, utilities) {
    if (themeData[name]) return;
    if (anchors.length !== 11) throw new Error(`${name} must define exactly 11 theme anchors.`);
    themeData[name] = {
      currency, audioProfile,
      properties: anchors.flatMap(anchor => [anchor, `${anchor} District`]),
      transit, utilities,
      chanceName: `${name} Adventure`,
      chestName: `${name} Community Fund`
    };
  }

  const catalogThemes = [
    ['Los Angeles','Star','city-west',['Olvera Street','Griffith Observatory','Hollywood Boulevard','Echo Park','Dodger Stadium','The Getty','Sunset Strip','Venice Beach','Santa Monica Pier','Beverly Hills','Downtown Skyline'],['Metro A Line','Hollywood Tour Bus','Pacific Coast Shuttle','LAX Express'],['Los Angeles Water Works','Solar Power Grid']],
    ['San Francisco','Cable Car Token','city-bay',['Fisherman’s Wharf','Chinatown Gate','Painted Ladies','Lombard Street','Coit Tower','Alamo Square','Ferry Building','Palace of Fine Arts','Golden Gate Park','Alcatraz Island','Golden Gate Bridge'],['Powell Cable Car','Bay Ferry','BART Connector','Golden Gate Express'],['Hetch Hetchy Water','Bay Area Power']],
    ['San Diego','Sun Token','city-coast',['Old Town','Balboa Park','Gaslamp Quarter','Seaport Village','Coronado Beach','Liberty Station','La Jolla Cove','Torrey Pines','Mission Bay','San Diego Zoo','Hotel del Coronado'],['San Diego Trolley','Coaster Train','Harbor Ferry','Pacific Surfliner'],['San Diego Water','Coastal Solar Grid']],
    ['Northern California','Redwood Coin','city-bay',['Sacramento Capitol','Napa Valley','Sonoma Plaza','Lake Tahoe','Mendocino Coast','Point Reyes','Mount Shasta','Lassen Peak','Avenue of the Giants','Redwood National Park','Golden Gate Bridge'],['Capitol Corridor','Wine Country Train','Redwood Highway','Northern California Express'],['Shasta Hydroelectric','Delta Water Project']],
    ['Central California','Valley Credit','city-west',['Bakersfield','Fresno Tower District','San Joaquin Valley','Kern River','Morro Bay','Pismo Beach','Paso Robles','Monterey Bay','Carmel Mission','Big Sur','Yosemite Valley'],['San Joaquins Train','Highway 99 Coach','Coast Starlight','Central California Express'],['Central Valley Water','Solar Farm']],
    ['Southern California','Sunshine Credit','city-coast',['Santa Barbara','Malibu Coast','Hollywood','Downtown Los Angeles','Long Beach Harbor','Anaheim Resort','Newport Beach','Palm Springs','Joshua Tree','La Jolla','Coronado Island'],['Pacific Surfliner','Metrolink','Coastal Highway','SoCal Express'],['Colorado River Aqueduct','Desert Solar Grid']],
    ['Las Vegas Strip','Show Credit','vegas',['Welcome to Las Vegas Sign','Mandalay Bay','Luxor Pyramid','Bellagio Fountains','Paris Las Vegas','Caesars Palace','The Venetian','Wynn Esplanade','Sphere Plaza','Fremont Street','Strip Skyline'],['Monorail South','Casino Tram','Strip Limousine','Monorail North'],['Neon Power Company','Desert Water Works']],
    ['Vegas Slots & Casinos','Casino Chip','vegas-slots',['Penny Slot Parlor','Lucky Sevens Room','Blackjack Table','Craps Pit','Poker Room','Sportsbook','Roulette Salon','High Roller Lounge','Jackpot Hall','VIP Casino Floor','Mega Jackpot Vault'],['Casino Shuttle','Fremont Loop','High Roller Tram','Jackpot Express'],['Casino Security','Gaming Power Grid']],
    ['Baltimore Harbor','Harbor Token','harbor',['Fells Point','Little Italy','Federal Hill','Camden Yards','Lexington Market','B&O Railroad Museum','Fort McHenry','National Aquarium','Inner Harbor','Patterson Park','Chesapeake Bay'],['Charm City Circulator','Water Taxi','Light RailLink','Harbor Express'],['Chesapeake Water Works','Harbor Power Station']],
    ['Austin Music','Guitar Pick','austin',['Sixth Street','South Congress','Rainey Street','Continental Club','Broken Spoke','Zilker Park','Barton Springs','Moody Theater','University of Texas','Capitol Music Lawn','Live Music Capital'],['CapMetro Rail','Music Venue Shuttle','Pedicab Route','Austin Express'],['Stage Lighting Works','Amplifier Power']],
    ['Dallas/Fort Worth','Lone Star Credit','texas',['Deep Ellum','Dallas Arts District','Bishop Arts','Reunion Tower','Fair Park','Arlington Stadiums','Fort Worth Stockyards','Sundance Square','Kimbell Art Museum','Trinity River','DFW Metroplex'],['DART Rail','TRE Railway','Trinity Metro','DFW Express'],['Trinity Water Works','Texas Power Grid']],
    ['Tyler Texas','Rose Token','texas',['Downtown Tyler','Azalea District','Bergfeld Park','Cotton Belt Depot','Caldwell Zoo','Lake Tyler','Texas Rose Museum','Tyler State Park','Rose Garden','East Texas Arboretum','Rose City Boulevard'],['Rose City Trolley','Cotton Belt Route','East Texas Coach','Tyler Express'],['Lake Tyler Water','East Texas Power']],
    ['Denver Mile High','Mile High Coin','mountain',['Larimer Square','Union Station','City Park','Denver Art Museum','Capitol Hill','Red Rocks','Cherry Creek','Coors Field','Mile High Stadium','Rocky Mountain Gateway','Mile High Skyline'],['RTD A Line','Light Rail','Mountain Shuttle','Mile High Express'],['Mountain Water Works','Front Range Power']],
    ['Orlando Theme Parks','Park Pass','theme-park',['International Drive','Lake Eola','Universal CityWalk','Islands of Adventure','SeaWorld Harbor','Discovery Cove','EPCOT Gateway','Animal Kingdom Lodge','Hollywood Studios','Magic Kingdom','Orlando Resort Boulevard'],['Resort Monorail','Park Shuttle','Sky Gondola','Orlando Express'],['Attraction Power Works','Resort Water Service']],
    ['Miami Neon','Neon Credit','neon',['Little Havana','Coconut Grove','Wynwood Walls','Bayside Marketplace','Brickell Avenue','Ocean Drive','South Beach','Art Deco District','Key Biscayne','Miami Beach Marina','Magic City Skyline'],['Metrorail','Metromover','Bay Ferry','Neon Express'],['Biscayne Water Works','Neon Power Grid']],
    ['Atlanta Peachtree','Peach Token','city-south',['Sweet Auburn','Little Five Points','Piedmont Park','Centennial Park','Ponce City Market','Fox Theatre','Georgia Aquarium','World of Coca-Cola','Buckhead','Peachtree Street','Atlanta Skyline'],['MARTA Rail','Peachtree Trolley','BeltLine Shuttle','Atlanta Express'],['Chattahoochee Water','Georgia Power Grid']],
    ['New York City','Metro Token','city-east',['Lower East Side','Greenwich Village','Wall Street','Brooklyn Bridge','Times Square','Broadway','Central Park','Museum Mile','Grand Central Terminal','Empire State Building','Statue of Liberty'],['Subway Local','Staten Island Ferry','Subway Express','Grand Central Line'],['Croton Water Works','New York Power Grid']],
    ['Fast Food Joint','Combo Coupon','fast-food',['Burger Counter','French Fry Station','Chicken Shack','Taco Window','Pizza Counter','Sandwich Shop','Milkshake Bar','Drive-In Diner','Food Truck Court','Drive-Thru Plaza','Super Combo Kitchen'],['Drive-Thru Lane','Delivery Scooter','Food Truck Route','Pickup Express'],['Grill Gas Works','Soda Fountain']],
    ['Mexican Feast','Fiesta Peso','mexican',['Taco Stand','Tamale Kitchen','Pozole Pot','Enchilada House','Quesadilla Corner','Mole Market','Churro Cart','Salsa Garden','Mariachi Plaza','Fiesta Banquet Hall','Grand Hacienda'],['Cantina Trolley','Market Shuttle','Mariachi Coach','Fiesta Express'],['Comal Gas Works','Agua Fresca Station']],
    ['Disneyland','Magic Ticket','magic',['Main Street Station','Adventureland','New Orleans Square','Critter Country','Frontierland','Fantasyland','Mickey’s Toontown','Tomorrowland','Sleeping Beauty Castle','Matterhorn Mountain','Disneyland Plaza'],['Disneyland Railroad','Monorail','Horse-Drawn Streetcar','Magic Express'],['Imagineering Power','Park Water Works']],
    ['Beauty and the Beast','Enchanted Rose','magic',['Belle’s Village','Bookshop','Maurice’s Workshop','Enchanted Forest','Beast’s Castle','Grand Staircase','West Wing','Library','Ballroom','Castle Garden','Enchanted Palace'],['Philippe’s Carriage','Village Coach','Wardrobe Shuttle','Enchanted Express'],['Lumière Lighting','Mrs. Potts Tea Works']],
    ['Aladdin','Golden Dinar','magic',['Agrabah Gate','Marketplace','Aladdin’s Rooftop','Cave of Wonders','Magic Carpet Skyway','Royal Menagerie','Desert Oasis','Sultan’s Palace','Jasmine’s Garden','Genie’s Lamp Chamber','Whole New World'],['Magic Carpet Route','Camel Caravan','Royal Barge','Agrabah Express'],['Genie Power','Oasis Water Works']],
    ['Mickey and Minnie','Mouse Token','magic',['Mickey’s House','Minnie’s House','Toontown Square','Minnie’s Bow Shop','Mickey’s Workshop','Garden Picnic','Clubhouse','Steamboat Dock','Cartoon Studio','Mouse Celebration Hall','Mickey and Minnie Plaza'],['Steamboat Willie','Toontown Trolley','Mouseketeer Bus','Clubhouse Express'],['Toon Paint Works','Clubhouse Power']],
    ['Theme Park Tour','Ride Ticket','theme-park',['Entrance Plaza','Carousel Court','Log Flume Landing','Haunted Mansion','Pirate Harbor','Jungle River','Space Coaster','Ferris Wheel','Water Park','Fireworks Castle','Grand Theme Park'],['Park Railroad','Sky Ride','Monorail','Tour Express'],['Ride Control Center','Park Water Works']],
    ['Scooby-Doo','Scooby Snack','cartoon-mystery',['Mystery Inc. Office','Coolsville','Haunted Museum','Creepy Carnival','Ghost Pirate Cove','Old Lighthouse','Spooky Swamp','Abandoned Mine','Haunted Mansion','Monster Castle','Mystery Solved Hall'],['Mystery Machine','Ghost Train','Clue Van','Scooby Express'],['Trap Workshop','Flashlight Battery Works']],
    ['The Flintstones','Clam','stone-age',['Fred’s Quarry','Barney’s House','Bedrock Bowl','Drive-In Theater','Water Buffalo Lodge','Slate and Company','Dinosaur Park','Bedrock School','Rockhead Mansion','Bedrock Town Square','Flintstone Family Home'],['Footmobile Route','Dinosaur Bus','Stone Wheel Taxi','Bedrock Express'],['Dinosaur Power','Bedrock Water Works']],
    ['The Jetsons','Space Credit','space-age',['Orbit City','Skypad Apartments','Spacely Sprockets','Cogswell Cogs','Moon Mall','Asteroid Park','Robot Maid Center','Flying Car Garage','Space School','Cosmic Plaza','Jetson Family Skyhome'],['Flying Car Lane','Space Bus','Orbital Shuttle','Jetsons Express'],['Fusion Power Works','Robot Service Center']],
    ['Looney Tunes','Toon Coin','cartoon',['Bugs Bunny Burrow','Daffy Duck Pond','Tweety’s Birdhouse','Sylvester’s Alley','Porky’s Studio','Tasmanian Desert','Marvin’s Mars Base','Wile E. Workshop','Road Runner Canyon','Acme Factory','Looney Tunes Stage'],['Acme Rocket','Toon Taxi','Desert Train','Looney Express'],['Acme Gadget Works','Animation Paint Company']],
    ['Train Station','Rail Token','train',['Ticket Office','Platform One','Signal Box','Roundhouse','Freight Yard','Dining Car Depot','Sleeper Car Terminal','Mountain Pass','Grand Viaduct','Central Concourse','Grand Union Station'],['Steam Local','Coastal Limited','Mountain Flyer','Transcontinental Express'],['Railway Signal Power','Locomotive Water Tower']]
  ];

  for (const [name, currencyName, audioProfile, anchors, transit, utilities] of catalogThemes) {
    addCatalogTheme(name, { singular: currencyName, plural: `${currencyName}s` }, audioProfile, anchors, transit, utilities);
  }

  function stateRecord(capital, famousLandmark, nickname, cities, mainRoute, stateParks) {
    return { capital, famousLandmark, nickname, cities, railroads: [mainRoute, `${capital} Connector`, `${nickname} Scenic Byway`, 'Statewide Transit Express'], stateParks };
  }

  const stateData = {
    Alabama: stateRecord('Montgomery', 'USS Alabama Battleship', 'The Yellowhammer State', ['Birmingham','Mobile','Huntsville','Tuscaloosa','Auburn','Dothan','Decatur','Florence'], 'I-65 Expressway', ['Oak Mountain State Park','Cheaha State Park']),
    Alaska: stateRecord('Juneau', 'Denali', 'The Last Frontier', ['Anchorage','Fairbanks','Sitka','Ketchikan','Wasilla','Kodiak','Kenai','Nome'], 'Alaska Railroad', ['Chugach State Park','Tongass National Forest']),
    Arizona: stateRecord('Phoenix', 'Grand Canyon', 'The Grand Canyon State', ['Tucson','Mesa','Scottsdale','Tempe','Flagstaff','Sedona','Yuma','Chandler'], 'I-10 Expressway', ['Saguaro National Park','Petrified Forest National Park']),
    Arkansas: stateRecord('Little Rock', 'Hot Springs Bathhouse Row', 'The Natural State', ['Fayetteville','Fort Smith','Springdale','Jonesboro','Conway','Bentonville','Pine Bluff','Eureka Springs'], 'I-40 Expressway', ['Petit Jean State Park','Ozark National Forest']),
    California: stateRecord('Sacramento', 'Golden Gate Bridge', 'The Golden State', ['Los Angeles','San Diego','San Jose','San Francisco','Fresno','Bakersfield','Oakland','Long Beach'], 'Amtrak Pacific Surfliner', ['Yosemite National Park','Redwood National Park']),
    Colorado: stateRecord('Denver', 'Pikes Peak', 'The Centennial State', ['Colorado Springs','Aurora','Fort Collins','Boulder','Aspen','Pueblo','Vail','Grand Junction'], 'I-70 Expressway', ['Rocky Mountain National Park','Mesa Verde National Park']),
    Connecticut: stateRecord('Hartford', 'Mystic Seaport', 'The Constitution State', ['Bridgeport','New Haven','Stamford','Waterbury','Norwalk','Danbury','Greenwich','New London'], 'I-95 Expressway', ['Hammonasset Beach State Park','Sleeping Giant State Park']),
    Delaware: stateRecord('Dover', 'Rehoboth Beach Boardwalk', 'The First State', ['Wilmington','Newark','Middletown','Milford','Seaford','Lewes','Smyrna','Georgetown'], 'US-13 Expressway', ['Cape Henlopen State Park','Trap Pond State Park']),
    Florida: stateRecord('Tallahassee', 'Everglades', 'The Sunshine State', ['Jacksonville','Miami','Tampa','Orlando','St. Petersburg','Fort Lauderdale','Key West','Daytona Beach'], 'I-95 Expressway', ['Everglades National Park','Biscayne National Park']),
    Georgia: stateRecord('Atlanta', 'Stone Mountain', 'The Peach State', ['Savannah','Augusta','Columbus','Macon','Athens','Marietta','Albany','Valdosta'], 'I-75 Expressway', ['Amicalola Falls State Park','Chattahoochee National Forest']),
    Hawaii: stateRecord('Honolulu', 'Diamond Head', 'The Aloha State', ['Hilo','Kailua','Kaneohe','Waipahu','Lahaina','Kahului','Kapolei','Hanalei'], 'H-1 Expressway', ['Hawaii Volcanoes National Park','Haleakala National Park']),
    Idaho: stateRecord('Boise', 'Shoshone Falls', 'The Gem State', ['Meridian','Nampa','Idaho Falls','Pocatello','Coeur d’Alene','Twin Falls','Lewiston','Sun Valley'], 'I-84 Expressway', ['Sawtooth National Forest','Harriman State Park']),
    Illinois: stateRecord('Springfield', 'Willis Tower', 'The Prairie State', ['Chicago','Aurora','Rockford','Joliet','Naperville','Peoria','Champaign','Galena'], 'Amtrak Lincoln Service', ['Starved Rock State Park','Shawnee National Forest']),
    Indiana: stateRecord('Indianapolis', 'Indianapolis Motor Speedway', 'The Hoosier State', ['Fort Wayne','Evansville','South Bend','Carmel','Bloomington','Gary','Lafayette','Terre Haute'], 'I-65 Expressway', ['Brown County State Park','Indiana Dunes National Park']),
    Iowa: stateRecord('Des Moines', 'Field of Dreams', 'The Hawkeye State', ['Cedar Rapids','Davenport','Sioux City','Iowa City','Ames','Dubuque','Waterloo','Council Bluffs'], 'I-80 Expressway', ['Ledges State Park','Maquoketa Caves State Park']),
    Kansas: stateRecord('Topeka', 'Monument Rocks', 'The Sunflower State', ['Wichita','Overland Park','Kansas City','Olathe','Lawrence','Manhattan','Dodge City','Salina'], 'I-70 Expressway', ['Tallgrass Prairie National Preserve','Kanopolis State Park']),
    Kentucky: stateRecord('Frankfort', 'Churchill Downs', 'The Bluegrass State', ['Louisville','Lexington','Bowling Green','Owensboro','Covington','Paducah','Richmond','Berea'], 'I-64 Expressway', ['Mammoth Cave National Park','Red River Gorge']),
    Louisiana: stateRecord('Baton Rouge', 'French Quarter', 'The Pelican State', ['New Orleans','Shreveport','Lafayette','Lake Charles','Monroe','Alexandria','Houma','Natchitoches'], 'I-10 Expressway', ['Fontainebleau State Park','Kisatchie National Forest']),
    Maine: stateRecord('Augusta', 'Portland Head Light', 'The Pine Tree State', ['Portland','Bangor','Lewiston','Bar Harbor','Rockland','Kennebunkport','Biddeford','Presque Isle'], 'I-95 Expressway', ['Acadia National Park','Baxter State Park']),
    Maryland: stateRecord('Annapolis', 'Fort McHenry', 'The Old Line State', ['Baltimore','Frederick','Rockville','Gaithersburg','Bowie','Hagerstown','Ocean City','Cumberland'], 'I-95 Expressway', ['Assateague State Park','Patapsco Valley State Park']),
    Massachusetts: stateRecord('Boston', 'Freedom Trail', 'The Bay State', ['Worcester','Springfield','Cambridge','Lowell','Salem','Plymouth','Cape Cod','Martha’s Vineyard'], 'MBTA Commuter Rail', ['Cape Cod National Seashore','Blue Hills Reservation']),
    Michigan: stateRecord('Lansing', 'Mackinac Bridge', 'The Great Lakes State', ['Detroit','Grand Rapids','Ann Arbor','Flint','Kalamazoo','Traverse City','Dearborn','Marquette'], 'I-75 Expressway', ['Sleeping Bear Dunes','Porcupine Mountains State Park']),
    Minnesota: stateRecord('Saint Paul', 'Mall of America', 'The North Star State', ['Minneapolis','Duluth','Rochester','Bloomington','Mankato','St. Cloud','Bemidji','Stillwater'], 'I-35 Expressway', ['Itasca State Park','Boundary Waters Canoe Area']),
    Mississippi: stateRecord('Jackson', 'Vicksburg National Military Park', 'The Magnolia State', ['Gulfport','Southaven','Hattiesburg','Biloxi','Tupelo','Meridian','Oxford','Natchez'], 'I-55 Expressway', ['Tishomingo State Park','De Soto National Forest']),
    Missouri: stateRecord('Jefferson City', 'Gateway Arch', 'The Show-Me State', ['Kansas City','St. Louis','Springfield','Columbia','Branson','Independence','St. Joseph','Joplin'], 'I-70 Expressway', ['Lake of the Ozarks State Park','Mark Twain National Forest']),
    Montana: stateRecord('Helena', 'Glacier National Park', 'The Treasure State', ['Billings','Missoula','Great Falls','Bozeman','Butte','Kalispell','Whitefish','Livingston'], 'I-90 Expressway', ['Glacier National Park','Flathead National Forest']),
    Nebraska: stateRecord('Lincoln', 'Chimney Rock', 'The Cornhusker State', ['Omaha','Bellevue','Grand Island','Kearney','Fremont','Hastings','North Platte','Scottsbluff'], 'I-80 Expressway', ['Platte River State Park','Fort Robinson State Park']),
    Nevada: stateRecord('Carson City', 'Las Vegas Strip', 'The Silver State', ['Las Vegas','Reno','Henderson','Sparks','Elko','Mesquite','Boulder City','Virginia City'], 'I-80 Expressway', ['Valley of Fire State Park','Red Rock Canyon']),
    'New Hampshire': stateRecord('Concord', 'Mount Washington', 'The Granite State', ['Manchester','Nashua','Portsmouth','Dover','Keene','Laconia','Hanover','North Conway'], 'I-93 Expressway', ['Franconia Notch State Park','White Mountain National Forest']),
    'New Jersey': stateRecord('Trenton', 'Atlantic City Boardwalk', 'The Garden State', ['Newark','Jersey City','Paterson','Atlantic City','Princeton','Hoboken','Cape May','Asbury Park'], 'NJ Transit Northeast Corridor', ['Liberty State Park','Wharton State Forest']),
    'New Mexico': stateRecord('Santa Fe', 'Carlsbad Caverns', 'The Land of Enchantment', ['Albuquerque','Las Cruces','Roswell','Taos','Farmington','Clovis','Silver City','Gallup'], 'I-40 Expressway', ['White Sands National Park','Gila National Forest']),
    'New York': stateRecord('Albany', 'Statue of Liberty', 'The Empire State', ['New York City','Buffalo','Rochester','Syracuse','Yonkers','Ithaca','Saratoga Springs','Niagara Falls'], 'Amtrak Empire Service', ['Adirondack Park','Catskill Park']),
    'North Carolina': stateRecord('Raleigh', 'Biltmore Estate', 'The Tar Heel State', ['Charlotte','Greensboro','Durham','Winston-Salem','Asheville','Wilmington','Mocksville','Chapel Hill'], 'I-40 Expressway', ['Great Smoky Mountains National Park','Pisgah National Forest']),
    'North Dakota': stateRecord('Bismarck', 'Theodore Roosevelt National Park', 'The Peace Garden State', ['Fargo','Grand Forks','Minot','West Fargo','Williston','Dickinson','Mandan','Jamestown'], 'I-94 Expressway', ['Theodore Roosevelt National Park','Fort Abraham Lincoln State Park']),
    Ohio: stateRecord('Columbus', 'Rock and Roll Hall of Fame', 'The Buckeye State', ['Cleveland','Cincinnati','Toledo','Akron','Dayton','Canton','Youngstown','Sandusky'], 'I-71 Expressway', ['Hocking Hills State Park','Cuyahoga Valley National Park']),
    Oklahoma: stateRecord('Oklahoma City', 'Route 66', 'The Sooner State', ['Tulsa','Norman','Broken Arrow','Lawton','Edmond','Stillwater','Muskogee','Enid'], 'I-40 Expressway', ['Beavers Bend State Park','Wichita Mountains Wildlife Refuge']),
    Oregon: stateRecord('Salem', 'Crater Lake', 'The Beaver State', ['Portland','Eugene','Bend','Medford','Corvallis','Ashland','Astoria','Hood River'], 'I-5 Expressway', ['Crater Lake National Park','Columbia River Gorge']),
    Pennsylvania: stateRecord('Harrisburg', 'Liberty Bell', 'The Keystone State', ['Philadelphia','Pittsburgh','Allentown','Erie','Scranton','Lancaster','Bethlehem','Gettysburg'], 'Pennsylvania Turnpike', ['Pocono Mountains','Ohiopyle State Park']),
    'Rhode Island': stateRecord('Providence', 'Newport Mansions', 'The Ocean State', ['Warwick','Cranston','Pawtucket','Newport','Westerly','Bristol','Narragansett','Block Island'], 'I-95 Expressway', ['Colt State Park','Beavertail State Park']),
    'South Carolina': stateRecord('Columbia', 'Fort Sumter', 'The Palmetto State', ['Charleston','Greenville','Myrtle Beach','Spartanburg','Hilton Head','Rock Hill','Florence','Beaufort'], 'I-26 Expressway', ['Congaree National Park','Hunting Island State Park']),
    'South Dakota': stateRecord('Pierre', 'Mount Rushmore', 'The Mount Rushmore State', ['Sioux Falls','Rapid City','Aberdeen','Brookings','Deadwood','Mitchell','Sturgis','Spearfish'], 'I-90 Expressway', ['Custer State Park','Badlands National Park']),
    Tennessee: stateRecord('Nashville', 'Graceland', 'The Volunteer State', ['Memphis','Knoxville','Chattanooga','Clarksville','Gatlinburg','Franklin','Murfreesboro','Pigeon Forge'], 'I-40 Expressway', ['Great Smoky Mountains National Park','Fall Creek Falls State Park']),
    Texas: stateRecord('Austin', 'The Alamo', 'The Lone Star State', ['Houston','Dallas','San Antonio','Fort Worth','El Paso','Arlington','Corpus Christi','Waco'], 'I-10 Expressway', ['Big Bend National Park','Guadalupe Mountains National Park']),
    Utah: stateRecord('Salt Lake City', 'Delicate Arch', 'The Beehive State', ['Provo','West Valley City','Ogden','St. George','Park City','Moab','Logan','Cedar City'], 'I-15 Expressway', ['Zion National Park','Bryce Canyon National Park']),
    Vermont: stateRecord('Montpelier', 'Ben and Jerry’s Factory', 'The Green Mountain State', ['Burlington','South Burlington','Rutland','Barre','Stowe','Brattleboro','Woodstock','Middlebury'], 'I-89 Expressway', ['Green Mountain National Forest','Smugglers Notch State Park']),
    Virginia: stateRecord('Richmond', 'Colonial Williamsburg', 'The Old Dominion', ['Virginia Beach','Norfolk','Chesapeake','Arlington','Alexandria','Roanoke','Charlottesville','Williamsburg'], 'I-95 Expressway', ['Shenandoah National Park','First Landing State Park']),
    Washington: stateRecord('Olympia', 'Space Needle', 'The Evergreen State', ['Seattle','Spokane','Tacoma','Vancouver','Bellevue','Everett','Bellingham','Walla Walla'], 'I-5 Expressway', ['Olympic National Park','Mount Rainier National Park']),
    'West Virginia': stateRecord('Charleston', 'New River Gorge Bridge', 'The Mountain State', ['Huntington','Morgantown','Parkersburg','Wheeling','Martinsburg','Beckley','Fairmont','Harpers Ferry'], 'I-64 Expressway', ['New River Gorge National Park','Blackwater Falls State Park']),
    Wisconsin: stateRecord('Madison', 'Lambeau Field', 'The Badger State', ['Milwaukee','Green Bay','Kenosha','Racine','Appleton','Eau Claire','La Crosse','Wisconsin Dells'], 'I-94 Expressway', ['Devil’s Lake State Park','Chequamegon National Forest']),
    Wyoming: stateRecord('Cheyenne', 'Old Faithful', 'The Equality State', ['Casper','Laramie','Gillette','Rock Springs','Jackson','Cody','Sheridan','Evanston'], 'I-80 Expressway', ['Yellowstone National Park','Grand Teton National Park'])
  };

  function buildBoard(edition, data) {
    let propertyIndex = 0;
    let transitIndex = 0;
    let utilityIndex = 0;
    const nextProperty = () => property(data.properties[propertyIndex], propertyIndex++, edition, data.groups);
    const nextTransit = () => transport(data.transit[transitIndex++], edition);
    const nextUtility = () => utility(data.utilities[utilityIndex++], edition);
    const chanceName = data.chanceName || 'Chance';
    const chestName = data.chestName || 'Community Chest';
    return [
      special(data.goName || 'GO', 'Go'), nextProperty(), special(chestName, 'Community Chest'), nextProperty(), special(data.incomeTaxName || 'Income Tax', 'Tax', 200), nextTransit(), nextProperty(), special(chanceName, 'Chance'), nextProperty(), nextProperty(),
      special(data.jailName || 'Jail / Just Visiting', 'Jail'), nextProperty(), nextUtility(), nextProperty(), nextProperty(), nextTransit(), nextProperty(), special(chestName, 'Community Chest'), nextProperty(), nextProperty(),
      special(data.freeParkingName || 'Free Parking', 'Free Parking'), nextProperty(), special(chanceName, 'Chance'), nextProperty(), nextProperty(), nextTransit(), nextProperty(), nextProperty(), nextUtility(), nextProperty(),
      special(data.goToJailName || 'Go to Jail', 'Go to Jail'), nextProperty(), nextProperty(), special(chestName, 'Community Chest'), nextProperty(), nextTransit(), special(chanceName, 'Chance'), nextProperty(), special(data.luxuryTaxName || 'Luxury Tax', 'Tax', 100), nextProperty()
    ].map((space, index) => ({ ...space, index }));
  }

  function generateStateBoard(stateName) {
    const requested = String(stateName || '').trim().replace(/ State Edition$/i, '');
    const canonicalName = Object.keys(stateData).find(name => name.toLowerCase() === requested.toLowerCase());
    if (!canonicalName) throw new Error(`Unknown US state: ${stateName}`);
    const data = stateData[canonicalName];
    const suffixes = ['District', 'Heights', 'Plaza'];
    const cityProperties = Array.from({ length: 20 }, (_unused, index) => index < data.cities.length ? data.cities[index] : `${data.cities[index % data.cities.length]} ${suffixes[Math.floor(index / data.cities.length) - 1]}`);
    const edition = `${canonicalName} State Edition`;
    return buildBoard(edition, {
      properties: [...cityProperties, data.famousLandmark, data.capital],
      transit: data.railroads, utilities: data.stateParks,
      chanceName: `${data.nickname} Chance`, chestName: `${data.nickname} Community Chest`
    });
  }

  function createBoard(edition) {
    if (/ State Edition$/i.test(edition)) return generateStateBoard(edition);
    const data = themeData[edition];
    if (!data) throw new Error(`Unknown Monopoly edition: ${edition}`);
    return buildBoard(edition, data);
  }

  const themedEditions = Object.keys(themeData).filter(edition => !/ State Edition$/.test(edition));
  const stateEditions = Object.keys(stateData).map(state => `${state} State Edition`);
  const editions = [...themedEditions, ...stateEditions];
  const boards = Object.fromEntries(editions.map(edition => [edition, createBoard(edition)]));

  const tokenCategories = Object.freeze({
    california: [['Palm Tree','🌴'],['Cable Car','🚋'],['Surfboard','🏄'],['California Poppy','🌺'],['Sunglasses','🕶️'],['Vintage Camper','🚐']],
    texas: [['Cowboy Boot','👢'],['Cowboy Hat','🤠'],['Longhorn','🐂'],['Acoustic Guitar','🎸'],['Yellow Rose','🌹'],['Oil Derrick','🛢️']],
    vegas: [['Poker Chip','🔴'],['Playing Card Ace','🂡'],['Lucky 7','7️⃣'],['Roulette Wheel','🎯'],['Dice','🎲'],['Neon Sign','🌟']],
    fastFood: [['Hamburger','🍔'],['French Fries','🍟'],['Milkshake','🥤'],['Spatula','♨️'],['Ketchup Bottle','🧴'],['Chef Hat','👨‍🍳']],
    mexican: [['Taco','🌮'],['Avocado','🥑'],['Maraca','🪇'],['Sombrero','👒'],['Sizzling Skillet','🍳'],['Hot Pepper','🌶️']],
    desserts: [['Cone','🍦'],['Cookie','🍪'],['Cupcake','🧁'],['Lollipop','🍭'],['Chocolate Bar','🍫'],['Candy Cane','🍬']],
    nfb: [['White Cane','🦯'],['Braille Slate','⠿'],['Tactile Globe','🌐'],['Guide Dog','🦮'],['Bell','🔔'],['Open Book','📖']],
    cartoons: [['Mickey Ears','🐭'],['Castle','🏰'],['Magic Wand','🪄'],['Mystery Machine','🚐'],['Stone Car','🪨'],['Bubble Car','🛸']],
    hobbies: [['Steam Engine','🚂'],['Conductor Hat','🧢'],['Horseshoe','🧲'],['Riding Boot','🥾'],['Bass Fish','🐟'],['Tackle Box','🧰']],
    music: [['Microphone','🎙️'],['Acoustic Guitar','🎸'],['Vinyl Record','💿'],['Headphones','🎧'],['Piano','🎹'],['Stage Light','🔦']],
    sports: [['Trophy','🏆'],['Baseball','⚾'],['Basketball','🏀'],['Football','🏈'],['Scoreboard','🔢'],['Team Bus','🚌']],
    space: [['Rocket','🚀'],['Moon Rover','🌙'],['Satellite','🛰️'],['Astronaut Helmet','👨‍🚀'],['Planet','🪐'],['Star','⭐']],
    games: [['Game Pawn','♟️'],['Playing Card','🃏'],['Joystick','🕹️'],['Pixel Alien','👾'],['Puzzle Piece','🧩'],['Golden Die','🎲']],
    travel: [['Compass','🧭'],['Camera','📷'],['Backpack','🎒'],['Tour Bus','🚌'],['Mountain','⛰️'],['Park Badge','🏅']],
    classic: [['Top Hat','🎩'],['Race Car','🏎️'],['Scottie Dog','🐕'],['Battleship','🚢'],['Thimble','🪡'],['Work Boot','🥾']],
    christmasCarol: [["Tiny Tim's Crutch",'🩼'],["Marley's Chain",'⛓️'],['Prize Turkey','🦃'],['Candle Snuffer','🕯️'],['Door Knocker','🚪'],["Scrooge's Nightcap",'🎩']],
    aircraft: [['Jet Engine','✈️'],['Pilot Wings','🪽'],['Control Tower','🗼'],['Suitcase','🧳'],['Boarding Pass','🎫'],['Propeller','⚙️']],
    alaskaUsaopoly: [['Silver Salmon','🐟'],['Moose','🫎'],['Dog Sled','🛷'],['Float Plane','🛩️'],['Cruise Ship','🛳️'],['Bald Eagle','🦅']],
    halloween: [['Candy Corn','🍬'],['Bat','🦇'],['Black Cat','🐈‍⬛'],['Pumpkin','🎃'],['Skeleton','💀'],['Witch','🧙‍♀️']],
    atlanta: [['Georgia Peach','🍑'],['Griffin','🦅'],['MARTA Train','🚇'],['Airplane','✈️'],['Coca-Cola Bottle','🥤'],['Atlanta Skyline','🏙️']],
    baseballBoard: [['Baseball','⚾'],['Baseball Bat','🏏'],['Fielding Glove','🧤'],["Catcher's Mask",'🥅'],['Championship Pennant','🚩'],['Ballpark Hot Dog','🌭']],
    beatles: [['Yellow Submarine','🚤'],['Acoustic Guitar','🎸'],['Drum Kit','🥁'],['Round Glasses','👓'],['Vinyl Record','💿'],['Green Apple','🍏']],
    bedrock: [['Stone-Wheel Car','🛞'],['Dinosaur','🦕'],['Bowling Ball','🎳'],['Stone Club','🪨'],['Brontosaurus Rib','🍖'],['Slate Tablet','🗿']],
    boston: [['Lobster','🦞'],['Tea Crate','🫖'],['Swan Boat','🦢'],['Baseball Cap','🧢'],['Freedom Trail Brick','🧱'],['Make Way for Duckling','🦆']],
    candyLand: [['Gingerbread Man','🍪'],['Gingerbread Woman','🍪'],['Candy Cane','🍬'],['Gumdrop','🔴'],['Lollipop','🍭'],['Ice Cream Cone','🍦']],
    chicago: [['Cloud Gate','🫘'],['Deep-Dish Pizza','🍕'],['L Train','🚇'],['Chicago Hot Dog','🌭'],['Chicago Skyline','🏙️'],['Chicago Bull','🐂']],
    chicagoHilton: [['Hotel Key','🔑'],['Bellhop Cart','🛒'],['Suitcase','🧳'],['Hotel Pillow','🛏️'],['Chicago Skyline','🏙️'],['Service Bell','🛎️']],
    unitedStates: [['Bald Eagle','🦅'],['American Flag','🇺🇸'],['Statue of Liberty','🗽'],['U.S. Capitol','🏛️'],['United States Map','🗺️'],['American Bison','🦬']],
    tv2: [['Game Show Buzzer','🔴'],['Playing Cards','🃏'],['Question Mark','❓'],['Prize Wheel','🎡'],['Superhero Cape','🦸'],['Family Television','📺']],
    tv1: [['Television Set','📺'],['Remote Control','🎛️'],['TV Antenna','📡'],["Director's Chair",'🪑'],['Studio Camera','📹'],['Clapperboard','🎬']],
    tacoBell: [['Chihuahua','🐕'],['Spork','🍴'],['Sauce Packet','🌶️'],['Cash Register','💵'],['Soda Fountain','🥤'],['Drink Cup','🥛']],
    supermarket: [['Shopping Cart','🛒'],['Grocery Basket','🧺'],['Milk Carton','🥛'],['Bread Loaf','🍞'],['Red Apple','🍎'],['Steak','🥩']],
    sesameStreet: [['Abby Cadabby','🧚'],['Big Bird','🐥'],['Cookie Monster','🍪'],['Count von Count','🧛'],['Oscar','🗑️'],['Super Grover','🦸']],
    sanFranciscoBoard: [['Cable Car','🚋'],['Golden Gate Bridge','🌉'],['Pier 39 Sea Lion','🦭'],['Sourdough Bread','🍞'],['San Francisco Fog','🌫️'],['Coit Tower','🗼']],
    sanDiegoBoard: [['Surfboard','🏄'],['Red Trolley','🚋'],['Zoo Panda','🐼'],['Navy Ship','🚢'],['California Sun','☀️'],['Baseball','⚾']],
    philadelphia: [['Liberty Bell','🔔'],['Cheesesteak','🥪'],['Soft Pretzel','🥨'],['Philadelphia Rowhouse','🏠'],['Museum Steps','🪜'],['SEPTA Train','🚆']],
    ohioBoard: [['Buckeye','🌰'],['Northern Cardinal','🐦'],['Football','🏈'],['Rock Guitar','🎸'],['Roller Coaster','🎢'],['Lake Erie Lighthouse','🗼']],
    northPole: [['Candy Cane','🍬'],['Polar Bear','🐻‍❄️'],['Santa Sleigh','🛷'],['Reindeer','🦌'],['Toymaker Elf','🧝'],['Santa Hat','🎅']],
    nflBoard: [['Football','🏈'],['Football Helmet','🪖'],['Goalpost','🥅'],['Championship Trophy','🏆'],['Referee Whistle','📣'],['Football Cleat','👟']],
    newYorkCityBoard: [['Yellow Taxi','🚕'],['Statue of Liberty','🗽'],['Big Apple','🍎'],['Subway Train','🚇'],['Empire State Building','🏙️'],['New York Pizza','🍕']],
    looneyTunes: [['Carrot','🥕'],['ACME Anvil','⚒️'],['Rocket','🚀'],['Dynamite','🧨'],['Road Runner Feather','🪶'],['ACME Crate','📦']],
    kansasState: [['Sunflower','🌻'],['Wheat Sheaf','🌾'],['American Bison','🦬'],['Covered Wagon','🛞'],['Kansas State Outline','🗺️'],['Small Airplane','🛩️']],
    kansasCity: [['City Fountain','⛲'],['Barbecue Grill','🍖'],['Shuttlecock','🏸'],['Jazz Saxophone','🎷'],['Railroad Train','🚂'],['Kansas City Skyline','🏙️']],
    indianapolis: [['Indy Race Car','🏎️'],['Checkered Flag','🏁'],['Soldiers and Sailors Monument','🗽'],['Basketball','🏀'],['Passenger Train','🚆'],['Museum Dinosaur','🦕']],
    houston: [['Space Rocket','🚀'],['Cowboy Hat','🤠'],['Oil Derrick','🛢️'],['Astronaut Helmet','👨‍🚀'],['Rodeo Boot','👢'],['Houston Skyline','🏙️']],
    hollywood: [['Film Reel','🎞️'],['Clapperboard','🎬'],['Hollywood Star','⭐'],['Movie Camera','📹'],['Award Statue','🏆'],['Limousine','🚘']],
    halloweenGoodies: [['Gravestone','🪦'],['Gummy Worm','🪱'],['Happy Halloween Goody Bag','🛍️'],['Mallow-Cream Pumpkin','🎃'],['Monster','👹'],['Skull','💀']],
    halloweenGoodies2: [['Bat','🦇'],['Black Cat','🐈‍⬛'],['Ghost','👻'],['Skeleton','💀'],['Spider','🕷️'],['Witch','🧙‍♀️']],
    hallmarkPopCulture: [['Ballerina Barbie','🩰'],['Batmobile','🏎️'],['Bugs Bunny','🐰'],['G.I. Joe Soldier','🪖'],['Mr. Potato Head','🥔'],['Scooby-Doo','🐕']],
    hallmarkDisney: [['Castle','🏰'],['Cocoa Mug','☕'],['Fairy','🧚'],['Nutcracker','🎖️'],['Snowflake','❄️'],['Christmas Train','🚂']],
    hallmarkModernChristmas: [['Charlie Brown','👦'],["Charlie Brown's Christmas Tree",'🎄'],['Dancing Nutcracker','🕺'],['Ebenezer Scrooge','🎩'],['Grinchy Claus','🎅'],['Sugarplum Fairy','🧚']],
    hallmarkChristmas: [['Bell Wreath','🔔'],['Christmas Angel','😇'],['Christmas Star','⭐'],['Drummer Boy','🥁'],['Jolly Snowman','⛄'],['Tin Soldier','🪖']],
    greatComedians: [['Microphone','🎤'],['Laughing Face','😂'],['Spotlight','🔦'],['Comedy Stage','🎭'],['Joke Book','📖'],['Comedy Mask','🎭']],
    forbiddenCities: [['California Road Sign','🛣️'],['Passenger Train','🚆'],['Palm Tree','🌴'],['Golden Gate Bridge','🌉'],['Map Pin','📍'],['Water Tower','🗼']],
    flintstonesBoard: [['Stone Car','🛞'],['Dinosaur','🦕'],['Bowling Ball','🎳'],['Water Buffalo Hat','🎩'],['Stone Club','🪨'],['Brontosaurus Rib','🍖']],
    etBoard: [['Flying Bicycle','🚲'],['Spaceship','🛸'],["Reese's Pieces",'🍬'],['Communicator','📡'],['Geranium','🌺'],['Red Hoodie','🧥']],
    downOnFarm: [['Gold Nugget','🪙'],['Branding Iron','🔥'],['Pickup Truck','🛻'],['Horseshoe','🧲'],['Cowboy Hat','🤠'],['Boots and Spurs','👢']],
    boondocks: [['Buck','💵'],['Cabin','🛖'],['Mansion','🏠'],['Coal Cart','🛒'],['Tobacco Leaf','🍂'],['Farm Tractor','🚜']],
    disneyBoard: [['Magic Wand','🪄'],['Glass Slipper','👠'],['Magic Lamp','🪔'],['Flying Carpet','🧞'],['Storybook','📖'],['Castle','🏰']],
    disneyParks: [['Castle','🏰'],['Mouse Ears','🐭'],['Monorail','🚝'],['Pirate Ship','🏴‍☠️'],['Haunted Mansion','👻'],['Space Rocket','🚀']],
    dallasHilton: [['Hotel Key','🔑'],['Bellhop Cart','🛒'],['Suitcase','🧳'],['Hotel Pillow','🛏️'],['Dallas Skyline','🏙️'],['Service Bell','🛎️']],
    dallas: [['Reunion Tower','🏙️'],['Cowboy Hat','🤠'],['Longhorn','🐂'],['Southwest Airplane','✈️'],['Cowboy Boot','👢'],['Lone Star','⭐']],
    countryMusicBoard: [['Cowboy Hat','🤠'],['Acoustic Guitar','🎸'],['Silver Eagle','🦅'],['Country Train','🚂'],['Radio Microphone','🎙️'],['Western Boot','👢']],
    country80s: [['Cassette','📼'],['Cowboy Hat','🤠'],['Honky-Tonk Guitar','🎸'],['Tour Bus','🚌'],['Vinyl Record','💿'],['Rodeo Star','⭐']],
    country90s: [['Compact Disc','💿'],['Music Video Camera','📹'],['Cowboy Boot','👢'],['Acoustic Guitar','🎸'],['Tour Bus','🚌'],['Backstage Pass','🎫']],
    country2000s: [['MP3 Player','🎵'],['Pickup Truck','🛻'],['Country Guitar','🎸'],['Festival Ticket','🎫'],['Cowboy Hat','🤠'],['Award Trophy','🏆']],
    countryModern: [['Smartphone','📱'],['Streaming Headphones','🎧'],['Festival Wristband','🎟️'],['Acoustic Guitar','🎸'],['Tour Van','🚐'],['Neon Cowboy Hat','🤠']],
    computer: [['Laptop','💻'],['Keyboard','⌨️'],['Mouse','🖱️'],['Joystick','🕹️'],['Compact Disc','💿'],['Microchip','🔲']],
    cleveland: [['Rock Hall Guitar','🎸'],['Terminal Tower','🏙️'],['Lake Erie Ship','🚢'],['Rapid Train','🚇'],['Football Helmet','🏈'],['Pierogi','🥟']],
    classicRock: [['Electric Guitar','🎸'],['Drum Kit','🥁'],['Vinyl Record','💿'],['Tour Bus','🚌'],['Amplifier','🔊'],['Backstage Pass','🎫']],
    popMusic: [['Microphone','🎙️'],['Pop Star','⭐'],['Headphones','🎧'],['Disco Ball','🪩'],['Stage Light','🔦'],['Gold Record','🏅']],
    hipHop: [['Turntable','💿'],['Boom Box','📻'],['Gold Chain','🔗'],['Microphone','🎤'],['High-Top Sneaker','👟'],['Spray Can','🎨']],
    oldSchoolRB: [['Vinyl Record','💿'],['Vintage Microphone','🎙️'],['Saxophone','🎷'],['Piano','🎹'],['Heart','❤️'],['Stage Light','🔦']],
    countryLegends: [['Cowboy Hat','🤠'],['Cowboy Boot','👢'],['Acoustic Guitar','🎸'],['Banjo','🪕'],['Horseshoe','🧲'],['Pickup Truck','🛻']],
    dance80s: [['Disco Ball','🪩'],['Cassette','📼'],['Leg Warmers','🧦'],['Boom Box','📻'],['Neon Star','🌟'],['Roller Skate','🛼']],
    oldiesBoard: [['Jukebox','🎶'],['45 RPM Record','💿'],['Classic Car','🚘'],['Soda Glass','🥤'],['Vintage Microphone','🎙️'],['Dance Shoes','👞']],
    music90s: [['Compact Disc','💿'],['Pager','📟'],['Cassette','📼'],['Game Controller','🎮'],['Rollerblades','🛼'],['Flip Phone','📱']],
    christmasGoodies: [['Angel','😇'],['Bell','🔔'],['Candy Cane','🍬'],['Ceramic Mug','☕'],['Gingerbread Man','🍪'],['Snowman','⛄']],
    christmas: [['Christmas Tree','🎄'],['Poinsettia','🌺'],['Present','🎁'],['Angel','😇'],['Sleigh Bell','🔔'],['Midnight Star','⭐']]
  });

  function tokenCategoryFor(edition) {
    if (/A Christmas Carol/i.test(edition)) return 'christmasCarol';
    if (/Aircraft/i.test(edition)) return 'aircraft';
    if (/Alaska Edition Monopoly \(1996\) \(USAopoly\)/i.test(edition)) return 'alaskaUsaopoly';
    if (/Aspects of Halloween/i.test(edition)) return 'halloween';
    if (/^Atlanta$/i.test(edition)) return 'atlanta';
    if (/^Baseball$/i.test(edition)) return 'baseballBoard';
    if (/^The Beatles$/i.test(edition)) return 'beatles';
    if (/^Bedrock$/i.test(edition)) return 'bedrock';
    if (/^Boston$/i.test(edition)) return 'boston';
    if (/^Candy Land$/i.test(edition)) return 'candyLand';
    if (/^Chicago$/i.test(edition)) return 'chicago';
    if (/^Chicago Hilton Properties$/i.test(edition)) return 'chicagoHilton';
    if (/^Christmas Goodies$/i.test(edition)) return 'christmasGoodies';
    if (/^Christmas$/i.test(edition)) return 'christmas';
    if (/^Cleveland$/i.test(edition)) return 'cleveland';
    if (/^Computer$/i.test(edition)) return 'computer';
    if (/^Country Music$/i.test(edition)) return 'countryMusicBoard';
    if (/^Dallas$/i.test(edition)) return 'dallas';
    if (/^Dallas Area Hilton Properties$/i.test(edition)) return 'dallasHilton';
    if (/^Disney Parks$/i.test(edition)) return 'disneyParks';
    if (/^Disney$/i.test(edition)) return 'disneyBoard';
    if (/^Down in the Boondocks$/i.test(edition)) return 'boondocks';
    if (/^Down on the Farm$/i.test(edition)) return 'downOnFarm';
    if (/^E\.T\.$/i.test(edition)) return 'etBoard';
    if (/^Flintstones$/i.test(edition)) return 'flintstonesBoard';
    if (/^Forbidden Cities$/i.test(edition)) return 'forbiddenCities';
    if (/^Great Comedians$/i.test(edition)) return 'greatComedians';
    if (/^Hallmark 70s and 80s$/i.test(edition)) return 'hallmarkChristmas';
    if (/^Hallmark 90s and 2000s$/i.test(edition)) return 'hallmarkModernChristmas';
    if (/^Hallmark Disney Ornaments$/i.test(edition)) return 'hallmarkDisney';
    if (/^Hallmark Pop Culture$/i.test(edition)) return 'hallmarkPopCulture';
    if (/^Halloween Goodies 2$/i.test(edition)) return 'halloweenGoodies2';
    if (/^Halloween Goodies$/i.test(edition)) return 'halloweenGoodies';
    if (/^Hollywood$/i.test(edition)) return 'hollywood';
    if (/^Houston$/i.test(edition)) return 'houston';
    if (/^Indianapolis$/i.test(edition)) return 'indianapolis';
    if (/^Kansas City$/i.test(edition)) return 'kansasCity';
    if (/^Kansas State$/i.test(edition)) return 'kansasState';
    if (/^Looney Tunes$/i.test(edition)) return 'looneyTunes';
    if (/^New York City$/i.test(edition)) return 'newYorkCityBoard';
    if (/^NFL$/i.test(edition)) return 'nflBoard';
    if (/^North Pole$/i.test(edition)) return 'northPole';
    if (/^Ohio$/i.test(edition)) return 'ohioBoard';
    if (/^Philadelphia$/i.test(edition)) return 'philadelphia';
    if (/^San Diego$/i.test(edition)) return 'sanDiegoBoard';
    if (/^San Francisco$/i.test(edition)) return 'sanFranciscoBoard';
    if (/^Sesame Street$/i.test(edition)) return 'sesameStreet';
    if (/^Supermarket$/i.test(edition)) return 'supermarket';
    if (/^Taco Bell$/i.test(edition)) return 'tacoBell';
    if (/^TV 1$/i.test(edition)) return 'tv1';
    if (/^TV 2$/i.test(edition)) return 'tv2';
    if (/^United States$/i.test(edition)) return 'unitedStates';
    if (/^80s Country Music$/i.test(edition)) return 'country80s';
    if (/^90s Country Music$/i.test(edition)) return 'country90s';
    if (/^2000s Country Music$/i.test(edition)) return 'country2000s';
    if (/^Modern Country Music$/i.test(edition)) return 'countryModern';
    if (/^Classic Rock$/i.test(edition)) return 'classicRock';
    if (/^Pop Music$/i.test(edition)) return 'popMusic';
    if (/^Hip Hop$/i.test(edition)) return 'hipHop';
    if (/^Old School R&B$/i.test(edition)) return 'oldSchoolRB';
    if (/^Country Legends$/i.test(edition)) return 'countryLegends';
    if (/^80s Dance$/i.test(edition)) return 'dance80s';
    if (/^Oldies$/i.test(edition)) return 'oldiesBoard';
    if (/^90s Music$/i.test(edition)) return 'music90s';
    if (/(California|Los Angeles|San Francisco|San Diego|Bakersfield)/i.test(edition)) return 'california';
    if (/(Texas|Austin|Dallas|Tyler)/i.test(edition)) return 'texas';
    if (/(Vegas|Casino)/i.test(edition)) return 'vegas';
    if (/(Fast Food|Burger|Restaurant)/i.test(edition)) return 'fastFood';
    if (/Mexican/i.test(edition)) return 'mexican';
    if (/(Dessert|Candy|Hershey|Chocolate|Ice Cream|Cookie|Cake)/i.test(edition)) return 'desserts';
    if (/National Federation of the Blind/i.test(edition)) return 'nfb';
    if (/(Disney|Cartoon|Mickey|Beauty and the Beast|Aladdin|Scooby|Flintstones|Jetsons|Looney|SpongeBob)/i.test(edition)) return 'cartoons';
    if (/(Train Station|Horse Stable|Bass Fishing)/i.test(edition)) return 'hobbies';
    if (/(Music|Pop|Rock|Broadcaster)/i.test(edition)) return 'music';
    if (/(NFL|Baseball|Basketball|Sports)/i.test(edition)) return 'sports';
    if (/(Space|Future)/i.test(edition)) return 'space';
    if (/(Game|Atari|Nintendo|Pac-Man|Lego)/i.test(edition)) return 'games';
    if (/(Parks|Tour|Harley|Cars and Trucks)/i.test(edition)) return 'travel';
    return 'classic';
  }

  const tokens = Object.fromEntries(editions.map(edition => {
    const category = tokenCategoryFor(edition);
    return [edition, Object.freeze(tokenCategories[category].map(([name, icon], index) => Object.freeze({ id: `${category}-${index + 1}`, name, icon })))];
  }));
  function ownsGroup(board, owners, playerId, group) {
    const members = board.filter(space => space.group === group);
    return members.length > 0 && members.every(space => owners[space.index] === playerId);
  }
  function ownershipProgress(board, owners, playerId) {
    const owned = board.filter(space => space.price && owners[space.index] === playerId);
    const groupOrder = [...new Set(board.filter(space => space.price && space.group).map(space => space.group))];
    return groupOrder.map(group => {
      const members = board.filter(space => space.price && space.group === group);
      const properties = owned.filter(space => space.group === group);
      return {
        group,
        owned: properties.length,
        total: members.length,
        needed: members.length - properties.length,
        complete: properties.length === members.length,
        properties: properties.map(space => space.name)
      };
    }).filter(progress => progress.owned > 0);
  }
  function rentFor(board, owners, space, ownerId) {
    if (!space.rent) return 0;
    if (space.group === 'transit') return 25 * (2 ** Math.max(0, board.filter(item => item.group === 'transit' && owners[item.index] === ownerId).length - 1));
    if (space.group === 'utility') return 20 * board.filter(item => item.group === 'utility' && owners[item.index] === ownerId).length;
    return space.rent * (ownsGroup(board, owners, ownerId, space.group) ? 2 : 1);
  }
  const audioProfiles = Object.fromEntries(editions.map(edition => [edition, / State Edition$/.test(edition) ? 'state' : (themeData[edition].audioProfile || (edition === 'Electronic Banking' ? 'electronic' : 'standard'))]));
  const currencies = Object.fromEntries(editions.map(edition => {
    const currency = / State Edition$/.test(edition) ? 'cash' : themeData[edition].currency;
    return [edition, typeof currency === 'object' ? currency : { singular: 'dollar', plural: 'dollars', symbol: '$' }];
  }));
  function formatMoney(edition, amount) {
    const currency = currencies[edition] || currencies.Classic;
    return currency.symbol ? `${currency.symbol}${amount}` : `${amount} ${Number(amount) === 1 ? currency.singular : currency.plural}`;
  }
  return Object.freeze({ editions, boards, tokens, tokenCategories, audioProfiles, currencies, stateData, generateStateBoard, formatMoney, createBoard, ownsGroup, ownershipProgress, rentFor });
});
