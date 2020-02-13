'use strict'
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
module.exports = () => {
  return {
    loginToken(data, expires = 7200) {
      const exp = Math.floor(Date.now() / 1000) + expires
      const cert = fs.readFileSync(path.join(__dirname, '../key/cert/rsa_private_key.pem')) // 私钥，看后面生成方法
      return jwt.sign({ data, exp }, cert, { algorithm: 'RS256' })
    }
  }
}
