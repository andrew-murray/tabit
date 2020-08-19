// h2.js

import track from "./track";
import xml2js from "xml2js";
import { calculateResolution } from "./utilities";

// TODO: This file was written with the hope that using xml2js would make things cleaner
// it didn't, purely because xml2js is an okay library doing a difficult task
// it ensures to produce a good json file but in doing so muddles the data a bit.
// Should replace this with dom-parser and window.DOMParser

// let's think about the data representation needed

function calculatePatternResolution(pattern, size)
{
  const positions = Array.from(pattern.notes, note => note.position)
  return calculateResolution(positions, size);
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
        const instrumentComponent = element.instrumentComponent[0];
        let inst = {
          "id" : parseInt(element.id), 
          "name" : element.name[0],
           "volume" : parseFloat(element.volume), 
           "muted" : element.isMuted[0] === "true",
           "gain" : parseFloat(element.gain),
           "drumkit" : element.drumkit[0]
        };
        if( "layer" in instrumentComponent )
        {
          inst["filename"] = instrumentComponent.layer[0].filename[0];
        }
        return inst;
      }
    );

    const patternElements = result.song.patternList[0].pattern;
    // patterns
    // [  { name, size, notes } ]
    const patternArray = Array.from(
      patternElements,
      function(element){
        const noteElements = element.noteList[0].note;
        const patternSize = parseInt(element.size);
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

          // hydrogen permits you to have notes that reach past the pattern size, 
          // they then get revealed when you extend the pattern, 
          // here's an easy point to get rid of them, we don't want them to factor into any calculations
          notes = notes.filter( n => n.position < patternSize );
        }
        return {
          "size" : patternSize, 
          "name" : element.name[0],
          "notes" : notes
        };
      }
    );

    // transform pattern to a managable data
    const patternsWithTracks = Array.from(
      patternArray,
      function(pattern)
      { 
        const resolution = calculatePatternResolution(pattern, pattern.size);
        let instrumentTracks = {};
        for( const instrument of instrumentArray )
        {
          const relevantNotes = pattern.notes.filter( 
            note => (note.instrument === instrument.id)
          );
          const relevantHits = Array.from(
            relevantNotes,
            note => note.position
          );
          instrumentTracks[ instrument.id.toString() ] = track.fromPositions( relevantHits, pattern.size, resolution);
        }
        pattern.resolution = resolution;
        pattern.instrumentTracks = instrumentTracks;
        return pattern;
      }
    );

    if(result.song.virtualPatternList)
    {
      // so unfortunately, virtualPatternGroup are transitive
      // they form a tree, by specifying the edges and this has to be solved
      const virtualPatternGroups = result.song.virtualPatternList[0].pattern;
      if( virtualPatternGroups )
      {
        // each element looks like
        //
        // <pattern>
        // <name>p2-a-djembe</name>
        // <virtual>p2-a-bass</virtual>
        // <virtual>p2-snare</virtual>
        // </pattern>
        for( const virtualGroup of Array.from(virtualPatternGroups) )
        {
          const rootPatternName = virtualGroup.name[0];
          // could do filter, and assert on length?
          let rootPattern = patternsWithTracks.find(p => p.name === rootPatternName);
          for( const patternToMergeName of virtualGroup.virtual )
          {
            const patternToMerge = patternsWithTracks.find(p => p.name === patternToMergeName );
            for( const [id, track] of Object.entries(patternToMerge.instrumentTracks) )
            {
              if( id in rootPattern.instrumentTracks )
              {
                const merged = rootPattern.instrumentTracks[ id ].aggregate( track );
                // we match hydrogen's implementation here and discard values past the length of the original track
                merged.rep.length = rootPattern.instrumentTracks[ id ].length()  / merged.resolution;
                rootPattern.instrumentTracks[ id ] = merged; 
              }
              else
              {
                rootPattern.instrumentTracks[id] = track;
              }
            }
          }
          // reassess resolution and apply to all tracks
          // this may not be necessary but it's probably nice
          const resolution = calculatePatternResolution(rootPattern, rootPattern.size);
          rootPattern.resolution = resolution;
          for( const [id, track] of Object.entries(rootPattern.instrumentTracks) )
          {
            // ensure that 
            rootPattern[id] = track.format( resolution );
          }
        }

      }
    }


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

export default { parseHydrogenPromise };