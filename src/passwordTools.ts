const bcrypt = require('bcryptjs');
require('dotenv').config({path: `.env.${process.env.NODE_ENV}`});
const SALT_LENGTH = Number(process.env.SALT_LENGTH);

function genSaltPromise(): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(SALT_LENGTH, function (err: any, salt: any) {
      if (err) return reject(err)
      return resolve(salt);
    }
    )
  })
}

function hashPromise(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, salt, function (err: any, hash: string) {
      if (err) return reject(err);
      return resolve(hash);
    });
  })
}

function comparePromise(plainPassword: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plainPassword, hash, function (err: any, res: any) {
      if (err) return reject(err);
      return resolve(res);
    });
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await genSaltPromise();
  return await hashPromise(password, salt);
}

export async function validatePassword(plainPassword: string, password: string): Promise<boolean> {
  return await comparePromise(plainPassword, password)
};