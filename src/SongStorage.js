import hash from "object-hash";
import zlib from "browserify-zlib";
import { Buffer } from "buffer";
import { saveAs } from 'file-saver';

const storageAvailable = (type) => {
    // this is code copied from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    let storage;
    try {
        storage = window[type];
        let x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
    // accept certain types of exceptions as legitimate consequences of the feature working
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
};

const encodeState = (songData) =>
{
  // json
  const js = JSON.stringify(songData);
  // compress
  const compressedState = zlib.deflateSync(js).toString("base64");
  return { state : compressedState };
}

const decodeState = (state) =>
{
  const binaryBuffer = new Buffer(state.state, "base64");
  const decompressedString = zlib.inflateSync(binaryBuffer);
  return JSON.parse(decompressedString);
};

const JSON_BIN_API = "https://api.jsonbin.io/v3";
const JSON_BIN_API_BINS = JSON_BIN_API + "/b";
const JSON_BIN_API_MASTER = "$2b$10$Z2eAUT2PfRKn5RB55/Y30ujW8aUB1CCgRuUua3Jo9JX2WTetZRfIG";
const JSON_BIN_API_ACCESS = "$2b$10$mN.aEiIuRtbrFbVsMmrqausaqa9yuZ15zo/TubmocT6.J5TEKjm7u";
const TABIT_SONG_COLLECTION_ID = "60218fa606934b65f53046ad";

const put = (exportState, name) =>
{
  const binName = name ? name : exportState.songName;
  // names are limited to 128 characters, let's be safe
  const binShort = binName.slice(0, 64);
  const stateToShare = encodeState(exportState);
  const metadata = {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSON_BIN_API_MASTER,
      "X-Collection-Id": TABIT_SONG_COLLECTION_ID,
      'X-Bin-Private': false,
      'X-Bin-Name': binShort
    },
    body: JSON.stringify(stateToShare)
  };
  return fetch( JSON_BIN_API_BINS, metadata )
    .then(response => {
      if(!response.ok)
      {
        throw new Error("Failed to upload song");
      }
      else
      {
        return response.json();
      }
    }).then(data => {
      console.log("Got response from remote DB")
      console.log("===========================")
      console.log(data);
      return data.metadata.id;
    });
}

const formatURL = (binID) =>
{
  return JSON_BIN_API_BINS + "/" + binID + "/latest";
};

const get = (binID) =>
{
  const metadata = {
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSON_BIN_API_MASTER,
      'X-Access-Key': JSON_BIN_API_ACCESS
    }
  };
  return fetch( formatURL(binID), metadata )
    .then( response => {
      if(!response.ok)
      {
        throw new Error("Failed to upload song");
      }
      else
      {
        return response.json();
      }
    } )
    .then( js => {
      console.log("Fetched remote DB record")
      console.log("========================")
      console.log(js);
      return decodeState(js.record);
    });
};

const getLocalHistory = () => {
  if(!storageAvailable('localStorage'))
  {
    return [];
  }
  const jsonHistory = localStorage.getItem("tabit-history");
  const songHistory = jsonHistory ? JSON.parse(jsonHistory).sort( (a,b) =>(b.date - a.date) ) : [];
  return songHistory;
};

const translateLocalSongID = (songID) => {
  const history = getLocalHistory();
  const matches = history.filter( song => ( song.songID === songID ) );
  if(matches.length < 1)
  {
    return null;
  }
  else
  {
    return matches[0].id;
  }
};

const saveToLocalHistory = (exportState, songID) => {
  const stateToShare = encodeState(exportState);
  const stateHash = hash(stateToShare);
  let history = getLocalHistory();
  const relevantHistory = history.filter( song => ( song.id === stateHash && song.name === exportState.songName ) );
  if( relevantHistory.length !== 0 )
  {
    // found at least one history entry identical to this one ...
    // update one, so it's the most recent entry
    relevantHistory[0].date = Date.now();
    // and if we've got a songID that matches
    relevantHistory[0].songID = songID;
  }
  else
  {
    // add history entry
    const historyEntry = {
      name: exportState.songName,
      id: stateHash,
      hash: stateHash,
      songID: songID,
      date: Date.now(),
      content: stateToShare
    };
    history.push(historyEntry);
  }

  // resort & cap how many files we remember
  const restrictedHistory = history.sort( (a,b) =>(b.date - a.date)  ).slice(0, 30);
  localStorage.setItem("tabit-history", JSON.stringify(restrictedHistory));
};

const download = (exportState) => {
  const destFilename = exportState.songName + ".tabit";
  const js = JSON.stringify(exportState, null, 4);
  const blob = new Blob([js], {type: "application/json"});
  saveAs(blob, destFilename);
};

export {
  decodeState,
  get,
  put,
  formatURL,
  download,
  getLocalHistory,
  translateLocalSongID,
  saveToLocalHistory
};
