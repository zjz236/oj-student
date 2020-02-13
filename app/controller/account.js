'use strict'

const Controller = require('egg').Controller
const fs = require('fs')
const path = require('path')
const NodeRSA = require('node-rsa')
const ObjectID = require('mongodb').ObjectID

class AccountController extends Controller {
  async login() {
    const { ctx, app } = this
    try {
      const mongo = app.mongo.get('oj')
      let { examId, username, password } = ctx.request.body
      const pri = fs.readFileSync(path.join(__dirname, '../key/loginKey/pri.key'))
        .toString()
      const privateKey = new NodeRSA(pri)
      privateKey.setOptions({ encryptionScheme: 'pkcs1' })
      password = privateKey.decrypt(password, 'utf8')
      const result = await mongo.findOne('examinee', {
        query: {
          examId: ObjectID(examId),
          username,
          password
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
    const { ctx } = this
    try {
      const data = fs.readFileSync(path.join(__dirname, '../key/loginKey/pub.key'))
        .toString()
      ctx.body = {
        code: 1,
        msg: 'success',
        data
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
      let { oldPassword, newPassword, confirmPassword, examId } = ctx.request.body
      const { userId } = ctx
      const mongo = app.mongo.get('oj')
      const pri = fs.readFileSync(path.join(__dirname, '../key/loginKey/pri.key'))
        .toString()
      const privateKey = new NodeRSA(pri)
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
