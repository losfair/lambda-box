/// <reference path="../node_modules/jsland-types/src/index.d.ts" />

import * as mime from "mime-types";
import { appConfig, appDB } from "./config";
import { parseInboundMail, refineMail } from "./inbound";
import { sendMail } from "./mail"
import { jsonGenericErrorResponse, jsonResponse, tyckRequest } from "./util";
import * as schema from "./api_schema";

Router.post("/api/add_question", async request => {
    const req = await tyckRequest(request, schema.parser_AddQuestionRequest);
    if(req instanceof Response) return req;
    
    if(req.text.length == 0 || req.text.length > 10000) {
        return jsonGenericErrorResponse(400, "invalid text field");
    }

    await appDB.exec("insert into questions (question, create_time) values(:q, :ct)", {
        "q": ["s", req.text],
        "ct": ["d", new Date()],
    }, "");
    const questionId = (await appDB.exec("select last_insert_id()", {}, "i"))[0][0]!;
    
    await sendQuestionEmail(questionId, req.text);
    return mkJsonResponse(200, {
        ok: true,
    });
});

Router.post("/api/get_questions", async request => {
    const req = await tyckRequest(request, schema.parser_GetQuestionsRequest);
    if(req instanceof Response) return req;

    const res: schema.QuestionListResponse = {
        questions: [],
    };
    res.questions = (await appDB.exec(
        `
        select id, question, response, respond_time from questions
        where
            (:id = 0 or id < :id) and
            published = 1 and
            response is not null and
            respond_time is not null
            order by respond_time desc
            limit 5
        `,
        {id: ["i", req.before]},
        "issd")).map(([id, question, response, respond_time]) => ({
            id: id!,
            entry: {
                time: respond_time!.getTime(),
                question: question!,
                response: response!,
            }
        }));
    return jsonResponse(res, schema.serializer_QuestionListResponse);
})

Router.post(`/api/inbound/${appConfig.inboundToken}`, async req => {
    let contentType = req.headers.get("content-type") || "";
    let body = await req.text();

    const inbound = await parseInboundMail(body, contentType);
    const mail = refineMail(inbound);
    console.log("inbound: " + JSON.stringify(mail));

    const inReplyTo = mail.headers["in-reply-to"];
    if(!inReplyTo) {
        console.log("not a reply");
        return mkJsonResponse(200, {});
    }

    const mailId = inReplyTo.trim();

    const queryRes = (await appDB.exec("select id from questions where mail_id = :mail_id limit 1", {
        "mail_id": ["s", mailId],
    }, "i"))[0];
    if(!queryRes) {
        console.log(`mail id ${mailId} not found`);
        return mkJsonResponse(200, {});
    }
    const questionId = queryRes[0]!;

    /**
     * @type {string}
     */
    let responseBody = mail.content.text;
    if(!responseBody) {
        console.log("text body not found");
        return mkJsonResponse(200, {});
    }

    let responseText = responseBody.trim();

    console.log(`received response to question ${questionId} with mail id ${mailId}: ${responseText}`);
    await appDB.exec(
        "update questions set published = 1, mail_id = :mail_id, response = :response, respond_time = :respond_time where id = :id",
        {
            mail_id: ["s", mailId],
            response: ["s", responseText],
            respond_time: ["d", new Date()],
            id: ["i", questionId],
        },
        ""
    );

    return mkJsonResponse(200, {
        ok: true,
    });
})

const fileList = new TextDecoder().decode(Package["static.txt"]).split("\n").filter(x => x);
const staticFiles: Record<string, Uint8Array> = {};
for(const f of fileList) {
    console.log(`Loading file: ${f}`)
    staticFiles[f] = Package[f];
}

Router.get("/", req => {
    let url = new URL(req.url);
    let filePath: string;
    if(url.pathname.endsWith("/")) {
        filePath = url.pathname + "index.html";
    } else {
        filePath = url.pathname;
    }
    const file = staticFiles["res/static" + filePath];
    if(file === undefined) {
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
});

function mkJsonResponse(status: number, data: unknown) {
    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'text/json' },
        status: status,
    });
}

async function sendQuestionEmail(questionId: number, text: string) {
    const payload: Record<string, string> = {
        from: appConfig.mailFrom,
        to: appConfig.questionRecipient,
        subject: "新的问题",
        text: text,
        "h:Reply-To": appConfig.mailReplyTo,
    };
    let response = await sendMail(payload);
    if(!response.ok) {
        throw new Error("unable to send mail: " + await response.text());
    }
    let result = await response.json();
    let trackingId = result.id;
    console.log(`Tracking id: ${trackingId}`);
    console.log(JSON.stringify(result));
    await appDB.exec("update questions set mail_id = :mail_id where id = :id", {
        "mail_id": ["s", trackingId],
        "id": ["i", questionId],
    }, "");
}
