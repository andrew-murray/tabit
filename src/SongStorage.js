import hash from "object-hash";
import zlib from "zlib";

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

export {
  decodeState,
  get
};
