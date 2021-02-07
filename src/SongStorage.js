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

const getJsonDestinationUrl = (slug) => {
  const jsonbase_url = "https://jsonbase.com/tabit-song/" + slug;
  return jsonbase_url;
}

const getJsonStorageUrl = (slug) => {
  // jsonbase doesn't give cross-origin headers,
  // so we use cors-anywhere to add them

  // this is obviously a hack, but it enables us to use jsonbase
  // as a transitive (semi-permanent) database, on a static site!
  const cors_url = "https://cors-anywhere.herokuapp.com/";
  return cors_url + getJsonDestinationUrl(slug);
}

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

const get = (songID) =>
{
  return fetch(getJsonStorageUrl(songID))
    .then( response => { return response.json(); } )
    .then( js => {
      const decodedState = decodeState(js);
      const stateHash = hash(js);
      if( stateHash !== songID )
      {
        throw new Error("Hash did not match");
      }
      return decodedState;
    });
}

const put = (exportState) =>
{
  const stateToShare = encodeState(exportState);
  const stateHash = hash(stateToShare);
  const uploadUrl = getJsonStorageUrl(stateHash);

  const metadata = {
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stateToShare)
  };

  const permanentUrl = window.origin + process.env.PUBLIC_URL + "/song/" + stateHash;
  return fetch(uploadUrl, metadata).then(
    response => {
      if(!response.ok)
      {
        throw new Error("Failed to upload song to " + uploadUrl);
      }
      return permanentUrl;
    }
  );
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
    const restrictedHistory = history.sort( (a,b) =>(b.date - a.date)  ).slice(0, 10);
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
