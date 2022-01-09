import { db } from "../db.js";


export default new class ThreadsRepository {
    createThread(author, created, forum, message, title, slug) {
        const text = ` INSERT INTO threads (author, created, forum, message, title, slug)
            VALUES ((SELECT nickname FROM users WHERE nickname=$1), $2, (SELECT slug FROM forums WHERE slug=$3),
            $4, $5, $6) RETURNING author, created, forum, message, title, votes, id ${slug ? ', slug' : ''}`;

        return db.one({
            text: text,
            values: [
                author, created, forum, message, title, slug],
        });
    }

    getThreadsBySlug(slug) {
        return db.one({
            text: 'SELECT * FROM threads WHERE slug=$1',
            values: [slug],
        });
    }

    getThreadsIdBySlug(slug) {
        return db.one({
            text: 'SELECT id FROM threads WHERE slug=$1',
            values: [slug],
        }); 
    }

    getInfo(slug) {
        let res = 'slug = $1';
        if (!isNaN(slug)) {
            res = ' id = $1';
        }
        return db.one({
            text: `SELECT author, created, forum, id, message, votes, slug, title FROM threads 
            WHERE ${res}`,
            values: [slug],
        })
    }

    getThreadsID(id) {
        return db.one({
            text: 'SELECT threads.id FROM threads WHERE threads.id = $1',
            values: [id],
        })
    }

    getThreads(desc, limit, since, slug) {
        let sortArg, limitArg, sinceArg;
        
        if (limit) {
            limitArg = `LIMIT ${limit}`;
        }

        if (since) {
            if (desc === 'true') {
                sinceArg = `AND created <= '${since}'`;
                sortArg = 'DESC';
            } else {
                sinceArg = `AND created >= '${since}'`;
                sortArg = 'ASC';
            }
        } else {
            sinceArg = '';
            if (desc === 'true') {
                sortArg = 'DESC';
            } else {
                sortArg = 'ASC';
            }
        }

        return db.any({
            text: `SELECT * FROM threads WHERE forum=$1 ${sinceArg} ORDER BY created ${sortArg} ${limit ? limitArg : ''};`,
            values: [slug]
        });
    }

    updateThread(title, message, slug) {
        let text;
        const args = [];
        let countArgs = 1;
        if (title == undefined && message == undefined) {
            text = `SELECT created, id, title,
            slug, message, author,
            forum FROM threads WHERE `;
            if (!isNaN(slug)) {
                text += 'id = $1';
            } else {
                text += 'slug = $1';
            }
            args.push(slug);
        } else {
            text = 'UPDATE threads SET ';
            if (title) {
                text += `title = $${countArgs++},`;
                args.push(title);
            }
            if (message) {
                text += `message = $${countArgs++},`;
                args.push(message);
            }
            text = text.slice(0, -1);
            if (!isNaN(slug)) {
                text += ` WHERE id = $${countArgs++} RETURNING created, id, title,slug, message,author, forum`;
            } else {
                text += ` WHERE slug = $${countArgs++} RETURNING created, id, title, slug, message, author, forum`;
            }
            args.push(slug);
        }

        return db.one({
            text: text,
            values: args,
        });
    }
};
