import {ServiceBroker, Service as MoleculerService} from 'moleculer';
import {Service, Action, Event, Method} from 'moleculer-decorators';
import SqlAdapter from 'moleculer-db-adapter-sequelize';
import Sequelize from 'sequelize';
import DbService from 'moleculer-db';
import NotFoundError from './CustomErrors/NotFoundError';
import {hashPassword, validatePassword} from './passwordTools';
require('dotenv').config({path: `.env.${process.env.NODE_ENV}`});
const MARIADB_URI = String(process.env.MARIADB_URI);
const settingsServiceBroker = {
  nodeID: "users-1",
  transporter: "nats://localhost:4222",
  requestTimeout: 5 * 1000
};

const broker = new ServiceBroker(settingsServiceBroker);

const settingsCreateService = {
  name: "users",
  mixins: [DbService],
  adapter: new SqlAdapter(MARIADB_URI),
  model: {
    name: "user",
    define: {
      email: Sequelize.STRING,
      password: Sequelize.STRING,
      roles: Sequelize.STRING,
      avatar: Sequelize.STRING,
      accessToken: Sequelize.STRING,
      firstName: Sequelize.STRING,
      lastName: Sequelize.STRING
    },
    options: {
      // Options from https://sequelize.org/docs/v6/moved/models-definition/
    }
  },
};

@Service(settingsCreateService)
class UsersService extends MoleculerService {
  @Action()
  async login(ctx: any) {
    const [res, metadata] = await this.adapter.db.query(`SELECT * FROM users WHERE email = '${ctx.params.email}' LIMIT 1`)
    if (res.length) {
      const hash = res[0].password
      const validPassword = await validatePassword(ctx.params.password, hash);
      if (!validPassword) return new Error('Password is not correct');
      const generateAccessToken = await broker.call('jwtauth.generateAccessToken', {id: res[0].id, email: res[0].email}, {});
      return Promise.resolve(generateAccessToken)
    }
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  @Action()
  async register(ctx: any) {
    const password = await hashPassword(ctx.params.password);
    const newUser = {
      email: ctx.params.email,
      password: password,
      firstName: ctx.params.firstName,
      lastName: ctx.params.lastName,
      roles: 'USER'
    }
    const [res, metadata] = await this.adapter.db.query(`SELECT email FROM users WHERE email = '${ctx.params.email}' LIMIT 1`)

    interface INewUser {
      id: number,
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      roles: string,
      updatedAt: string,
      createdAt: string,
      _id: string | undefined
    }
    let result: any = null;

    if (!res.length) {
      const _newUser: INewUser = await broker.call("users.create", newUser)
      result = {
        email: _newUser.email,
        firstName: _newUser.firstName,
        lastName: _newUser.lastName,
        roles: _newUser.roles,
      }
    }
    if (res.length) {
      ctx.meta.$statusCode = 409;
      return Promise.resolve({
        message: 'User exist',
        code: 409,
        type: 'USER_EXIST',
        data: {},
      })
    }

    ctx.meta.$statusCode = 201;
    return Promise.resolve({
      message: 'User created',
      code: 201,
      type: 'USER_CREATED',
      data: {email: 'test@test.localhost', roles: 'USER'},
    })
  }

  @Action()
  async getAll(ctx: any) {
    try{
      const users = await broker.call("users.find");
      return Promise.resolve(users);
    }catch(err){
      ctx.meta.$statusCode = 500;
      return Promise.reject(err);
    }  
  }

  @Action()
  hello(ctx: any){
    ctx.meta.$statusCode = 409;
    return Promise.resolve("Hello");
  }

  started() { // Reserved for moleculer, fired when started
    console.log("Started!")
    //...
  }

  created() { // Reserved for moleculer, fired when created
    console.log("Created")
    //...
  }

  stopped() { // Reserved for moleculer, fired when stopped
    console.log("Stopped")
    //...
  }
}

broker.createService(UsersService);
broker.start();