create table questions (
  `id` bigint not null auto_increment,
  `owner_ghid` bigint not null,
  `mail_id` varchar(200),
  `question` text not null,
  `client_ip` varchar(100) not null,
  `response` text,
  `published` tinyint not null default 0,
  `create_time` datetime not null,
  `respond_time` datetime,
  primary key (`id`),
  index by_owner_ghid (owner_ghid),
  index by_mail_id (mail_id),
  index by_create_time (create_time),
  index by_respond_time (respond_time)
);

create table gh_user (
  `username` varchar(255) not null,

  -- Userinfo section
  `email` varchar(255),
  `ghid` bigint,
  `userinfo_expire` datetime not null default "1970-01-01 00:00:00",

  -- MD section
  `md` mediumtext,
  `user_config` mediumtext,
  `md_expire` datetime not null default "1970-01-01 00:00:00",
  primary key (`username`),
  index by_email (`email`),
  index by_ghid (`ghid`)
);
