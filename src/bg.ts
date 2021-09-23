import { appDB } from "./config";
import { syncGhUserinfo_InTxn } from "./multiuser_sync";

class BgImpl extends Background.BackgroundEntryBase {
  constructor() {
    super();
  }

  async syncGhUserInfo(username: string) {
    await appDB.startTransaction();
    const res = await syncGhUserinfo_InTxn(username);
    if(typeof res == "string") {
      console.log("syncGhUserInfo failed: " + res);
    } else {
      await appDB.commit();
      console.log("Synchronized GitHub user info for " + username + ".");
    }
  }
}

export const bgImpl = new BgImpl();
