import { db } from "../db.js";

export default new class PostsRepository {
    createPost(thread, users, posts) {
        let text = 'INSERT INTO posts (edited, author, message, thread_id, parent_id, forum) VALUES ';
        const args = [];
        let i = 1;
        posts.forEach(elem => {
            users.push(elem.author);
            if (elem.parent == null) {
                text += `(FALSE, $${i}, $${i + 1}, $${i + 2}, NULL, $${i + 3}),`;
                args.push(elem.author, elem.message, thread.thread_id, thread.forum);
            } else {
                text += `(FALSE, $${i}, $${i + 1}, (SELECT (CASE WHEN EXISTS 
                    ( SELECT id FROM posts p WHERE p.id=$${i + 3} AND p.thread_id=$${i + 2}) 
                    THEN $${i + 2} ELSE NULL END)), $${i + 3}, $${i + 4}),`;
                i++;
                args.push(elem.author, elem.message, thread.thread_id, elem.parent, thread.forum);
            }
            i+= 4;
        });
        text = text.slice(0, -1);
        text += ' RETURNING author, id, created, thread_id AS thread, parent_id AS parent, forum, message';
        return db.any({
            text: text, 
            values: args
        });
    }

    getPostInfo(id) {
        return db.one({
            text: `SELECT id, parent_id AS parent, thread_id AS thread,
             message, edited AS "isEdited", created, forum, author FROM posts WHERE id = $$${id}$$`,
        });
    }

    updatePost(message, id) {
        const args = [];
        let text;
        
        if (message == undefined) {
            text = 'SELECT id, author, message, created, forum, thread_id AS thread FROM posts WHERE id=$1';
        } else {
            text = `UPDATE posts SET edited = message <> $1,
            message = $1 WHERE id = $2 RETURNING id, message, author, created, forum, parent_id AS parent, thread_id AS thread, edited AS "isEdited"`;
            args.push(message);
        }
        args.push(id);

        return db.one({
            text: text, 
            values: args
        });
    }

    getRelated(user, thread, forum, id) {
        let query1 = `SELECT posts.id AS pid,
        posts.parent_id AS post_parent,
        posts.thread_id AS post_thread,
        posts.message AS post_message,
        posts.edited AS post_is_edited,
        posts.created AS post_created,posts.forum AS post_forum,
        posts.author AS post_author,`;

        let query2 = ' FROM posts ';

        if (user != null) {
            query1 += 'U.nickname AS user_nickname, U.about AS user_about, U.fullname AS user_fullname, U.email AS user_email,';
            query2 += 'LEFT JOIN users U ON U.nickname = posts.author ';
        }
        if (thread != null) {
            query1 += `threads.author AS thread_author,
            threads.created AS thread_created,threads.votes AS thread_votes,
            threads.id AS thread_id,
            threads.title AS thread_title,
            threads.message AS thread_message,threads.slug AS thread_slug,
            threads.forum AS thread_forum,`;
            query2 += 'LEFT JOIN threads ON threads.id = posts.thread_id ';
        }
        if (forum != null) {
            query1 += 'F.slug AS forum, F.threads AS forum_threads, F.title as forum_title,F.posts AS forum_posts, F."user" AS forum_user_nickname,';
            query2 += 'LEFT JOIN forums F ON F.slug = posts.forum ';
        }
        query2 += ' WHERE posts.id = $1';
        const text = query1.slice(0, -1) + query2;

        return db.one({
            text: text,
            values: [id]
        });
    }

    getPostsByIDSortingFlat(limit, since, desc, id) {
        let text;
        let args = [id];
        let i = 2;
        let flag = false;
        text = `
        SELECT id, thread_id AS thread, created,
        message, parent_id AS parent, author, forum FROM
        (SELECT * FROM posts WHERE thread_id = $1 `;
        if (since) {
            if (desc === 'true') {
                text += ` AND id < $${i++}`;
            } else {
                text += ` AND id > $${i++}`;
            }
            args.push(since);
        }
        text += ' ) p ';
        if (desc === 'true') {
            text += ' ORDER BY created DESC, id DESC ';
        } else {
            text += ' ORDER BY created, id  ';
        }

        if (limit) {
            text += ` LIMIT $${i++}`;
            args.push(limit);
        }
        return db.any({text: text, values: args});
    }

    getPostsByIDSortingTree(limit, since, desc, id) {
        let text;
        let args = [id];
        let i = 2;
        const descQuery = desc === 'true' ? 'DESC' : '';
        let sinceQuery;
        let limitSql;
        if (since) {
            sinceQuery = `
                AND (path ${desc === 'true' ? '<' : '>'}
            (SELECT path FROM posts WHERE id = $${i++})) `;
            args.push(since);
        } else {
            sinceQuery = '';
        }

        if (limit) {
            limitSql = ` LIMIT $${i++}`;
            args.push(limit);
        } else {
            limitSql = '';
        }

        text = `
        SELECT id, author, created, message, parent_id AS parent,
        forum, thread_id AS thread
        FROM posts
        WHERE thread_id = $1 ${sinceQuery}
        ORDER BY path ${descQuery}
        ${limitSql}`;
        return db.any({text: text, values: args});
    }

    getPostsByIDSortringParent(limit, since, desc, id) {
        let text = `
        SELECT author, created, forum, id, edited,
        message, parent_id AS parent, thread_id AS thread
        FROM posts
        WHERE path[1] IN (
        SELECT id FROM posts`;
        let args = [id];
        let i = 2;
        const descQuery = desc === 'true' ? 'DESC' : '';
        let sinceQuery;
        let limitSql;
        if (since == undefined) {
            sinceQuery = '';
        } else {
            sinceQuery = `
            AND id ${desc === 'true' ? '<' : '>'} (SELECT path[1] FROM posts WHERE id = $${i++})`;
            args.push(since);
        }

        if (limit == undefined) {
            limitSql = '';
        } else {
            limitSql = `LIMIT $${i++}`;
            args.push(limit);
        }

        text += ` WHERE thread_id=$1 AND parent_id IS NULL
        ${sinceQuery}
        ORDER BY id ${descQuery}
        ${limitSql}
        ) AND thread_id=$1
        ORDER BY path[1] ${descQuery}, path;`

        return db.any({text: text, values: args});
    }
}