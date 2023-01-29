// h2.js

import Track from "./Track";
import SparseTrack from "./SparseTrack";
import {XMLParser} from "fast-xml-parser";
import { calculateResolution } from "./utilities";
import AVAILABLE_SAMPLES from "./samples.json"

function calculatePatternResolution(pattern, size)
{
  const positions = Array.from(pattern.notes, note => note.position)
  // fixme: should we just create a SparseTrack, and getResolution
  // it has a more robust algorithm for this, I think
  // however, I will mildly delay making this change jus' in case
  return calculateResolution(positions, size);
}

function parseHydrogen(dom, sparse)
{
  // fixme:
  // this parsing often assumes there's >=2 elements
  // note: this code has undergone a significant refactoring, as port of changing
  // the underlying parser, this fixme may no longer apply

  // this "zero" here is presumably an artefact of xml --> json representation
  const instrumentElements = dom.song.instrumentList.instrument;

  // [  { id, name } ]
  const instrumentArray = Array.from(
    instrumentElements,
    function(element){
      const instrumentComponent = element.instrumentComponent;
      let inst = {
        "id" : parseInt(element.id),
        // sometimes strings can be parsed as integers, ensure this is not the case
        "name" : element.name.toString(),
        "volume" : parseFloat(element.volume),
        "muted" : element.isMuted,
        "gain" : parseFloat(element.gain),
        "drumkit" : element.drumkit.toString()
      };
      if(instrumentComponent.layer)
      {
        // fixme:
        // we can have multiple layers (indicating multiple samples) in an instrument
        // hydrogen selects the most appropriate based on the gain/volume OF the individual note
        const layers = [].concat(instrumentComponent.layer);
        // find the midpoint
        // (presume that's most appropriate? You could also choose the one that most matches the current gain)
        const midIndex = Math.min( Math.max( Math.floor(layers.length / 2), 0), layers.length - 1);
        if(layers[midIndex].filename)
        {
          if(element.drumkit.toString() in AVAILABLE_SAMPLES)
          {
            // if we support the drumkit, let's silently swap out flac for wav, nice 'n' early
            inst["filename"] = layers[0].filename.toString().replace(".flac", ".wav");
          }
          else
          {
            // else, preserve the filename for more accurate error messages
            inst["filename"] = layers[0].filename.toString();
          }
        }
      }
      return inst;
    }
  );


  const patternElements = dom.song.patternList.pattern;
  // patterns
  // [  { name, size, notes } ]
  const patternArray = Array.from(
    patternElements,
    function(element){
      const patternSize = parseInt(element.size);
      // for an empty pattern, noteList may be an empty string and note will be undefined
      const noteElements = element.noteList.note;
      let notes = [];
      if( noteElements )
      {
        // notes
        // [ {position, instrument(id}]
        notes = Array.from(
          noteElements,
          function(noteElement){
            return {
              "position" : parseInt(noteElement.position),
              "instrument" : parseInt(noteElement.instrument),
              "velocity": parseFloat(noteElement.velocity)
            };
          }
        );

        // hydrogen permits you to have notes that reach past the pattern size,
        // they then get revealed when you extend the pattern,
        // here's an easy point to get rid of them, we don't want them to factor into any calculations
        notes = notes.filter( n => n.position < patternSize );
      }
      return {
        "size" : patternSize,
        "name" : element.name.toString(),
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
        const relevantVelocities = Array.from(
          relevantNotes,
          note => note.velocity
        );
        if(sparse)
        {
          instrumentTracks[ instrument.id.toString() ] = new SparseTrack( relevantHits, pattern.size, relevantVelocities );
        }
        else
        {
          instrumentTracks[ instrument.id.toString() ] = Track.fromPositions( relevantHits, pattern.size, resolution );
        }
      }
      pattern.resolution = resolution;
      pattern.instrumentTracks = instrumentTracks;
      return pattern;
    }
  );

  // todo: refactor into (at least one) separate function
  if(dom.song.virtualPatternList)
  {
    // so unfortunately, virtualPatternGroup represents a directional graph and we have to build
    // the tree of dependencies for each node, we implement this in a very simplistic way
    // let's build a mapping( name -> [ names ] ) and continue to resolve it
    // until we're done
    const virtualPatternGroups = dom.song.virtualPatternList.pattern;
    if( virtualPatternGroups )
    {
      // each element looks like
      //
      // <pattern>
      // <name>p2-a-djembe</name>
      // <virtual>p2-a-bass</virtual>
      // <virtual>p2-snare</virtual>
      // </pattern>

      let patternToRelated = {};

      // record initial relations
      for( const virtualGroup of Array.from(virtualPatternGroups) )
      {
        const rootPatternName = virtualGroup.name;
        if( typeof virtualGroup.virtual === 'string')
        {
          patternToRelated[rootPatternName] = new Set([virtualGroup.virtual]);
        }
        else
        {
          patternToRelated[rootPatternName] = new Set(Array.from(virtualGroup.virtual));
        }
      }

      // expand connections until our object stops changing, brute-force
      // this is a relatively large limit but is better than the potential of an infinite loop
      // I think 3 layers would be pushing this feature
      const MAX_ITERATIONS = 20;
      for(let iteration = 0; iteration < MAX_ITERATIONS; ++iteration)
      {
        let expandedObject = {};
        // we could do a check at the end of each loop, but it's easier to track object equality this way
        let objectHasExpanded = false;
        for(const [root, related] of Object.entries(patternToRelated))
        {
          let expandedNodeSet = new Set(related);
          for( const node of expandedNodeSet )
          {
            if( node in patternToRelated )
            {
              // set union
              expandedNodeSet = new Set([...expandedNodeSet, ...patternToRelated[node]]);
            }
          }
          objectHasExpanded = objectHasExpanded || ( expandedNodeSet.size !== related.size );
          expandedObject[ root ] = expandedNodeSet;

        }
        // exit if no change
        if(!objectHasExpanded)
        {
          break;
        }
        // throw if we've failed to resolve all the connections by now, morelikely something has gone wrong
        if( iteration === MAX_ITERATIONS )
        {
          throw new Error("Reached max virtual_pattern recursion depth.");
        }
        // otherwise update mapping and continue
        patternToRelated = expandedObject;
      }

      for( const [rootPatternName, relatedPatternSet] of Object.entries(patternToRelated) )
      {
        // could do filter, and assert on length?
        let rootPattern = patternsWithTracks.find(p => p.name === rootPatternName);
        for( const patternToMergeName of relatedPatternSet )
        {
          const patternToMerge = patternsWithTracks.find(p => p.name === patternToMergeName );
          for( const [id, t] of Object.entries(patternToMerge.instrumentTracks) )
          {
            if( id in rootPattern.instrumentTracks )
            {
              // we match hydrogen's implementation here and discard values past the length of the original track
              const expand = false;
              const merged = rootPattern.instrumentTracks[ id ].aggregate( t, expand);
              rootPattern.instrumentTracks[ id ] = merged;
            }
            else
            {
              if(sparse)
              {
                rootPattern.instrumentTracks[id] = t.shrinkTo(rootPattern.size);
              }
              else
              {
                // ensure track is the appropriate length & res
                let copiedTrack = t.format(rootPattern.resolution);
                copiedTrack.length = rootPattern.size  / rootPattern.resolution;
                rootPattern.instrumentTracks[id] = copiedTrack;
              }
            }
          }
        }
        // reassess resolution and apply to all tracks
        // this may not be necessary (even when doing dense tracks) but it's probably nice
        if(!sparse)
        {
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
  }

  return {
    "instruments" : instrumentArray,
    "patterns" : patternsWithTracks
  }
}

async function parseHydrogenPromise(xmlString)
{
  const promise = new Promise((resolve, reject) => {
    const dom = new XMLParser().parse(xmlString)
    return resolve(parseHydrogen(dom, true));
  });
  return promise;
}

const moduleExports = { parseHydrogenPromise };

export default moduleExports;
