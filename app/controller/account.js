'use strict'

const Controller = require('egg').Controller
const NodeRSA = require('node-rsa')
const ObjectID = require('mongodb').ObjectID

class AccountController extends Controller {
  async login() {
    const { ctx, app } = this
    try {
      const mongo = app.mongo.get('oj')
      let { examId, username, password, publicKey } = ctx.request.body
      const { value: certValue } = await mongo.findOneAndDelete('cert', {
        filter: {
          publicKey
        }
      })
      if (!certValue) {
        return ctx.body = {
          code: 0,
          msg: '系统异常，请重试'
        }
      }
      const privateKey = new NodeRSA(certValue.privateKey)
      privateKey.setOptions({ encryptionScheme: 'pkcs1' })
      password = privateKey.decrypt(password, 'utf8')
      const { value: result } = await mongo.findOneAndUpdate('examinee', {
        filter: {
          examId: ObjectID(examId),
          username,
          password
        },
        update: {
          $set: {
            isLogin: true
          }
        }
      })
      if (!result) {
        return ctx.body = {
          code: 0,
          msg: '用户名或密码错误'
        }
      }
      const { loginToken } = ctx.helper.util
      const token = loginToken({ username: result.username, examId, userId: result._id }, 7200)
      const { value } = await mongo.findOneAndUpdate('loginToken', {
        filter: {
          userId: ObjectID(result._id)
        },
        update: {
          $set: {
            token
          }
        }
      })
      if (!value) {
        await mongo.insertOne('loginToken', {
          doc: {
            userId: ObjectID(result._id),
            token
          }
        })
      }
      ctx.body = {
        code: 1,
        msg: 'success',
        token
      }
    } catch (e) {
      console.error(e)
      ctx.body = {
        code: 0,
        msg: '系统异常'
      }
    }
  }

  async getPublicKey() {
    const { ctx, app } = this
    try {
      const key = new NodeRSA({ b: 1024 })
      key.setOptions({ encryptionScheme: 'pkcs1' })
      const mongo = app.mongo.get('oj')
      const publicKey = key.exportKey('pkcs8-public')
      const privateKey = key.exportKey('pkcs8-private')
      const { insertedId } = await mongo.insertOne('cert', {
        doc: {
          publicKey,
          privateKey
        }
      })
      if (insertedId) {
        ctx.body = {
          code: 1,
          msg: 'success',
          data: publicKey
        }
      } else {
        ctx.body = {
          code: 0,
          msg: '系统异常'
        }
      }
    } catch (e) {
      console.error(e)
      ctx.body = {
        code: 0,
        msg: '系统异常'
      }
    }
  }

  async userPasswordModify() {
    const { ctx, app } = this
    try {
      let { oldPassword, newPassword, confirmPassword, examId, publicKey } = ctx.request.body
      const { userId } = ctx
      const mongo = app.mongo.get('oj')
      const { value: certValue } = await mongo.findOneAndDelete('cert', {
        filter: {
          publicKey
        }
      })
      if (!certValue) {
        return ctx.body = {
          code: 0,
          msg: '系统异常，请重试'
        }
      }
      const privateKey = new NodeRSA(certValue.privateKey)
      privateKey.setOptions({ encryptionScheme: 'pkcs1' })
      oldPassword = privateKey.decrypt(oldPassword, 'utf8')
      newPassword = privateKey.decrypt(newPassword, 'utf8')
      confirmPassword = privateKey.decrypt(confirmPassword, 'utf8')
      if (newPassword !== confirmPassword) {
        return ctx.body = {
          code: 0,
          msg: '两次密码不同'
        }
      }
      const { value } = await mongo.findOneAndUpdate('examinee', {
        filter: {
          _id: ObjectID(userId),
          examId: ObjectID(examId),
          password: oldPassword
        },
        update: {
          $set: {
            password: newPassword
          }
        }
      })
      if (value) {
        ctx.body = {
          code: 1,
          msg: 'success'
        }
      } else {
        ctx.body = {
          code: 0,
          msg: '原密码错误'
        }
      }
    } catch (e) {
      console.error(e)
      ctx.body = {
        code: 0,
        msg: '系统异常'
      }
    }
  }
}

module.exports = AccountController
