import { db } from "../db.js";

export default new class VotesRepository {
    getInfo(slug) {
        let text = 'SELECT id, created, slug, title, forum, author, message, votes FROM threads WHERE ';
        if (!isNaN(slug)) {
            text += `id = $$${slug}$$`;
        } else {
            text += `slug = $$${slug}$$`;
        }
        return db.one({
            text: text,
        });
    }

    create(nickname, voice, slug) {
        let text = 'INSERT INTO votes (thread_id, user_id, voice) VALUES';

        if (!isNaN(slug)) {
            text += ` ($1, $2, $3)
            ON CONFLICT ON CONSTRAINT votes_user_thread_unique
            DO UPDATE SET voice = $3
            WHERE votes.thread_id = $1 AND votes.user_id = $2`;
        } else {
            text += ` (
                (SELECT id FROM threads WHERE slug=$1), $2, $3
              )
              ON CONFLICT ON CONSTRAINT votes_user_thread_unique
              DO UPDATE SET voice = $3
              WHERE votes.thread_id = (SELECT id FROM threads WHERE slug = $1)
              AND votes.user_id = $2`;
        }

        return db.none({
            text: text,
            values: [slug, nickname, voice],
        });
    }
}