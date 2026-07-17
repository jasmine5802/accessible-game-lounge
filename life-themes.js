'use strict';

(function exposeLifeThemes(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LifeThemes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const route = [
    ['Start', 'start', [1]], ['Choose Your Beginning', 'fork', [2, 5]],
    ['College Orientation', 'event', [3]], ['Graduation Day', 'career', [4]], ['First Career Payday', 'payday', [8]],
    ['Career Training', 'career', [6]], ['Entry-Level Payday', 'payday', [7]], ['Professional Breakthrough', 'event', [8]],
    ['First Home Search', 'house', [9]], ['Family or Adventure', 'fork', [10, 14]],
    ['Family Celebration', 'passenger', [11]], ['Community Milestone', 'event', [12]], ['Family Payday', 'payday', [13]], ['Growing Household', 'passenger', [18]],
    ['Risky Road', 'investment', [15]], ['Big Opportunity', 'event', [16]], ['Adventure Property', 'house', [17]], ['High-Risk Payday', 'payday', [18]],
    ['Midlife Crossroads', 'fork', [19, 23]], ['Steady Career', 'career', [20]], ['Reliable Payday', 'payday', [21]], ['Neighborhood Upgrade', 'house', [22]], ['Long-Service Award', 'event', [27]],
    ['Bold Reinvention', 'career', [24]], ['Private Investment', 'investment', [25]], ['Major Payday', 'payday', [26]], ['Dream Property', 'house', [27]],
    ['Legacy Celebration', 'event', [28]], ['Final Payday', 'payday', [29]], ['Retirement Choice', 'fork', [30, 32]],
    ['Peaceful Retirement', 'retire', [31]], ['Retirement Finish', 'finish', []],
    ['Risky Retirement', 'investment', [33]], ['Grand Retirement Finish', 'finish', []]
  ];

  const definitions = {
    'Classic 1960': {
      currency: { symbol: '$', singular: 'dollar', plural: 'dollars' }, salary: 70000, profile: 'classic',
      careers: ['Accountant','Doctor','Teacher','Airline Pilot','Sales Executive'],
      properties: ['Ranch House','Split-Level Home','Lake Cottage','Country Estate'],
      milestones: ['Paper Pay Envelope','Family Station Wagon','Television Set','Country Club Membership'],
      cards: ['Stock Certificate','Savings Bond','Insurance Policy','Lucky Number Ticket'], retirement: 'Day of Reckoning'
    },
    'Modern Electronic': {
      currency: { symbol: '¤', singular: 'digital credit', plural: 'digital credits' }, salary: 95000, profile: 'electronic',
      careers: ['App Developer','UX Designer','Cloud Architect','Robotics Engineer','Content Strategist'],
      properties: ['Smart Apartment','Connected Townhouse','Solar Home','Automated Penthouse'],
      milestones: ['Launch an App','Upgrade Your Phone','Join a Startup','Deploy an AI Assistant'],
      cards: ['Index Fund','Crypto Wallet','Startup Option','Green Bond'], retirement: 'Digital Freedom Campus'
    },
    'Super Mario': {
      currency: { symbol: '★', singular: 'Star', plural: 'Stars' }, salary: 80, profile: 'mario',
      careers: ['Toad Guide','Kart Mechanic','Mushroom Doctor','Castle Architect','Royal Plumber'],
      properties: ['Toad House','Yoshi Cottage','Luigi Mansion','Peach Castle'],
      milestones: ['Find a Power-Up','Cross Rainbow Road','Rescue a Yoshi','Win a Kart Cup'],
      cards: ['Super Star','Golden Mushroom','Fire Flower','Lucky Block'], retirement: 'Star Road Celebration'
    },
    "Broadcaster's Playground": {
      currency: { symbol: '$', singular: 'production dollar', plural: 'production dollars' }, salary: 65000, profile: 'broadcast',
      careers: ['Production Intern','Board Operator','On-Air Host','Program Director','Station Owner'],
      properties: ['Editing Suite','Voice Booth','Remote Truck','Broadcast Station'],
      milestones: ['Book a Voiceover Deal','Produce a Live Remote','Win a Ratings Sweep','Launch a Network Show'],
      cards: ['Private Demo Reel','Syndication Contract','Voiceover Royalty','Station Equity'], retirement: 'Broadcast Hall of Fame'
    },
    'Space Colonization': {
      currency: { symbol: '◎', singular: 'lunar credit', plural: 'lunar credits' }, salary: 120000, profile: 'space',
      careers: ['Habitat Technician','Lunar Geologist','Shuttle Commander','Terraforming Engineer','Colony Governor'],
      properties: ['Moon Pod','Lunar Habitat','Mars Dome','Titan Colony'],
      milestones: ['Reach Lunar Orbit','Harvest Asteroid Ice','Land on Mars','Open a Planetary Gateway'],
      cards: ['Helium-3 Claim','Asteroid Share','Fusion Patent','Colony Charter'], retirement: 'Interplanetary Legacy Station'
    },
    'Retro Pop Culture': {
      currency: { symbol: '♫', singular: 'retro credit', plural: 'retro credits' }, salary: 55000, profile: 'retro',
      careers: ['Video Store Clerk','Radio DJ','Magazine Editor','Game Designer','Record Label Executive'],
      properties: ['Basement Arcade','CD Shop Loft','Mall Townhouse','Pop Star Mansion'],
      milestones: ['Buy a Cassette Deck','Upgrade to a CD-ROM','Connect by Dial-Up','Launch a Fan Website'],
      cards: ['Rare Cassette','Limited CD Box Set','Vintage Console','First-Edition Magazine'], retirement: 'Pop Culture Hall of Fame'
    }
  };

  function createBoard(themeName) {
    const theme = definitions[themeName];
    if (!theme) throw new Error(`Unknown Life theme: ${themeName}`);
    let propertyIndex = 0; let milestoneIndex = 0;
    return route.map(([baseName, type, next], index) => {
      let name = baseName;
      if (type === 'house') name = theme.properties[propertyIndex++ % theme.properties.length];
      if (type === 'event') name = theme.milestones[milestoneIndex++ % theme.milestones.length];
      if (type === 'retire') name = theme.retirement;
      const description = type === 'fork' ? `${name}. Choose a path with Left or Right Arrow, then press Enter.` :
        type === 'payday' ? `${name}. Collect your current salary.` :
        type === 'career' ? `${name}. Begin or advance your themed career.` :
        type === 'house' ? `${name}. Add this property to your assets.` :
        type === 'passenger' ? `${name}. Add one passenger peg to your car.` :
        type === 'investment' ? `${name}. Receive a private financial card.` :
        type === 'finish' ? `${name}. Your life journey is complete.` : `${name}. Draw a themed life event.`;
      return Object.freeze({ index, name, type, next: [...next], description });
    });
  }

  const themes = Object.keys(definitions);
  const boards = Object.fromEntries(themes.map(name => [name, createBoard(name)]));
  function formatMoney(themeName, amount) {
    const currency = definitions[themeName].currency;
    return currency.symbol ? `${currency.symbol}${amount.toLocaleString('en-US')}` : `${amount} ${amount === 1 ? currency.singular : currency.plural}`;
  }
  return Object.freeze({ themes, definitions, boards, createBoard, formatMoney });
});
