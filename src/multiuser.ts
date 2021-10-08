import { bgImpl } from "./bg";
import { appConfig } from "./config";
import { isExpired, loadGhUserInfo } from "./multiuser_sync";
import { renderIndex } from "./render";
import { jsonGenericErrorResponse } from "./util";

const userBoxRegex = /^\/u\/([0-9a-zA-Z_-]+)\/([0-9a-zA-Z_-]+)\//;

Router.get("/u/", async req => {
  const url = new URL(req.url);
  if(!url.pathname.endsWith("/")) return new Response("redirecting", {
    status: 302,
    headers: {
      "Location": url.pathname + "/",
    },
  });
  const match = userBoxRegex.exec(url.pathname);
  if(!match) return jsonGenericErrorResponse(404, "bad user match");

  const idp = match[1];
  const username = match[2];

  if(idp != "gh") return jsonGenericErrorResponse(400, "idp not supported");

  if(appConfig.allowedGhUsers.length && appConfig.allowedGhUsers.findIndex(x => x == username) == -1) {
    return renderIndex({
      status: 403,
      pageError: "This user is not in the currently configured allow list.",
    });
  }

  const uinfo = await loadGhUserInfo(username, false);
  if(!uinfo || isExpired(uinfo.mdSection.expire) || isExpired(uinfo.userinfoSection.expire)) {
    Background.atMostOnce(bgImpl, "syncGhUserInfo", username);
  }

  if(uinfo.userinfoSection.expire.getTime() == 0) {
    return renderIndex({
      status: 503,
      pageError: "Collecting data. Come back soon.",
    });
  }

  if(!uinfo.userinfoSection.ghid) {
    return renderIndex({
      status: 403,
      pageError: "We are unable to find this user on GitHub.",
    });
  }

  if(!uinfo.userinfoSection.email) {
    return renderIndex({
      status: 403,
      pageError: "This user does not have a public email address on their GitHub profile.",
    });
  }

  if(uinfo.mdSection.userConfig === null || uinfo.mdSection.md === null) {
    return renderIndex({
      status: 403,
      pageError: `Please put a LAMBDA_BOX.md file under the repository "${username}/${username}".`
    });
  }

  const userMdHtml = TextUtil.Markdown.renderToHtml(uinfo.mdSection.md, {});

  return renderIndex({
    ownerGhid: uinfo.userinfoSection.ghid,
    ownerGhlogin: username,
    userMdHtml,
    userMdRaw: uinfo.mdSection.md,
    userConfig: uinfo.mdSection.userConfig,
    blockReason: req.headers.get("x-blueboat-app-block-reason"),
  });
});
