import Track from '../data/Track'

test('unit test fromPositions', () => {
  const positions = [
    48,
    48 * 2,
    48 * 5
  ];
  const size = 48 * 6;
  const exampleTrack = Track.fromPositions( positions, size );

  expect(exampleTrack.resolution).toBe(48);
  expect(exampleTrack.length()).toBe(size);
  expect(exampleTrack.rep).toStrictEqual([0,1,1,0,0,1]);

  expect(() => Track.fromPositions( positions, 0 )).toThrow('size');
  expect(() => Track.fromPositions( positions, -5 )).toThrow('size');
  expect(() => Track.fromPositions( positions, 20 )).toThrow('size');
  expect(() => Track.fromPositions( positions, 48 * 5 )).toThrow('size');
});

