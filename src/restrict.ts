import { appConfig } from "./config";

Router.use("/", (req, next) => {
  const country = req.headers.get("CF-IPCountry") || "";
  const wpbl = req.headers.get("x-blueboat-client-wpbl");
  const countryBlocked = country && appConfig.allowedCountries.length && appConfig.allowedCountries.findIndex(x => x == country) == -1;
  const wpblBlocked = appConfig.useWpbl && wpbl === "1";
  const blockReason =
    countryBlocked ? "We are unable to accept new questions from your region due to security and compliance reasons." :
    wpblBlocked ? "We are unable to accept new questions from your IP address because it's on Wikipedia's block list." : undefined;
  if(blockReason) {
    req.headers.set("x-blueboat-app-block-reason", blockReason);
  }

  return next(req);
});
