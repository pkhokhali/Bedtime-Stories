const fs = require('fs');

const content = fs.readFileSync('data/catalog.ts', 'utf8');

// We just need to find the export const stories: Story[] = [ array and extract the JSON.
// Using a simple ast/eval trick to parse it.

let startIndex = content.indexOf('export const stories: Story[] = [');
let storiesText = content.substring(startIndex + 'export const stories: Story[] = '.length);

// we have imports like moonRabbitBeats, etc. Let's just create variables for them so eval works.
const variables = [
  'bhaktapurBeats', 'bridgeLightBeats', 'cleverRabbitBeats', 'doveNetBeats',
  'drumHillsBeats', 'fireflyBeats', 'happyPrinceBeats', 'koshiBeats',
  'lastLampThamelBeats', 'lettersRiverBeats', 'moonRabbitBeats', 'mountainSchoolBeats',
  'nightBusBeats', 'northWindBeats', 'oldManKoshiBeats', 'selfishGiantBeats',
  'sleepyYakBeats', 'starBlanketBeats', 'teaShopLampBeats', 'yetiQuietBeats'
];

let evalContext = '';
variables.forEach(v => {
  evalContext += const  = [];\n;
});

evalContext += const require = (path) => path;\n;
evalContext += const stories =  + storiesText.substring(0, storiesText.indexOf('];\n') + 1) + ;\n;

evalContext += 
const finalStories = stories.map(s => {
  const { beats, mediaAssets, ...rest } = s;
  return { ...rest, isHidden: false };
});
console.log(JSON.stringify({ version: 1, stories: finalStories }));
;

const output = eval(evalContext);

