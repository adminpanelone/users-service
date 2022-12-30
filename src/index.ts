import {ServiceBroker, Service as MoleculerService} from 'moleculer';
import {Service, Action, Event, Method} from 'moleculer-decorators';
import SqlAdapter from 'moleculer-db-adapter-sequelize';
import Sequelize from 'sequelize';
import DbService from 'moleculer-db';
import {hashPassword} from './hashPassword';
const settingsServiceBroker = {
  nodeID: "users-1",
  transporter: "nats://localhost:4222",
  requestTimeout: 5 * 1000
};

const broker = new ServiceBroker(settingsServiceBroker);

const settingsCreateService = {
  name: "users",
  mixins: [DbService],
  adapter: new SqlAdapter("mariadb://user123:pass123@localhost:3306/adminpanel"),
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
  settings: {
    fields: ["_id", "email", "role"],
  },
};


@Service(settingsCreateService)
class UsersService extends MoleculerService {
  @Action()
  signin(ctx: any) {
    console.log(ctx)
    return Promise.resolve(ctx)
  }

  // With options
  @Action()
  async signup(ctx: any) {
    console.log("Sign UP")
    //console.log(ctx.params)
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

  // @Event()
  // 'event.name'(payload: any, sender: any, eventName: any) {
  //     //...
  // }

  // @Method
  // async test(ctx: any, route: any, req: any, res: any) {
  //   let auth = req.headers["authorization"];
  //   if (auth && auth.startsWith("Bearer")) {
  //     let token = auth.slice(7);
  //     try {
  //       const res = await broker.call('jwtauth.auth', {token: token}, {});
  //       ctx.meta.user = res;
  //       return Promise.resolve(ctx);
  //     } catch (err) {
  //       return Promise.reject(new E.UnAuthorizedError(E.ERR_INVALID_TOKEN))
  //     }
  //   } else {
  //     // No token
  //     return Promise.reject(new E.UnAuthorizedError(E.ERR_NO_TOKEN));
  //   }

  // }

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