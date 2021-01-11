// https://gist.github.com/WillemLabu/5223f25713b376bb6700c90772ac41ec

export function MultiPart_parse(body, contentType) {
    // Examples for content types:
    //      multipart/form-data; boundary="----7dd322351017c"; ...
    //      multipart/form-data; boundary=----7dd322351017c; ...
    var m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  
    if (!m) {
      throw new Error('Bad content-type header, no multipart boundary');
    }
  
    let s, fieldName;
    let boundary = m[1] || m[2];
  
    function Header_parse(header) {
      var headerFields = {};
      var matchResult = header.match(/^.*name="([^"]*)"$/);
      if (matchResult) headerFields.name = matchResult[1];
      return headerFields;
    }
  
    function rawStringToBuffer(str) {
      var idx, len = str.length,
        arr = new Array(len);
      for (idx = 0; idx < len; ++idx) {
        arr[idx] = str.charCodeAt(idx) & 0xFF;
      }
      return new Uint8Array(arr).buffer;
    }
  
    // \r\n is part of the boundary.
    boundary = '\r\n--' + boundary;
  
    var isRaw = typeof(body) !== 'string';
  
    if (isRaw) {
      var view = new Uint8Array(body);
      s = String.fromCharCode.apply(null, view);
    } else {
      s = body;
    }
  
    // Prepend what has been stripped by the body parsing mechanism.
    s = '\r\n' + s;
  
    var parts = s.split(new RegExp(boundary)),
      partsByName = {};
  
    // First part is a preamble, last part is closing '--'
    for (var i = 1; i < parts.length - 1; i++) {
      var subparts = parts[i].split('\r\n\r\n');
      var headers = subparts[0].split('\r\n');
      for (var j = 1; j < headers.length; j++) {
        var headerFields = Header_parse(headers[j]);
        if (headerFields.name) {
          fieldName = headerFields.name;
        }
      }
  
      partsByName[fieldName] = isRaw ? rawStringToBuffer(subparts[1]) : subparts[1];
    }
  
    return partsByName;
  }
  
  function Boundary_parse(body) {
    var bndry = body.split('Content-Disposition: form-data;')[0];
    return bndry.trim().slice(2);
  }