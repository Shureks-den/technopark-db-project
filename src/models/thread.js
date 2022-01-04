export default class ThreadModel {
    constructor(request) {
        this.forum = request.body.forum ? request.body.forum : request.params.slug,
        this.author = request.body.author,
        this.created = request.body.created,
        this.title = request.body.title,
        this.message = request.body.message,
        this.slug = request.body.slug ? request.body.slug : undefined,
        this.votes = null,
        this.id = null
    }
}
