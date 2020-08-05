class AudioRequest {
  static make(url) {
    // Create new promise with the Promise() constructor;
    // This has as its argument a function
    // with two parameters, resolve and reject
    return new Promise(function(resolve, reject) {
      // Standard XHR 
      var request = new XMLHttpRequest();
      request.open('GET', url);
      request.responseType = "arraybuffer";
      // When the request loads, check whether it was successful
      request.onload = function() {
        if (request.status === 200) {
        // If successful, resolve the promise by passing back the request response
          resolve(request.response);
        } else {
        // If it fails, reject the promise with a error message
          reject(Error('Buffer didn\'t load successfully; error code:' + request.statusText));
        }
      };
      request.onerror = function() {
      // Also deal with the case when the entire request fails to begin with
      // This is probably a network error, so reject the promise with an appropriate message
          reject(Error('There was a network error.'));
      };
      // Send the request
      request.send();
    });
  }

  static parse(context, response)
  {
    return new Promise(function(resolve,reject) {
      // Asynchronously decode the audio file data in request.response
      context.decodeAudioData(
        response,
        (buffer) => { 
          if(buffer){ resolve(buffer); }
          else{ reject( "buffer null" ); }
        },
        (err) => { reject(err); }
      );
    });
  }
};

export default AudioRequest;