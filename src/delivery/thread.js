import ThreadsRepository from '../repository/thread.js';
import ForumsRepository from '../repository/forum.js';
import PostsRepository from '../repository/post.js';
import { CODES, DATABASE_CODES } from '../constants.js';


export default new class ThreadsDelivery {
    async createThread(request, reply) {
        const forum = request.body.forum ? request.body.forum : request.params.slug;
        const author = request.body.author;
        const created = request.body.created;
        const title = request.body.title;
        const message = request.body.message;
        const slug = request.body.slug ? request.body.slug : undefined;
        const response = ThreadsRepository.createThread(author, created, forum, message, title, slug);

        response.then(async (data)=>{
            reply.code(CODES.CREATED).send(data);
        }).catch((err) => {
            if (err.code === DATABASE_CODES.ALREADY_EXIST) {
                ThreadsRepository.getThreadsBySlug(slug).then((data) => {
                    reply.code(CODES.ALREADY_EXIST).send(data);
                });
                return;
            }
            reply.code(CODES.NOT_FOUND).send(err);
        })
    }

    async getThreads(request, reply) {
        const response = ThreadsRepository.getThreads(request.query.desc, request.query.limit, request.query.since,
            request.params.slug);
        response.then((data)=>{
            if (data.length === 0) {
                ForumsRepository.getForumsBySlug(request.params.slug).then(()=>{
                    reply.code(CODES.OK).send(data);
                }).catch((err)=>{
                    reply.code(CODES.NOT_FOUND).send(err);
                });
                return;
            }
            reply.code(CODES.OK).send(data);
        }).catch((err)=>{
            reply.code(CODES.NOT_FOUND).send(err);
        });
    }

    async getPosts(request, reply) {
        const slug = request.params.slug;
        if (!isNaN(slug)) {
            getPostsID(request, reply, slug);
            return;
        } else {
            const response = ThreadsRepository.getThreadsIdBySlug(slug);
            response.then((data)=>{
                getPostsID(request, reply, data.id);
            }).catch((err)=> {
                reply.code(CODES.NOT_FOUND).send(err);
            });
        }
    }
    
    async getThreadInfo(request, reply) {
        const response = ThreadsRepository.getInfo(request.params.slug);
        response.then((data)=>{
            if (data.length === 0) {
                reply.code(CODES.NOT_FOUND).send({});
                return;
            }
            reply.code(CODES.OK).send(data);
        }).catch((err)=>{
            reply.code(CODES.NOT_FOUND).send(err);
        });
    }

    async updateThread(request, reply) {
        const response = ThreadsRepository.updateThread(request.body.title, 
            request.body.message, request.params.slug);

        response.then((data) => {
            if (data.length === 0) {
                reply.code(CODES.NOT_FOUND).send({});
                return;
            }
            reply.code(CODES.OK).send(data);
        }).catch((err) => {
            reply.code(CODES.NOT_FOUND).send(err);
        });
    }
};

function getPostsID(request, reply, id) {
    const response = PostsRepository.getPostsByID(request.query.limit,
        request.query.since, request.query.desc, request.query.sort, id);
    response.then((data)=>{
        if (data.length == 0) {
            ThreadsRepository.getThreadsID(id).then((res)=> {
                if (res.length === 0) {
                    reply.code(CODES.NOT_FOUND).send(err);
                    return;
                }
                reply.code(CODES.OK).send([]);
                return;
            }).catch((err)=>{
                reply.code(CODES.NOT_FOUND).send(err);
            });
        } else {
            reply.code(CODES.OK).send(data);
        }
    }).catch((err)=>{
        reply.code(CODES.NOT_FOUND).send(err);
    });
}
