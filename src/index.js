import mime from "mime-types";
import { parseInboundMail, refineMail } from "./inbound.js";
import { sendMail } from "./mail.js"

addEventListener("fetch", event => {
    event.respondWith(handleRequest(event.request));
});

/**
 * 
 * @param {Request} request 
 */
async function handleRequest(request) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    console.log(`${request.url} Forwarded for: ${forwardedFor}`);
    let url = new URL(request.url);
    if(url.pathname == "/api/add_question") {
        let body = await request.json();

        if(typeof(body.text) != "string") {
            throw new Error("bad text field");
        }

        if(body.text.length == 0 || body.text.length > 10000) {
            throw new Error("bad length of text field");
        }

        await sendQuestionEmail(body.text);

        return mkJsonResponse(200, {
            ok: true,
        });
    } else if(url.pathname == "/api/get_questions") {
        let body = await request.json();

        /**
         * @type {number}
         */
        let start;
        if(typeof(body.start) === "number") {
            start = body.start;
        } else {
            start = await kv.published_questions.get("index");
            if(start === null) start = 0;
            else start = parseInt(start);
        }

        let res = [];
        for(let i = 1; i <= 5; i++) {
            let current = start - i;
            if(current < 0) break;

            let item = await kv.published_questions.get(":" + current);
            if(item === null) continue;

            let entry;
            try {
                entry = JSON.parse(item);
            } catch(e) {
                continue;
            }
            res.push({
                id: current,
                entry: entry,
            });
        }
        return mkJsonResponse(200, res);
    } else if(url.pathname == `/api/inbound/${global.INBOUND_TOKEN}`) {
        let contentType = request.headers.get("content-type");
        let body = await request.text();

        const inbound = await parseInboundMail(body, contentType);
        const mail = refineMail(inbound);
        console.log("inbound: " + JSON.stringify(mail));

        const inReplyTo = mail.headers["in-reply-to"];
        if(!inReplyTo) {
            console.log("not a reply");
            return mkJsonResponse(200, {});
        }

        const questionId = inReplyTo.trim();
        let questionRaw = await kv.pending_questions.get(questionId);
        if(questionRaw === null) {
            console.log(`question ${questionId} not found`);
            return mkJsonResponse(200, {});
        }

        let question;
        try {
            question = JSON.parse(questionRaw);
        } catch(e) {
            console.log("bad question encoding: " + questionRaw);
            return mkJsonResponse(200, {});
        }

        /**
         * @type {string}
         */
        let responseBody = mail.content.text;
        if(!responseBody) {
            console.log("text body not found");
            return mkJsonResponse(200, {});
        }

        let responseText = responseBody.trim();

        console.log(`received response to question ${questionId}: ${responseText}`);

        // This is NOT atomic but assuming we only have one user... it's ok.
        let lastIndex = await kv.published_questions.get("index");
        if(lastIndex === null) {
            lastIndex = 0;
        } else {
            lastIndex = parseInt(lastIndex);
        }
        await kv.published_questions.put(":" + lastIndex, JSON.stringify({
            time: Date.now(),
            question: question.text,
            response: responseText,
        }));
        lastIndex++;
        await kv.published_questions.put("index", "" + lastIndex);
        await kv.pending_questions.delete(questionId);

        return mkJsonResponse(200, {
            ok: true,
        });
    } else {
        return handleStaticFile(url);
    }
}

/**
 * 
 * @param {URL} url 
 */
function handleStaticFile(url) {
    let filePath;
    if(url.pathname.endsWith("/")) {
        filePath = url.pathname + "index.html";
    } else {
        filePath = url.pathname;
    }
    filePath = "./res/static" + filePath;
    let file = getFileFromBundle(filePath);
    if(file === null) {
        return new Response("not found: " + filePath, {
            status: 404,
        });
    } else {
        let contentType = mime.lookup(filePath) || "application/octet-stream";
        return new Response(file, {
            headers: {
                "Content-Type": contentType,
            }
        });
    }
}

/**
 * 
 * @param {number} status 
 * @param {any} data 
 */
function mkJsonResponse(status, data) {
    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'text/json' },
        status: status,
    });
}

/**
 * 
 * @param {string} text 
 */
async function sendQuestionEmail(text) {
    const payload = {
        from: global.MAIL_FROM,
        to: global.QUESTION_RECIPIENT,
        subject: "新的问题",
        text: text,
        "h:Reply-To": global.MAIL_REPLY_TO,
    };
    let response = await sendMail(payload);
    if(!response.ok) {
        throw new Error("unable to send mail: " + await response.text());
    }
    let result = await response.json();
    let trackingId = result.id;
    console.log(`Tracking id: ${trackingId}`);
    console.log(JSON.stringify(result));

    await kv.pending_questions.put(trackingId, JSON.stringify({
        text: text,
        time: Date.now(),
    }));
}
