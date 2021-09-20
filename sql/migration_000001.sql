create table questions (
  `id` bigint not null auto_increment,
  `mail_id` varchar(200),
  `question` text not null,
  `response` text,
  `published` tinyint not null default 0,
  `create_time` datetime not null,
  `respond_time` datetime,
  primary key (`id`),
  index by_mail_id (mail_id),
  index by_create_time (create_time),
  index by_respond_time (respond_time)
);

alter table questions add `client_ip` varchar(100) not null after `question`;
