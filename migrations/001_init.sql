create table if not exists users (
  username      text primary key,
  display_name  text not null,
  created_at    timestamptz not null,
  claimed_at    timestamptz,
  password      text,
  invite_code   text unique,
  interests     jsonb not null default '[]'::jsonb
);

create table if not exists questions (
  id                    text primary key,
  username              text not null references users(username) on delete cascade,
  difficulty            text not null,
  medium                text not null,
  topic                 text not null,
  question              text not null,
  answer_key            text not null,
  user_answer           text,
  result                text,
  thoughtfulness_score  int,
  image_path            text,
  grade                 text,
  status                text not null default 'pending',
  created_at            timestamptz not null,
  graded_at             timestamptz
);

create index if not exists questions_username_created_at
  on questions (username, created_at desc);
