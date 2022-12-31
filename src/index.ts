import {ServiceBroker, Service as MoleculerService} from 'moleculer';
import {Service, Action, Event, Method} from 'moleculer-decorators';
import SqlAdapter from 'moleculer-db-adapter-sequelize';
import Sequelize from 'sequelize';
import DbService from 'moleculer-db';
import {hashPassword, validatePassword} from './passwordTools';
// require('dotenv').config({path: `.env.${process.env.NODE_ENV}`});
// const SALT_LENGTH = process.env.SALT_LENGTH;
const settingsServiceBroker = {
  nodeID: "users-1",
  transporter: "nats://localhost:4222",
  requestTimeout: 5 * 1000
};

const broker = new ServiceBroker(settingsServiceBroker);

const settingsCreateService = {
  name: "users",
  mixins: [DbService],
  adapter: new SqlAdapter("mariadb://glenda:putinPidor2022@localhost:3306/adminpanel"),
  model: {
    name: "user",
    define: {
      email: Sequelize.STRING,
      password: Sequelize.STRING,
      role: Sequelize.STRING,
      avatar: Sequelize.STRING,
      accessToken: Sequelize.STRING
    },
    options: {
      // Options from https://sequelize.org/docs/v6/moved/models-definition/
    }
  },
  // settings: {
  //   fields: ["_id", "email", "role", "password"],
  // },
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
      const generateAccessToken = await broker.call('jwtauth.generateAccessToken', {id: res[0].id, email: res[0].email, role: res[0].role}, {});
      return Promise.resolve(generateAccessToken)
    }

    return Promise.resolve('Not exist')
  }

  // With options
  @Action()
  async register(ctx: any) {
    const password = await hashPassword(ctx.params.password);
    const newUser = {
      email: ctx.params.email,
      password: password,
      role: 'User'
    }
    const [res, metadata] = await this.adapter.db.query(`SELECT email FROM users WHERE email = '${ctx.params.email}' LIMIT 1`)

    if (!res.length) {
      await broker.call("users.create", newUser)
    } else {
      return Promise.reject("Exist")
    }

    return Promise.resolve("New user created")
  }

  @Action()
  async getAll(ctx: any) {
    const users = await broker.call("users.find")
    return Promise.resolve(users);
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