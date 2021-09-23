import { appConfig, appDB } from "./config";
import { parseInboundMail, refineMail } from "./inbound";
import { loadGhUserInfo } from "./multiuser_sync";
import { mkJsonResponse } from "./util";

Router.post(`/api/inbound/${appConfig.inboundToken}`, async req => {
  let contentType = req.headers.get("content-type") || "";
  let body = await req.arrayBuffer();

  const inbound = parseInboundMail(new Uint8Array(body), contentType);
  const mail = refineMail(inbound);
  console.log("inbound: " + JSON.stringify(mail));

  const inReplyTo = mail.headers["in-reply-to"];
  if(!inReplyTo) {
    console.log("not a reply");
    return mkJsonResponse(200, {});
  }

  const mailId = inReplyTo.trim();

  const queryRes = (await appDB.exec("select id, owner_ghid from questions where mail_id = :mail_id limit 1", {
    "mail_id": ["s", mailId],
  }, "ii"))[0];
  if(!queryRes) {
    console.log(`mail id ${mailId} not found`);
    return mkJsonResponse(200, {});
  }
  const [questionId, ownerGhid] = queryRes;
  const userinfo = await loadGhUserInfo(ownerGhid!, false);
  if(userinfo.userinfoSection.email !== mail.envelope.from) {
    console.log(`mail reply not accepted because sender (${mail.envelope.from}) mismatches owner (ghid ${ownerGhid}, email ${userinfo.userinfoSection.email})`);
    return mkJsonResponse(200, {});
  }

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
