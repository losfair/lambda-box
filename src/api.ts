import { jsonGenericErrorResponse, mkJsonResponse, tyckRequest } from "./util";
import * as schema from "./api_schema";
import { appConfig, appDB } from "./config";
import { sendMail } from "./mail";
import { loadGhUserInfo } from "./multiuser_sync";

Router.post("/api/add_question", async request => {
  const blockReason = request.headers.get("x-rw-app-block-reason");
  if(blockReason) {
    return jsonGenericErrorResponse(403, blockReason);
  }

  const req = await tyckRequest(request, schema.validator_AddQuestionRequest);
  if(req instanceof Response) return req;
  
  if(req.text.length == 0 || req.text.length > 10000) {
    return jsonGenericErrorResponse(400, "invalid text field");
  }

  const ownerInfo = await loadGhUserInfo(req.owner_ghid, false);
  if(!ownerInfo.userinfoSection.email || !ownerInfo.mdSection.userConfig) return jsonGenericErrorResponse(400, "invalid owner ghid");

  const clientIp = request.headers.get("x-rw-client-ip") || "";

  await appDB.exec("insert into questions (owner_ghid, question, client_ip, create_time) values(:owner, :q, :ci, :ct)", {
    "owner": ["i", req.owner_ghid],
    "q": ["s", req.text],
    "ci": ["s", clientIp],
    "ct": ["d", new Date()],
  }, "");
  const questionId = (await appDB.exec("select last_insert_id()", {}, "i"))[0][0]!;
  
  await sendQuestionEmail(ownerInfo.userinfoSection.email, questionId, request, req.text);
  return mkJsonResponse(200, {
    ok: true,
  });
});

Router.post("/api/get_questions", async request => {
  const req = await tyckRequest(request, schema.validator_GetQuestionsRequest);
  if(req instanceof Response) return req;

  const res: schema.QuestionListResponse = {
    questions: [],
  };
  res.questions = (await appDB.exec(
    `
    select id, question, response, respond_time from questions
    where
      owner_ghid = :owner and
      (:id = 0 or id < :id) and
      published = 1 and
      response is not null and
      respond_time is not null
      order by respond_time desc
      limit 5
    `,
    {id: ["i", req.before], owner: ["i", req.owner_ghid]},
    "issd")).map(([id, question, response, respond_time]) => ({
      id: id!,
      entry: {
        time: respond_time!.getTime(),
        question: question!,
        response: response!,
      }
    }));
  return mkJsonResponse(200, res);
})

async function sendQuestionEmail(ownerEmail: string, questionId: number, request: Request, text: string) {
  const clientIp = request.headers.get("x-rw-client-ip") || "?";
  const clientCountry = request.headers.get("x-rw-client-country") || "?";
  const clientCity = request.headers.get("x-rw-client-city") || "?";
  const clientSubdiv1 = request.headers.get("x-rw-client-subdivision-1") || "?";
  const maybeClientSubdiv2 = request.headers.get("x-rw-client-subdivision-2");
  const clientSubdiv = maybeClientSubdiv2 ? clientSubdiv1 + "-" + maybeClientSubdiv2 : clientSubdiv1;
  const clientGeoDesc = `${clientCountry}/${clientSubdiv}/${clientCity}`;

  const payload: Record<string, string> = {
    from: appConfig.mailFrom,
    to: ownerEmail,
    subject: "新的问题",
    text: `From: ${clientIp} (${clientGeoDesc})\n\n${text}`,
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
