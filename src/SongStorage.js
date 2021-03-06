import hash from "object-hash";
import zlib from "zlib";
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

const JSON_BIN_API = "https://api.jsonbin.io";
const JSON_BIN_API_BINS = JSON_BIN_API + "/b";
const JSON_BIN_API_SECRET = "$2b$10$Z2eAUT2PfRKn5RB55/Y30ujW8aUB1CCgRuUua3Jo9JX2WTetZRfIG";
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
      "secret-key": JSON_BIN_API_SECRET,
      "collection-id": TABIT_SONG_COLLECTION_ID,
      private: false,
      name: binShort
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
      return data.id;
    });
}

const get = (binID) =>
{
  const metadata = {
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch( JSON_BIN_API_BINS + "/" + binID, metadata )
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
      return decodeState(js);
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

const saveToLocalHistory = (exportState) => {
    const stateToShare = encodeState(exportState);
    const stateHash = hash(stateToShare);
    let history = getLocalHistory();
    const relevantHistory = history.filter( song => ( song.id === stateHash && song.name === exportState.songName ) );
    if( relevantHistory.length !== 0 )
    {
      // found at least one history entry identical to this one ...
      // update one, so it's the most recent entry
      relevantHistory[0].date = Date.now();
    }
    else
    {
      // add history entry
      const historyEntry = {
        name: exportState.songName,
        id: stateHash,
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
  download,
  getLocalHistory,
  saveToLocalHistory
};
