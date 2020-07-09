// h2.test.js

import h2 from "../h2"
import notation from "../notation"
import fs from "fs"

test('h2 parsing', () => {
  const testXml = fs.readFileSync("./test_data/too_much_garlic.h2song");
  h2.parseHydrogenPromise(testXml.toString()).then(function(result)
  {
    expect(result).toMatchSnapshot();

    let concatString = "";
    for( const track of result.patterns )
    {
      const name = track.name;
      concatString += name + "\n\n";
      for( const [instrumentID, instrumentObj] of Object.entries(result.instruments) )
      {
        const instrument = { [instrumentID.toString()]: "X" };
        const notationString = notation.fromInstrumentAndTrack(
          instrument,
          track.instrumentTracks
          // default config
        );
        concatString += instrumentObj.name + "\n\n";
        concatString += notationString + "\n\n";
      }
    }
    expect(concatString).toMatchSnapshot();
  });
});