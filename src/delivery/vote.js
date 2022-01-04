import { CODES } from '../constants.js';
import VotesRepository from '../repository/vote.js'


export default new class VotesDelivery {
    async createVote(request, reply) {
        const slug = request.params.slug;
        const response = VotesRepository.create(request.body.nickname, request.body.voice, slug);

        response.then(()=>{
            VotesRepository.getInfo(slug).then((data)=>{
                reply.code(CODES.OK).send(data);
            });
        }).catch((err)=>{
            reply.code(CODES.NOT_FOUND).send(err);
        });
    }
}
