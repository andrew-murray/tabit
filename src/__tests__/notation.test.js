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

  const configExample = {
    "restMark" : "-",
    "beatMark" : "|",
    "lineMark" : "|",
    "numberRestMark" : "-",
    "beatResolution" : 4, // 48
    "showBeatMark" : true,
    "showBeatNumbers" : true,
    "lineResolution" : 4 * 8 // 48 * 8
  };

  expect( notation.createNumberMarker( configExample, 1, 4 * 20 ) ).toEqual( "1---2---3---4---5---6---7---8---" );

  expect( notation.createNumberMarker( configExample, 1, 4 * 8 ) ).toEqual( "1---2---3---4---5---6---7---8---" );
  expect( notation.createNumberMarker( configExample, 1, 4 * 7 ) ).toEqual( "1---2---3---4---5---6---7---" );
  expect( notation.createNumberMarker( configExample, 1, 4 * 3 ) ).toEqual( "1---2---3---" );

  // non integer
  expect( notation.createNumberMarker( configExample, 1, 4 * 7 + 2 ) ).toEqual( "1---2---3---4---5---6---7---8-" );

  // all the above checks, with a different patternResolution
  expect( notation.createNumberMarker( configExample, 2, 4 * 20 ) ).toEqual( "1-2-3-4-5-6-7-8-" );

  expect( notation.createNumberMarker( configExample, 2, 4 * 8 ) ).toEqual( "1-2-3-4-5-6-7-8-" );
  expect( notation.createNumberMarker( configExample, 2, 4 * 7 ) ).toEqual( "1-2-3-4-5-6-7-" );
  expect( notation.createNumberMarker( configExample, 2, 4 * 3 ) ).toEqual( "1-2-3-" );

  // non integer
  // note, this is pretty weird, perhaps 7-- would be better? So this is more of a regression test
  expect( notation.createNumberMarker( configExample, 2, 4 * 7 + 2 ) ).toEqual( "1-2-3-4-5-6-7-8"  );

});

test('unit test createNumberMarker Realistic', () => {

  const configExample = {
    "restMark" : "X",
    "beatMark" : "B",
    "numberRestMark" : "T",
    "beatResolution" : 48,
    "showBeatNumbers" : true,
    "lineResolution" : 48 * 4
  };

  expect( notation.createNumberMarker( configExample,  48 / 3, 48 * 3) ).toEqual( "1TT2TT3TT" );
  expect( notation.createNumberMarker( configExample,  48 / 3, 48 * 2) ).toEqual( "1TT2TT" );
  expect( notation.createNumberMarker( configExample,  48 / 3, (48 / 3) * 2 ) ).toEqual( "1T" );

  expect( notation.createNumberMarker( configExample,  48 / 3, 48 * 4) ).toEqual( "1TT2TT3TT4TT" );
  expect( notation.createNumberMarker( configExample,  48 / 3, 48 * 5) ).toEqual( "1TT2TT3TT4TT" );

});

test('unit test createNumberMarker Realistic', () => {

  const configExample = {
    "restMark" : "X",
    "beatMark" : "B",
    "numberRestMark" : "T",
    "beatResolution" : 48,
    "showBeatNumbers" : true,
    "lineResolution" : 48 * 4
  };

  // repeat a normal case

  expect( notation.createNumberMarker( configExample,  48 / 3, 48 * 3) ).toEqual( "1TT2TT3TT" );

  // beatResolution doesn't divide lineResolution
  configExample.lineResolution = 49;
  expect( () => notation.createNumberMarker( configExample,  48 / 3, 48 * 3) ).toThrow();

  configExample.lineResolution = -1;
  expect( () => notation.createNumberMarker( configExample,  48 / 3, 48 * 3) ).toThrow();
  configExample.lineResolution = 0;
  expect( () => notation.createNumberMarker( configExample,  48 / 3, 48 * 3) ).toThrow();
  configExample.lineResolution = 48 *4;


  // patternResolution doesn't divide beatResolution
  configExample.beatResolution = 48 / 2;
  expect( () => notation.createNumberMarker( configExample,  48 / 3, 48 * 3) ).toThrow();


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
  expect(notation.formatLineWithMarkers(configExample, exampleLine, 24)).toEqual( " O.|..|..|O.|..|..|O.|.. ");

  expect(notation.formatLineWithMarkers(configExample, exampleLine, 12)).toEqual( " O...|..O.|....|O... ");
  // lineLength / beatResolution
  // (16 * 16) / 48 = 5.3333
  expect(notation.formatLineWithMarkers(configExample, exampleLine, 16)).toEqual( " O..|...|O..|...|O..|. ");

  // change beatResolution
  configExample.beatResolution = 24;
  expect(notation.formatLineWithMarkers(configExample, exampleLine, 24)).toEqual( " O|.|.|.|.|.|O|.|.|.|.|.|O|.|.|. ");

  configExample.beatResolution = 96;
  expect(notation.formatLineWithMarkers(configExample, exampleLine, 24)).toEqual( " O...|..O.|....|O... ");
  configExample.beatResolution = 192;
  expect(notation.formatLineWithMarkers(configExample, exampleLine, 24)).toEqual( " O.....O.|....O... ");


  // FIXME: The testing of formatLineWithMarkers is not as thorough as other functions
});

test('unit test notationFromInstrumentAndTrack', () => {
  // FIXME: The testing of fromInstrumentAndTrack is not as thorough as other functions
});
