// h2.test.js

import h2 from "../h2"
import fs from "fs"

test('h2 parsing', () => {
  const testXml = fs.readFileSync("./test_data/too_much_garlic.h2song");
  h2.parseHydrogenPromise(testXml.toString()).then(function(result)
  {
  	expect(result).toMatchSnapshot();
  });
});