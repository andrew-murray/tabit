// h2.js

import track from "./track"
import xml2js from "xml2js";

// let's think about the data representation needed

function calculatePatternResolution(pattern)
{
	return 1;
}

function parseHydrogenJs(err,result)
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


  	// for now let's not worry about kinda anything
  	// let's just pull the notes apart by instrument

  	const patternWithTracks = Array.from(
  		patternArray,
  		function(pattern)
  		{	
  			const resolution = calculatePatternResolution(pattern);
  			const instrumentNotes = Array.from(
  				instrumentArray, 
  				function(instrument)
  				{
  					const instrumentID = instrument.id;
		  			const instrumentNotes = pattern.notes.filter( 
		  				note => (note.instrument == instrumentID)
		  			);
		  			// in hydrogen it seems that each beat is a size of 48, let's use that too for now
		  			const instrumentHits = Array.from(
		  				instrumentNotes,
		  				note => note.position
		  			);
		  			return instrumentHits;
  				})
  		}
  	);

}

function parseHydrogen(xmlString)
{
  let parser = new xml2js.Parser();

  parser.parseString(xmlString, parseHydrogenJs);
}

module.exports.parseHydrogen = parseHydrogen;