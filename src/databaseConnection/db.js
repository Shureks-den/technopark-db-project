import pgPromise from 'pg-promise';

const pgp = pgPromise();
let connect = 'postgres://technopark:technopark@localhost:5432/technopark'
export const db = pgp(connect)