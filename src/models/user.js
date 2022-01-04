export default class UserModel {
    constructor(request) {
        this.nickname = request.params.nickname,
        this.fullname = request.body.fullname,
        this.email = request.body.email,
        this.about = request.body.about
    };
}
