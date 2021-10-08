import { appConfig } from "./config";

export interface IndexRenderConfig {
  pageError?: string;
  status?: number;
  ownerGhlogin?: string;
  ownerGhid?: number;
  userMdHtml?: string;
  userMdRaw?: string;
  userConfig?: Record<string, string>;
  blockReason?: string | null;
}

export function renderIndex(config: IndexRenderConfig): Response {
  const rawMdSegs = (config.userMdRaw || "").split("\n").map(x => x.trim()).filter(x => x);

  return new Response(Template.render(new TextDecoder().decode(Package["templates/index.tera"]), {
    icpBeian: appConfig.icpBeian,
    pageError: config.pageError,
    ownerGhlogin: JSON.stringify(config.ownerGhlogin || ""),
    ownerGhloginUnwrapped: config.ownerGhlogin || "",
    ownerGhid: JSON.stringify(config.ownerGhid || null),
    userMdHtml: config.userMdHtml || "",
    blockReason: config.blockReason || "",
    questionHint: config.userConfig?.questionHint || "Ask me anything!",
    metaTitle: config.ownerGhlogin ? `Ask @${config.ownerGhlogin}` : "λ-box MT",
    metaDesc: rawMdSegs.length ? rawMdSegs[0] : "Ask me anything!",
  }), {
    status: config.status || 200,
    headers: {
      "Content-Type": "text/html",
    }
  });
}