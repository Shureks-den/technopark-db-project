import  UsersRepository  from "../repository/user.js";
import { CODES, DATABASE_CODES } from "../constants.js";

export default new class UsersDelivery {

    async createUser(request, reply) {
        const nickname = request.params.nickname;
        const fullname = request.body.fullname;
        const email = request.body.email;
        const about = request.body.about;
        const response = UsersRepository.createUser(nickname, fullname, email, about);
        
        response.then((data) => {
            reply.code(CODES.CREATED).send(data);
        }).catch(err =>{
            if (err.code == DATABASE_CODES.ALREADY_EXIST) {
                UsersRepository.getUsers(nickname, email).then(data => {
                    reply.code(CODES.ALREADY_EXIST).send(data);
                    return;
                });
            }
        });
    }

    async getUserInfo(request, reply) {
        const response = UsersRepository.getUserInfo(request.params.nickname);
        response.then((data)=>{
            reply.code(CODES.OK).send(data);
        }).catch((err) =>{
            reply.code(CODES.NOT_FOUND).send(err);
        })
    }

    async updateUserInfo(request, reply) {
        const nickname = request.params.nickname;
        const fullname = request.body.fullname;
        const email = request.body.email;
        const about = request.body.about;
        const response = UsersRepository.updateUserInfo(nickname, fullname, email, about);
        
        response.then((data)=> {
            reply.code(CODES.OK).send(data);
        }).catch(err => {
            if (err.code === 0) {
                reply.code(CODES.NOT_FOUND).send(err);
                return;
            }
            reply.code(CODES.ALREADY_EXIST).send(err);
        });
    }
}