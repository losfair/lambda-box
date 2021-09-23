import { appConfig } from "./config";

export interface IndexRenderConfig {
  pageError?: string;
  status?: number;
  ownerGhlogin?: string;
  ownerGhid?: number;
  userMd?: string;
  blockReason?: string | null;
}

export function renderIndex(config: IndexRenderConfig): Response {
  return new Response(Template.render(new TextDecoder().decode(Package["res/index.html"]), {
    icpBeian: appConfig.icpBeian,
    pageError: config.pageError,
    ownerGhlogin: JSON.stringify(config.ownerGhlogin || ""),
    ownerGhloginUnwrapped: config.ownerGhlogin || "",
    ownerGhid: JSON.stringify(config.ownerGhid || null),
    userMd: config.userMd || "",
    blockReason: config.blockReason || "",
  }), {
    status: config.status || 200,
    headers: {
      "Content-Type": "text/html",
    }
  });
}