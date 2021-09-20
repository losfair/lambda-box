import { jsonGenericErrorResponse } from "./util";

Router.use("/", (req, next) => {
  const url = new URL(req.url);
  const country = req.headers.get("x-rw-client-country");
  if(country && country != "CN") {
    if(url.pathname.startsWith("/api/inbound/")) {
      // Allow non-CN automated access to inbound endpoint.
    } else if(url.pathname.startsWith("/api/")) {
      return jsonGenericErrorResponse(451, "Unavailable in this region.");
    } else {
      return new Response(`
Hello,

λ-box is unavailable in your region due to security and compliance reasons.

由于安全与合规需要，λ-box 仅对中国大陆用户提供服务。

Univalence Labs (https://univalence.me)
`.trim(), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      })
    }
  }

  return next(req);
});
