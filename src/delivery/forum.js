import { CODES, DATABASE_CODES } from '../constants.js';
import ForumsRepository from '../repository/forum.js'

export default new class ForumsDelivery {
    async createForum(request, reply) {
        const slug = request.body.slug;
        const response = ForumsRepository.createForum(request.body.user, request.body.title, slug);

        response.then((data) => {
            reply.code(CODES.CREATED).send(data);
        }).catch(err => {
            if (err.code === DATABASE_CODES.ALREADY_EXIST) {
                ForumsRepository.getForumBySlug(slug).then((data) => {
                    reply.code(CODES.ALREADY_EXIST).send(data);
                });
            } else {
                reply.code(CODES.NOT_FOUND).send(err);
            }
        });
    }

    async getForumInfo(request, reply) {
        const response = ForumsRepository.getForumsBySlug(request.params.slug);

        response.then((data) => {
            reply.code(CODES.OK).send(data);
        }).catch((err)=> {
            if (err.code === 0) {
                reply.code(CODES.NOT_FOUND).send(err);
            }
        });
    }

    async getForumUsers(request, reply) {
        const slug = request.params.slug;
        const response = ForumsRepository.getForumUsers(slug, request.query.limit, 
            request.query.since, request.query.desc);
                
        response.then((data) => {
            if (data.length === 0) {
                ForumsRepository.getIdForumsBySlug(slug).then((data) => {
                    if (data.length !== 0) {
                        reply.code(CODES.OK).send([]);
                        return;
                    }
                }).catch((err) => {
                    if (err.code === 0) {
                        reply.code(CODES.NOT_FOUND).send(err);
                        return;
                    }
                });
            } else {
                reply.code(CODES.OK).send(data);
            }
        }).catch(err => {
            if (err.code === 0) {
                reply.code(CODES.NOT_FOUND).send(err);
                return;
            }
        });
    }
}
