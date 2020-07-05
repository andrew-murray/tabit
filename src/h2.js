// h2.js

import track from "./track"
import xml2js from "xml2js";

// let's think about the data representation needed

function calculatePatternResolution(pattern)
{
	// hydrogen treats 48 as a beat
	const basesToTry = [
		48, // beat
		24, // 1/2 beat
		16, // 1/3 beat
		12, // 1/4
		8, // 1/6 
		6, // 1/8
		4, // 1/12
		3, // 1/16
		2, // 1/24
		1 // 1/48
	];

	for( const b of basesToTry )
	{
		let allNotesPass = true;
		for( const note of pattern.notes )
		{
			if( (note.position % b) != 0 )
			{
				allNotesPass = false;
				break;
			}
		}
		if(allNotesPass)
		{
			return b;
		}
	}
	throw new Exception("Failed to predict base");
}

function parseHydrogenJs(result)
{
  	// fixme:
  	// this parsing often assumes there's >=2 elements

  	// this "zero" here is presumably an artefact of xml --> json representation
  	const instrumentElements = result.song.instrumentList[0].instrument;

  	// instruments
  	// [  { id, name } ]
  	const instrumentArray = Array.from(
  		instrumentElements,
  		function(element){
  			return {"id" : parseInt(element.id), "name" : element.name };
  		}
  	);

  	const patternElements = result.song.patternList[0].pattern;

  	// patterns
  	// [  { name, size, notes } ]
  	const patternArray = Array.from(
  		patternElements,
  		function(element){
  			const noteElements = element.noteList[0].note;
  			let notes = [];
  			if( noteElements )
  			{
  				// notes 
  				// [ {position, instrument(id}]
	  			notes = Array.from(
	  				noteElements,
	  				function(noteElement){
	  					return {"position" : parseInt(noteElement.position), "instrument" : parseInt(noteElement.instrument)};
	  				}
	  			);
  			}
  			return {
  				"size" : parseInt(element.size), 
  				"name" : element.name,
  				"notes" : notes
  			};
  		}
  	);

  	// transform pattern to a managable data
  	const patternsWithTracks = Array.from(
  		patternArray,
  		function(pattern)
  		{	
  			const resolution = calculatePatternResolution(pattern);
  			let instrumentNotes = { };
  			for( const instrument of instrumentArray )
  			{
	  			const relevantNotes = pattern.notes.filter( 
	  				note => (note.instrument == instrument.id)
	  			);
	  			const relevantHits = Array.from(
	  				relevantNotes,
	  				note => note.position
	  			);
	  			instrumentNotes[ instrument.id.toString() ] = relevantHits;
  			}
  			pattern.resolution = resolution;
  			pattern.instrumentNotes = instrumentNotes;
  			return pattern;
  		}
  	);

  	return {
  		"instruments" : instrumentArray,
  		"patterns" : patternsWithTracks
  	}
}

async function parseHydrogenPromise(xmlString)
{
  let parser = new xml2js.Parser();

  return parser.parseStringPromise(xmlString).then(parseHydrogenJs);
}

module.exports.parseHydrogenPromise = parseHydrogenPromise;