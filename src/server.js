import fastifyLib from 'fastify';
import users from './delivery/user.js';
import forums from './delivery/forum.js';
import threads from './delivery/thread.js';
import service from './delivery/service.js';
import posts from './delivery/post.js';
import votes from './delivery/vote.js';

const fastify = fastifyLib();

fastify.post('/api/forum/create', forums.createForum);
fastify.get('/api/forum/:slug/details', forums.getForumInfo);
fastify.get('/api/forum/:slug/users', forums.getForumUsers);

fastify.post('/api/user/:nickname/create', users.createUser);
fastify.get('/api/user/:nickname/profile', users.getUserInfo);
fastify.post('/api/user/:nickname/profile', users.updateUserInfo);

fastify.post('/api/forum/:slug/create', threads.createThread);
fastify.get('/api/forum/:slug/threads', threads.getThreads);
fastify.get('/api/thread/:slug/details', threads.getThreadInfo);
fastify.post('/api/thread/:slug/details', threads.updateThread);
fastify.get('/api/thread/:slug/posts', threads.getPosts);

fastify.post('/api/service/clear', service.clear);
fastify.get('/api/service/status', service.status);

fastify.post('/api/thread/:slug/vote', votes.createVote);

fastify.get('/api/post/:slug/details', posts.getInfo);
fastify.post('/api/post/:id/details', posts.updatePost);
fastify.post('/api/thread/:slug/create', posts.createPost);

const start = async () => {
    fastify.addContentTypeParser('application/json', 
    { parseAs: 'buffer' },
    (req, body, done) => {
        try {
            const res = JSON.parse(body);
            done(null, res);
        } catch (e) {
            done(null, {});
        } 
    });
    await fastify.listen(5000, '0.0.0.0');
}
start();
