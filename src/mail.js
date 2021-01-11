import * as b64 from "base64-js";

function urlEncodeObject(obj) {
    return Object.keys(obj)
        .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
        .join("&");
}

export async function sendMail(data) {
    const dataUrlEncoded = urlEncodeObject(data);
    const opts = {
        method: "POST",
        headers: {
            Authorization: "Basic " + b64.fromByteArray(new TextEncoder().encode("api:" + global.MAILGUN_API_KEY)),
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": dataUrlEncoded.length.toString()
        },
        body: dataUrlEncoded,
    };

    return await fetch(`${global.MAILGUN_API_BASE_URL}/messages`, opts);
}