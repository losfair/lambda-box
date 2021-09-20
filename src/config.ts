export const appConfig = {
  inboundToken: App.mustGetEnv("inboundToken"),
  mailFrom: App.mustGetEnv("mailFrom"),
  questionRecipient: App.mustGetEnv("questionRecipient"),
  mailReplyTo: App.mustGetEnv("mailReplyTo"),
  mailgunApiKey: App.mustGetEnv("mailgunApiKey"),
  mailgunApiBaseUrl: App.mustGetEnv("mailgunApiBaseUrl"),
  icpBeian: App.env["icpBeian"] || "",
}

export const appDB = App.mysql.lambda;
