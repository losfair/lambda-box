export const appConfig = {
  inboundToken: App.mustGetEnv("inboundToken"),
  mailFrom: App.mustGetEnv("mailFrom"),
  mailReplyTo: App.mustGetEnv("mailReplyTo"),
  mailgunApiKey: App.mustGetEnv("mailgunApiKey"),
  mailgunApiBaseUrl: App.mustGetEnv("mailgunApiBaseUrl"),
  icpBeian: App.env["icpBeian"] || "",
  ghToken: App.mustGetEnv("ghToken"),
  allowedCountries: (App.env["allowedCountries"] || "").split(",").filter(x => x),
  allowedGhUsers: (App.env["allowedGhUsers"] || "").split(",").filter(x => x),
  useWpbl: App.env["useWpbl"] === "1",
}

export const appDB = App.mysql.lambda;
