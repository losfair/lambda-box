import { appConfig, appDB } from "./config";
import { DocumentWithFrontMatter, parseDocumentWithFrontMatter } from "./frontmatter";

const octokit = new ExternalService.GitHub.Octokit({
  auth: appConfig.ghToken,
  userAgent: "lambda-box on rwv2",
});

export interface MdSection {
  md: string | null;
  userConfig: Record<string, string> | null;
  expire: Date;
}

export interface UserinfoSection {
  ghid: number | null;
  email: string | null;
  expire: Date;
}

export interface GhUserInfo {
  mdSection: MdSection;
  userinfoSection: UserinfoSection;
}

export function isExpired(expire: Date): boolean {
  const now = Date.now();
  return now > expire.getTime();
}

export async function loadGhUserInfo(usernameOrGhid: string | number, forUpdate: boolean): Promise<GhUserInfo> {
  const [selectCond, uValue]: [string, ["s", string] | ["i", number]] = typeof usernameOrGhid == "string" ? [
    "where username = :u",
    ["s", usernameOrGhid]
  ] : [
    "where ghid = :u order by userinfo_expire desc limit 1",
    ["i", usernameOrGhid]
  ];

  const cachedRes = (await appDB.exec(
    "select `email`, `ghid`, `userinfo_expire`, `md`, `user_config`, `md_expire` from gh_user "
      + selectCond
      + (forUpdate ? " for update": ""),
    {
      "u": uValue,
    }, "sidssd")
  )[0];
  if(cachedRes) {
    const [email, ghid, userinfoExpire, md, userConfig, mdExpire] = cachedRes;
    return {
      userinfoSection: {
        ghid,
        email,
        expire: userinfoExpire!,
      },
      mdSection: {
        md,
        userConfig: userConfig ? JSON.parse(userConfig) : null,
        expire: mdExpire!,
      },
    };
  }

  return {
    userinfoSection: {
      ghid: null,
      email: null,
      expire: new Date(0),
    },
    mdSection: {
      md: null,
      userConfig: null,
      expire: new Date(0),
    },
  };
}

export async function syncGhUserinfo_InTxn(username: string): Promise<GhUserInfo | string> {
  const currentInfo = await loadGhUserInfo(username, true);
  const exp = new Date(Date.now() + 300 * 1000);

  if(isExpired(currentInfo.userinfoSection.expire)) {
    let userinfo;
    try {
      userinfo = await octokit.rest.users.getByUsername({
        username,
      });
    } catch(e) {
      const desc = "" + e;
      if(desc.toLowerCase().includes("not found")) {
        await appDB.exec(`
          insert into gh_user (\`username\`, \`userinfo_expire\`)
            values(:u, :exp)
            on duplicate key update \`userinfo_expire\`=:exp
        `, {
          "u": ["s", username],
          "exp": ["d", exp],
        }, "");
        currentInfo.userinfoSection.expire = exp;
        return currentInfo;
      }

      return "github userinfo request failed: " + e;
    }
  
    if(userinfo.status !== 200) return "bad userinfo status";
  
    const email = userinfo.data.email;
    await appDB.exec(`
    insert into gh_user (\`username\`, \`email\`, \`ghid\`, \`userinfo_expire\`)
      values(:u, :em, :ghid, :exp)
      on duplicate key update \`email\`=:em, \`ghid\`=:ghid, \`userinfo_expire\`=:exp
    `, {
      "u": ["s", username],
      "em": ["s", email],
      "ghid": ["i", userinfo.data.id],
      "exp": ["d", exp],
    }, "");
    currentInfo.userinfoSection = {
      ghid: userinfo.data.id,
      email,
      expire: exp,
    };
  }

  // Now we are sure that we have a user entry in the `gh_user` table.
  // Update MD, but first check that this is not a cache entry for a missing user.
  if(isExpired(currentInfo.mdSection.expire) && currentInfo.userinfoSection.ghid !== null) {
    let mdContent;
    try {
      mdContent = (await octokit.rest.repos.getContent({
        owner: username,
        repo: username,
        path: "/LAMBDA_BOX.md",
        mediaType: {
          format: "raw",
        }
      })).data;
    } catch(e) {
      mdContent = null;
      console.log(`cannot fetch /LAMBDA_BOX.md in repo ${username}/${username}`);
    }

    let decoded: DocumentWithFrontMatter | null = null;
    try {
      if(typeof mdContent === "string") decoded = parseDocumentWithFrontMatter(mdContent);
    } catch(e) {
      console.log("cannot decode /LAMBDA_BOX.md of user " + username + ": " + e);
    }

    if(decoded) {
      await appDB.exec(`
      update gh_user set \`md\`=:md, \`user_config\`=:uc, \`md_expire\`=:exp
        where \`username\`=:u
      `, {
        "u": ["s", username],
        "md": ["s", decoded.content],
        "uc": ["s", JSON.stringify(decoded.frontMatter)],
        "exp": ["d", exp],
      }, "");
      currentInfo.mdSection = {
        md: decoded.content,
        userConfig: decoded.frontMatter,
        expire: exp,
      }
    } else {
      await appDB.exec(`update gh_user set \`md_expire\`=:exp where \`username\`=:u`, {
        "u": ["s", username],
        "exp": ["d", exp],
      }, "");
    }
  }

  return currentInfo;
}
