CREATE extension IF NOT EXISTS CITEXT;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS forums CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS forum_users CASCADE;
DROP TABLE IF EXISTS votes CASCADE;

CREATE TABLE users (
    id          SERIAL  UNIQUE,
    nickname    CITEXT  NOT NULL PRIMARY KEY,
    email       CITEXT  NOT NULL UNIQUE,
    fullname    TEXT    NOT NULL,
    about       TEXT    NOT NULL
);

CREATE TABLE forums (
    id      SERIAL,
    slug    CITEXT          NOT NULL PRIMARY KEY,
    title   TEXT            NOT NULL,
    "user"  CITEXT          NOT NULL,
    posts   INT             NOT NULL DEFAULT 0,
    threads INT             NOT NULL DEFAULT 0 
);

CREATE TABLE threads (
    id      SERIAL          PRIMARY KEY,
    slug    CITEXT          UNIQUE,
    title   TEXT            NOT NULL,
    author  CITEXT          NOT NULL REFERENCES users(nickname),
    forum   CITEXT          NOT NULL REFERENCES forums(slug),
    message TEXT            NOT NULL,
    votes   INT DEFAULT 0   NOT NULL,
    created TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE posts (
    id          SERIAL      PRIMARY KEY,
    parent_id   INTEGER,
    path        INTEGER ARRAY,
    author      CITEXT      NOT NULL REFERENCES users(nickname),
    forum_slug  CITEXT      NOT NULL,
    thread_id   INT         NOT NULL,
    message     TEXT        NOT NULL,
    edited      BOOLEAN     DEFAULT FALSE,
    created  TIMESTAMP WITH TIME ZONE DEFAULT now()
);


CREATE TABLE forum_users (
    userId              INT REFERENCES users(id),
    forumSlug CITEXT    NOT NULL,
    username CITEXT     NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
  user_id   CITEXT REFERENCES users(nickname)   NOT NULL,
  thread_id INT REFERENCES threads(id)          NOT NULL,
  voice     INT                                 NOT NULL
);

ALTER TABLE ONLY votes ADD CONSTRAINT votes_user_thread_unique UNIQUE (user_id, thread_id);

-- счетчик воутов
CREATE OR REPLACE FUNCTION vote_insert()
  RETURNS TRIGGER AS $vote_insert$
    BEGIN
        UPDATE threads
        SET votes = votes + NEW.voice
        WHERE id = NEW.thread_id;
        RETURN NULL;
    END;
$vote_insert$  LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vote_insert ON votes;
CREATE TRIGGER vote_insert AFTER INSERT ON votes FOR EACH ROW EXECUTE PROCEDURE vote_insert();

CREATE OR REPLACE FUNCTION vote_update() RETURNS TRIGGER AS $vote_update$
BEGIN
  IF OLD.voice = NEW.voice
  THEN
    RETURN NULL;
  END IF;
  UPDATE threads
  SET
    votes = votes + CASE WHEN NEW.voice = -1
      THEN -2
        ELSE 2 END
  WHERE id = NEW.thread_id;
  RETURN NULL;
END;
$vote_update$ LANGUAGE  plpgsql;

DROP TRIGGER IF EXISTS vote_update ON votes;
CREATE TRIGGER vote_update AFTER UPDATE ON votes FOR EACH ROW EXECUTE PROCEDURE vote_update();

-- путь в посте
CREATE OR REPLACE FUNCTION path() RETURNS TRIGGER AS $path$
    DECLARE
        parent_path INT[];
        parent_thread_id INT;
    BEGIN
        IF (NEW.parent_id is null ) THEN
             NEW.path := NEW.path || NEW.id;
        ELSE
                     SELECT path, thread_id FROM posts
            WHERE id = NEW.parent_id  INTO parent_path, parent_thread_id;
        IF parent_thread_id != NEW.thread_id THEN
            raise exception 'error228' using errcode = '00409';
        end if;
        NEW.path := NEW.path || parent_path || NEW.id;
        END IF;

        RETURN NEW;
    END;

$path$ LANGUAGE  plpgsql;

DROP TRIGGER IF EXISTS path_trigger ON posts;
CREATE TRIGGER path_trigger BEFORE INSERT ON posts FOR EACH ROW EXECUTE PROCEDURE path();


-- счетчик тредов в форуме
CREATE OR REPLACE FUNCTION threads_forum_counter()
  RETURNS TRIGGER AS $threads_forum_counter$
    BEGIN
      UPDATE forums
        SET threads = threads + 1
          WHERE slug = NEW.forum;
      RETURN NULL;
    END;
$threads_forum_counter$  LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS threads_forum_counter ON threads;
CREATE TRIGGER threads_forum_counter AFTER INSERT ON threads FOR EACH ROW EXECUTE PROCEDURE threads_forum_counter();