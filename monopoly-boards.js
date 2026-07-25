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

  function property(name, propertyIndex, themeName) {
    let offset = 0;
    let group = groups[0];
    for (let index = 0; index < groupSizes.length; index += 1) {
      if (propertyIndex < offset + groupSizes[index]) { group = groups[index]; break; }
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
    const nextProperty = () => property(data.properties[propertyIndex], propertyIndex++, edition);
    const nextTransit = () => transport(data.transit[transitIndex++], edition);
    const nextUtility = () => utility(data.utilities[utilityIndex++], edition);
    const chanceName = data.chanceName || 'Chance';
    const chestName = data.chestName || 'Community Chest';
    return [
      special('GO', 'Go'), nextProperty(), special(chestName, 'Community Chest'), nextProperty(), special('Income Tax', 'Tax', 200), nextTransit(), nextProperty(), special(chanceName, 'Chance'), nextProperty(), nextProperty(),
      special('Jail / Just Visiting', 'Jail'), nextProperty(), nextUtility(), nextProperty(), nextProperty(), nextTransit(), nextProperty(), special(chestName, 'Community Chest'), nextProperty(), nextProperty(),
      special('Free Parking', 'Free Parking'), nextProperty(), special(chanceName, 'Chance'), nextProperty(), nextProperty(), nextTransit(), nextProperty(), nextProperty(), nextUtility(), nextProperty(),
      special('Go to Jail', 'Go to Jail'), nextProperty(), nextProperty(), special(chestName, 'Community Chest'), nextProperty(), nextTransit(), special(chanceName, 'Chance'), nextProperty(), special('Luxury Tax', 'Tax', 100), nextProperty()
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
    classic: [['Top Hat','🎩'],['Race Car','🏎️'],['Scottie Dog','🐕'],['Battleship','🚢'],['Thimble','🪡'],['Work Boot','🥾']]
  });

  function tokenCategoryFor(edition) {
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
