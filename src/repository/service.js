import { db } from "../db.js";

export default new class ServiceRepository {
    async clear(callback) {
        const text = 'TRUNCATE TABLE forum_users, votes, posts, threads, forums, users;';
        await db.none(text);
        callback();
    }

    async status(callback) {
        const text = `SELECT (
            SELECT COUNT(*) FROM forums) AS f_count,
            (SELECT COUNT(*) FROM users) AS u_count,
            (SELECT COUNT(*) FROM threads) AS t_count,
            (SELECT COUNT(*) FROM posts) AS p_count`;
        const data = await db.one(text);
        callback({
            forum: data.f_count * 1,
            user: data.u_count * 1,
            thread: data.t_count * 1,
            post: data.p_count * 1,
        });
    }
}