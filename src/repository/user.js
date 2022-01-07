import { db } from "../db.js";

export default new class UsersRepository {
    createUser(user) {
        return db.one({
            text: 'INSERT INTO users (nickname, fullname, email, about) VALUES ($1, $2, $3, $4) RETURNING *',
            values: [user.nickname, user.fullname, user.email, user.about],
        });
    }

    getUsers(nickname, email) {
        return db.any({
            text: 'SELECT * FROM users WHERE nickname=$1 OR email=$2;',
            values: [nickname, email],
        });
    }

    getUserInfo(nickname) {
        return db.one({
            text: 'SELECT about, email, nickname, fullname FROM users WHERE nickname=$1',
            values: [nickname],
        });
    }

    updateUserInfo(user) {
        let text = 'UPDATE users SET ';
        if (user.fullname != undefined) {
            text += `fullname = $$${user.fullname}$$, `;
        } else {
            text += `fullname = fullname, `;
        }
        if (user.email != undefined) {
            text += `email = $$${user.email}$$, `;
        } else {
            text += `email = email, `;
        }
        if (user.about != undefined) {
            text += `about = $$${user.about}$$ `;
        } else {
            text += `about = about `;
        }
        text += `WHERE nickname = $$${user.nickname}$$ RETURNING *`;
        return db.one({
            text:text,
        });
    }
};
