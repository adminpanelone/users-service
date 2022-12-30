const bcrypt = require('bcryptjs');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const SALT_LENGTH = process.env.SALT_LENGTH;

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(SALT_LENGTH)
  return await bcrypt.hash(password, salt);
}