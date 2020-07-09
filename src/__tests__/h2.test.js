// h2.test.js

import h2 from "../h2"
import notation from "../notation"
import fs from "fs"

test('h2 parsing garlic', async () => {
  const testXml = fs.readFileSync("./test_data/too_much_garlic.h2song");
  const testJSON = "./test_data/too_much_garlic.json";
  
  const resultJSONPromise = h2.parseHydrogenPromise(testXml.toString()).then(result =>
  {
    return JSON.stringify(result, null, 4);
  });
  const resultJSON = await resultJSONPromise;
  // fs.writeFileSync(testJSON, resultJSON);
  const expectedJSON = String(fs.readFileSync(testJSON));
  return expect(resultJSON).toEqual(expectedJSON);
});

test('h2 parsing kuva', async () => {
  const testXml = fs.readFileSync("./test_data/kivakovakivikuva.h2song");
  const testJSON = "./test_data/kivakovakivikuva.json";
  
  const resultJSONPromise = h2.parseHydrogenPromise(testXml.toString()).then(result =>
  {
    return JSON.stringify(result, null, 4);
  });
  const resultJSON = await resultJSONPromise;
  // fs.writeFileSync(testJSON, resultJSON);
  const expectedJSON = String(fs.readFileSync(testJSON));
  return expect(resultJSON).toEqual(expectedJSON);
});