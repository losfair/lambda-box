/// <reference path="../node_modules/jsland-types/src/index.d.ts" />

import "./restrict";
import "./multiuser";
import "./api";
import "./api_inbound";

Router.get("/", req => {
  let url = new URL(req.url);
  if(url.pathname == "/") {
    return new Response("redirecting", {
      status: 301,
      headers: {
        "Location": "/u/gh/losfair/",
      },
    });
  }

  let filePath: string;
  if(url.pathname.endsWith("/")) {
    filePath = url.pathname + "index.html";
  } else {
    filePath = url.pathname;
  }
  const file = Package["static" + filePath];
  if(file === undefined) {
    return new Response("not found: " + filePath, {
      status: 404,
    });
  } else {
    let segs = filePath.split(".");
    let ext = segs[segs.length - 1];
    let contentType = Dataset.Mime.guessByExt(ext) || "application/octet-stream";
    return new Response(file, {
      headers: {
        "Content-Type": contentType,
      }
    });
  }
});
