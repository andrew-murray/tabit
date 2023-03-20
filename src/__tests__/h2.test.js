// h2.test.js

import h2 from "../h2"
import fs from "fs"

const updateSerialisations = false;

test('h2 parsing - too_much_garlic', async () => {
  const testXml = fs.readFileSync("./test_data/too_much_garlic.h2song");
  const testJSON = "./test_data/too_much_garlic.json";

  const resultJSONPromise = h2.parseHydrogenPromise(testXml.toString()).then(result =>
  {
    return JSON.stringify(result, null, 4);
  });
  const resultJSON = await resultJSONPromise;
  if(updateSerialisations)
  {
    fs.writeFileSync(testJSON, resultJSON);
  }
  const expectedJSON = String(fs.readFileSync(testJSON));
  return expect(resultJSON).toEqual(expectedJSON);
});

test('h2 parsing - kuva', async () => {
  const testXml = fs.readFileSync("./test_data/kivakovakivikuva.h2song");
  const testJSON = "./test_data/kivakovakivikuva.json";

  const resultJSONPromise = h2.parseHydrogenPromise(testXml.toString()).then(result =>
  {
    return JSON.stringify(result, null, 4);
  });
  const resultJSON = await resultJSONPromise;
  if(updateSerialisations)
  {
    fs.writeFileSync(testJSON, resultJSON);
  }
  const expectedJSON = String(fs.readFileSync(testJSON));
  return expect(resultJSON).toEqual(expectedJSON);
});

test('h2 parsing - coconot', async () => {
  const testXml = fs.readFileSync("./test_data/coconot.h2song");
  const testJSON = "./test_data/coconot.json";

  const resultJSONPromise = h2.parseHydrogenPromise(testXml.toString()).then(result =>
  {
    return JSON.stringify(result, null, 4);
  });
  const resultJSON = await resultJSONPromise;
  if(updateSerialisations)
  {
    fs.writeFileSync(testJSON, resultJSON);
  }
  const expectedJSON = String(fs.readFileSync(testJSON));
  return expect(resultJSON).toEqual(expectedJSON);
});

test('h2 parsing - that_guy', async() => {
  const testXml = fs.readFileSync("./test_data/that_guy.h2song");
  const testJSON = "./test_data/that_guy.json";
  const resultJSONPromise = h2.parseHydrogenPromise(testXml.toString()).then(result =>
  {
    return JSON.stringify(result, null, 4);
  });
  const resultJSON = await resultJSONPromise;
  if(updateSerialisations)
  {
    fs.writeFileSync(testJSON, resultJSON);
  }
  const expectedJSON = String(fs.readFileSync(testJSON));
  return expect(resultJSON).toEqual(expectedJSON);
});


test('h2 parsing - cumulus', async () => {
  const testXml = fs.readFileSync("./test_data/cumulus.h2song");
  const testJSON = "./test_data/cumulus.json";
  const resultJSONPromise = h2.parseHydrogenPromise(testXml.toString()).then(result =>
  {
    return JSON.stringify(result, null, 4);
  });
  const resultJSON = await resultJSONPromise;
  if(updateSerialisations)
  {
    fs.writeFileSync(testJSON, resultJSON);
  }
  const expectedJSON = String(fs.readFileSync(testJSON));
  return expect(resultJSON).toEqual(expectedJSON);
});

// the above are mostly random regression tests,
// but this one specifically targets virtual_patterns as a feature
test('h2 parsing - virtual', async () => {
  const testXml = fs.readFileSync("./test_data/virtual_test.h2song");
  const testJSON = "./test_data/virtual_test.json";
  const resultJSONPromise = h2.parseHydrogenPromise(testXml.toString()).then(result =>
  {
    return JSON.stringify(result, null, 4);
  });
  const resultJSON = await resultJSONPromise;
  if(updateSerialisations)
  {
    fs.writeFileSync(testJSON, resultJSON);
  }
  const expectedJSON = String(fs.readFileSync(testJSON));
  return expect(resultJSON).toEqual(expectedJSON);
});

// "a single pattern" or "a single instrument" will often require special
// treatment in our parsing code, here's a test for those two cases
test('h2 parsing - single_elements', async () => {
  const testXml = fs.readFileSync("./test_data/single_elements.h2song");
  const testJSON = "./test_data/single_elements.json";
  const resultJSONPromise = h2.parseHydrogenPromise(testXml.toString()).then(result =>
  {
    return JSON.stringify(result, null, 4);
  });
  const resultJSON = await resultJSONPromise;
  if(updateSerialisations)
  {
    fs.writeFileSync(testJSON, resultJSON);
  }
  const expectedJSON = String(fs.readFileSync(testJSON));
  return expect(resultJSON).toEqual(expectedJSON);
});
