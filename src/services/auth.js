import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

import HttpError from "../errors/http"
import HttpStatus from "http-status-codes"
import userModel from "../models/user"
import envUtils, { env } from "../utils/env"

const getUserAndToken = (dbUser) => {
  const user = dbUser.toJSON()
  const payload = { _id: user.id }
  const secret = envUtils.get(env.JwtSecret)
  const token = jwt.sign(payload, secret)
  return { user, token }
}

const authService = {
  signUp: async (userData) => {
    const preexistingUser = await userModel.findOne({ name: userData.name })
    if (preexistingUser) {
      throw new HttpError(
        HttpStatus.CONFLICT,
        "Por favor ingrese otro nombre de usuario",
      )
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10)
    const user = await userModel.create({
      ...userData,
      password: hashedPassword,
    })
    return getUserAndToken(user)
  },
  logIn: async ({ name, password }) => {
    const user = await userModel.findOne({ name })
    if (!user) {
      throw new HttpError(HttpStatus.CONFLICT, "Usuario inexistente")
    }

    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) {
      throw new HttpError(HttpStatus.CONFLICT, "Contraseña incorrecta")
    }

    return getUserAndToken(user)
  },
}

export default authService
