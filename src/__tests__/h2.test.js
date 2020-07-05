// h2.test.js

import h2 from "../h2"
import fs from "fs"

test('unit test h2', () => {
  expect(3).toBe(3);
  const testXml = fs.readFileSync("./test_data/too_much_garlic.h2song");
  h2.parseHydrogen(testXml.toString());
});