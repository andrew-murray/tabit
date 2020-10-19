import notation from '../notation'
import track from '../track'

test('unit test chunkString', () => {
  const original = "abcdefghijkl";


  // invalid cases
  expect(() => notation.chunkString(original, 0)).toThrow();
  expect(() => notation.chunkString(original, -1)).toThrow();

  // >= length
  expect(notation.chunkString(original,15)).toEqual([original]);
  // == length
  expect(notation.chunkString(original,12)).toEqual([original]);

  expect(notation.chunkString(original,10)).toEqual([
    "abcdefghij",
    "kl"
  ]);

  expect(notation.chunkString(original,6)).toEqual([
    "abcdef",
    "ghijkl"
  ]);

  expect(notation.chunkString(original,4)).toEqual([
    "abcd",
    "efgh",
    "ijkl"
  ]);

  expect(notation.chunkString(original,3)).toEqual([
    "abc",
    "def",
    "ghi",
    "jkl"
  ]);

  expect(notation.chunkString(original,1)).toEqual(
    original.split("")
  );

});

test('unit test createNumberMarker', () => {

  const restMark = "-";
  const beatRes = 4;

  expect( notation.createNumberMarker( restMark, beatRes, 1, 4 * 8 ).join("") ).toEqual( "1---2---3---4---5---6---7---8---" );
  expect( notation.createNumberMarker( restMark, beatRes, 1, 4 * 7 ).join("") ).toEqual( "1---2---3---4---5---6---7---" );
  expect( notation.createNumberMarker( restMark, beatRes, 1, 4 * 3 ).join("") ).toEqual( "1---2---3---" );

  // non integer
  expect( notation.createNumberMarker( restMark, beatRes, 1, 4 * 7 + 2 ).join("") ).toEqual( "1---2---3---4---5---6---7---8-" );

  // all the above checks, with a different patternResolution
  expect( notation.createNumberMarker( restMark, beatRes, 2, 4 * 8 ).join("") ).toEqual( "1-2-3-4-5-6-7-8-" );
  expect( notation.createNumberMarker( restMark, beatRes, 2, 4 * 7 ).join("") ).toEqual( "1-2-3-4-5-6-7-" );
  expect( notation.createNumberMarker( restMark, beatRes, 2, 4 * 3 ).join("") ).toEqual( "1-2-3-" );

  // non integer
  // note, this is pretty weird, perhaps 7-- would be better? So this is more of a regression test
  expect( notation.createNumberMarker( restMark, beatRes, 2, 4 * 7 + 2 ).join("") ).toEqual( "1-2-3-4-5-6-7-8"  );

});

test('unit test createNumberMarker Realistic', () => {

  const restMark = "T";
  const beatRes = 48;

  expect( notation.createNumberMarker( restMark, beatRes, 48 / 3, 48 * 3).join("") ).toEqual( "1TT2TT3TT" );
  expect( notation.createNumberMarker( restMark, beatRes, 48 / 3, 48 * 2).join("") ).toEqual( "1TT2TT" );
  expect( notation.createNumberMarker( restMark, beatRes, 48 / 3, (48 / 3) * 2 ).join("") ).toEqual( "1T" );

  expect( notation.createNumberMarker( restMark, beatRes, 48 / 3, 48 * 4).join("") ).toEqual( "1TT2TT3TT4TT" );

});

test('unit test createNumberMarker Realistic - 2', () => {

  const restMark = "T";
  const beatRes = 48;

  // repeat a normal case

  expect( notation.createNumberMarker( restMark, beatRes,  48 / 3, 48 * 3).join("") ).toEqual( "1TT2TT3TT" );

  expect( () => notation.createNumberMarker( restMark, beatRes, 48 / 3, -1).join("") ).toThrow();
  expect( () => notation.createNumberMarker( restMark, beatRes,  48 / 3, 0).join("") ).toThrow();

  // patternResolution doesn't divide beatResolution
  expect( () => notation.createNumberMarker( restMark, 48 / 2, 48 / 3, 48 * 3).join("") ).toThrow();

});


test('unit test formatLineWithMarkers', () => {
  const configExample = {
    "restMark" : ".",
    "beatMark" : "|",
    "lineMark" : " ",
    "numberRestMark" : "-",
    "beatResolution" : 48,
    "showBeatMark" : true,
    "showBeatNumbers" : true,
    "lineResolution" : 48 * 4
  };

  const exampleLine = "O.....O.....O...";

  // change resolution of passed in string

  // this turns out to be very nasty looking notation when you test all the options
  const asHTML = false;
  expect(notation.formatLineWithMarkers(configExample, exampleLine, 24, asHTML)).toEqual( " O.|..|..|O.|..|..|O.|.. ");

  expect(notation.formatLineWithMarkers(configExample, exampleLine, 12, asHTML)).toEqual( " O...|..O.|....|O... ");
  // lineLength / beatResolution
  // (16 * 16) / 48 = 5.3333
  expect(notation.formatLineWithMarkers(configExample, exampleLine, 16, asHTML)).toEqual( " O..|...|O..|...|O..|. ");

  // change beatResolution
  configExample.beatResolution = 24;
  expect(notation.formatLineWithMarkers(configExample, exampleLine, 24, asHTML)).toEqual( " O|.|.|.|.|.|O|.|.|.|.|.|O|.|.|. ");

  configExample.beatResolution = 96;
  expect(notation.formatLineWithMarkers(configExample, exampleLine, 24, asHTML)).toEqual( " O...|..O.|....|O... ");
  configExample.beatResolution = 192;
  expect(notation.formatLineWithMarkers(configExample, exampleLine, 24, asHTML)).toEqual( " O.....O.|....O... ");


  // FIXME: The testing of formatLineWithMarkers is not as thorough as other functions
});

test('unit test notationFromInstrumentAndTrack', () => {
  // FIXME: The testing of fromInstrumentAndTrack is not as thorough as other functions
});
