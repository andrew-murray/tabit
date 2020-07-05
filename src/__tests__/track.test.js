import track from '../track'
import fs from "fs"

test('unit test trackFromPositions', () => {
	const positions = [
		48,
		48 * 2,
		48 * 5
	];
	const size = 48 * 6;
	const exampleTrack = track.trackFromPositions( positions, size );
	
	expect(exampleTrack.resolution).toBe(48);
	expect(exampleTrack.length()).toBe(size);
	expect(exampleTrack.rep).toStrictEqual([0,1,1,0,0,1]);

	expect(() => track.trackFromPositions( positions, 0 )).toThrow('size');
	expect(() => track.trackFromPositions( positions, -5 )).toThrow('size');
	expect(() => track.trackFromPositions( positions, 20 )).toThrow('size');
	expect(() => track.trackFromPositions( positions, 48 * 5 )).toThrow('size');
});

