import { CODES, DATABASE_CODES } from '../constants.js';
import PostsRepository from '../repository/post.js';
import ForumsRepository from '../repository/forum.js';

export default new class PostsDelivery {
    async createPost(request, reply) {
        const posts = request.body;
        const response = ForumsRepository.getForumByKey(request.params.slug);

        response.then((data)=>{
            if (posts.length == 0) {
                reply.code(CODES.CREATED).send([]);
                return;
            }
            if (data.length == 0) {
                reply.code(CODES.NOT_FOUND).send([]);
                return;
            }
            const users = [];
            PostsRepository.createPost(data, users, posts).then(async (res)=>{
                await ForumsRepository.updateForum(users, posts, data.forum);
                reply.code(CODES.CREATED).send(res);
            }).catch((err)=>{
                if (err.code === DATABASE_CODES.NOT_NULL) {
                    reply.code(CODES.ALREADY_EXIST).send(err);
                }
                reply.code(CODES.NOT_FOUND).send(err);
            });
        }).catch((err)=>{
            reply.code(CODES.NOT_FOUND).send(err);
        });
    }

    async getInfo(request, reply) {
        const id = request.params.slug;
        const related = request.query.related;

        let userRelated;
        let forumRelated;
        let threadRelated;

        if (!related) {
            PostsRepository.getPostInfo(id).then((data) => {
                reply.code(CODES.OK).send({post: data});
            }).catch((err) => {
                reply.code(CODES.NOT_FOUND).send(err);
            });
            return;
        } else {
            userRelated = related.includes('user');
            threadRelated = related.includes('thread');
            forumRelated = related.includes('forum');
        }
        
        const response = PostsRepository.getRelated(userRelated, threadRelated, forumRelated, id);
        response.then((data)=>{
            const res = {};
            res.post = PostsDelivery.#post(data);
            if (userRelated) {
                res.author = PostsDelivery.#user(data);
            }
            if (threadRelated) {
                res.thread = PostsDelivery.#thread(data);
            }
            if (forumRelated) {
                res.forum = PostsDelivery.#forum(data);
            }
            reply.code(CODES.OK).send(res);
        }).catch((err) => {
            reply.code(CODES.NOT_FOUND).send(err);
        });
    }

    async updatePost(request, reply) {
        const response = PostsRepository.updatePost(request.body.message, request.params.id);
        response.then((data)=> {
            if (data.length == 0) {
                reply.code(CODES.NOT_FOUND).send({});
                return;
            }
            reply.code(CODES.OK).send(data);
        }).catch((err)=>{
            if (err.code == 0) {
                reply.code(CODES.NOT_FOUND).send(err);
                return;
            }
            reply.code(CODES.ALREADY_EXIST).send(err);
        });
    }

    static #post(data) {
        return {
            author: data.post_author,
            id: data.pid,
            thread: data.post_thread,
            parent: data.post_parent,
            forum: data.post_forum_slug,
            message: data.post_message,
            isEdited: data.pisEdited,
            created: data.post_created,
        };
    }

    static #user(data) {
        return {
            nickname: data.user_nickname,
            about: data.user_about,
            fullname: data.user_fullname,
            email: data.user_email,
        };
    }

    static #forum(data) {
        return {
            threads: data.forum_threads,
            posts: data.forum_posts,
            title: data.forum_title,
            user: data.forum_user_nickname,
            slug: data.forum_slug,
        };
    }

    static #thread(data) {
        return {
            forum: data.thread_forum_slug,
            author: data.thread_author,
            created: data.thread_created,
            votes: data.thread_votes,
            id: data.thread_id,
            title: data.thread_title,
            message: data.thread_message,
            slug: data.thread_slug,
        }
    }
}
