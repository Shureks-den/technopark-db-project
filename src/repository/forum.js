import { db } from "../db.js";

export default new class ForumsRepository {
    createForum(user, title, slug) {
        return db.one({
            text: 'INSERT INTO forums ("user", title, slug) VALUES ((SELECT nickname from "users" where nickname = $1), $2, $3) RETURNING *',
            values: [user, title, slug],
        });
    }

    getForumInfoBySlug(slug) {
        return db.one({
            text: 'SELECT slug, title, "user" FROM forums WHERE slug=$1',
            values: [slug],
        });
    }

    getForumsBySlug(slug) {
        return db.one({
            text: 'SELECT * FROM forums WHERE slug=$1',
            values: [slug],
        });
    }

    getForumUsers(slug, limit, since, desc) {
        let sortArg, limitArg, sinceArg;

        if (limit) {
            limitArg = `LIMIT ${limit}`;
        }
        if (since) {
            if (desc == 'true') {
                sinceArg = `AND f.username < '${since}'`;
                sortArg = 'DESC';
            } else {
                sinceArg = `AND f.username > '${since}'`;
                sortArg = 'ASC';
            }
        } else {
            sinceArg = '';
            if (desc == 'true') {
                sortArg = 'DESC';
            } else {
                sortArg = 'ASC';
            }
        }
        return db.any({
            text: `SELECT u.* FROM "users" as u JOIN forum_users as f ON u.id = f.userId WHERE f.forumSlug = $1 
            ${sinceArg} ORDER BY f.username ${sortArg} ${limit ? limitArg : ''};`,
            values: [slug],
        });
    }

    getIdForumsBySlug(slug) {
        return db.one({
            text: 'SELECT id FROM forums WHERE slug = $1',
            values: [slug],
        });
    }

    getForumByKey(key) {
        let text = 'SELECT id AS thread_id, forum FROM threads WHERE ';
        if (!isNaN(key)) {
            text += ' id = $1';
        } else {
            text += ' slug = $1';
        }
        return db.one({
            text: text,
            values: [key],
        });
    }

    async updateForum(users, posts, forum) {
        await db.none({
            text: `UPDATE forums SET posts=forums.posts+$1 WHERE slug=$2`,
            values: [posts.length, forum],
        })
        let text = 'INSERT INTO forum_users(userId, forumSlug, username) VALUES';
        let i = 1;
        const args = [];
        users.forEach(element => {
            text += `((SELECT id FROM users WHERE users.nickname = $${i + 1}), $${i}, $${i + 1}),`;
            i += 2;
            args.push(forum, element);
        });
        text = text.slice(0, -1);
        text += ' ON CONFLICT DO NOTHING';

        await db.none({
            text: text,
            values: args,
        });
    }

    async initForumUsers(thread) {
        const text = `
        INSERT INTO forum_users(userId, forumSlug, username) VALUES
         ((SELECT id FROM users WHERE users.nickname = $2), $1, $2) ON CONFLICT DO NOTHING`;

        return db.none({text: text, values: [thread.forum, thread.author]});
    }

}
