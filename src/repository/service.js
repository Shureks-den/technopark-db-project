import { db } from "../databaseConnection/db.js";

export default new class ServiceRepository {
    clear(callback) {
        const text = 'TRUNCATE TABLE forum_users, votes, posts, threads, forums, users;';
        db.none(text).then(()=>{
            callback();
        });
    }

    status(callback) {
        const text = `SELECT (
            SELECT COUNT(*) FROM forums) AS forum_count,
            (SELECT COUNT(*) FROM users) AS user_count,
            (SELECT COUNT(*) FROM threads) AS thread_count,
            (SELECT COUNT(*) FROM posts) AS post_count`;
        db.one(text).then((data) => {
            callback({
                forum: data.forum_count * 1,
                user: data.user_count * 1,
                thread: data.thread_count * 1,
                post: data.post_count * 1,
            });
        });
    }
}