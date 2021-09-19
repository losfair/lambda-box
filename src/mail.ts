import { appConfig } from "./config";

function urlEncodeObject(obj: Record<string, string>) {
    return Object.keys(obj)
        .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
        .join("&");
}

export async function sendMail(data: Record<string, string>) {
    const dataUrlEncoded = urlEncodeObject(data);
    const opts = {
        method: "POST",
        headers: {
            Authorization: "Basic " + Codec.b64encode(new TextEncoder().encode("api:" + appConfig.mailgunApiKey)),
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": dataUrlEncoded.length.toString()
        },
        body: dataUrlEncoded,
    };

    return await fetch(`${appConfig.mailgunApiBaseUrl}/messages`, opts);
}