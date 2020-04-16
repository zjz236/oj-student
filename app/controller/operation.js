'use strict'

const Controller = require('egg').Controller
const ObjectID = require('mongodb').ObjectID

class OperationController extends Controller {
  async topicSubmit() {
    const { ctx, app } = this
    try {
      const { topicType, answer, examId } = ctx.request.body
      const { userId } = ctx
      const mongo = app.mongo.get('oj')
      const result = await mongo.findOne('examList', {
        query: {
          _id: ObjectID(examId)
        }
      })
      if (new Date() > new Date(result.finishTime)) {
        return ctx.body = {
          code: 0,
          msg: '考试已结束'
        }
      }
      if (new Date() < new Date(result.startTime)) {
        return ctx.body = {
          code: 0,
          msg: '考试为考试'
        }
      }
      const deleteFilter = {
        examTFAnswer: { examId: ObjectID(examId), userId: ObjectID(userId) },
        examSelectAnswer: { examId: ObjectID(examId), userId: ObjectID(userId) },
        examGapAnswer: { examId: ObjectID(examId), userId: ObjectID(userId), topicId: ObjectID(answer[0].topicId) },
        examProgramAnswer: { examId: ObjectID(examId), userId: ObjectID(userId), topicId: ObjectID(answer[0].topicId) }
      }
      await mongo.deleteMany(topicType, {
        filter: deleteFilter[topicType]
      })
      const status = []
      if (topicType === 'examProgramAnswer') {
        const result = await mongo.findOne('examProgramTopic', {
          query: {
            _id: ObjectID(answer[0].topicId)
          }
        })
        const { language } = await mongo.findOne('examList', {
          query: {
            _id: ObjectID(examId)
          }
        })
        const testData = await mongo.find('examProgramTestData', {
          query: {
            programId: ObjectID(answer[0].topicId)
          }
        })
        const docs = []
        for (const item of testData) {
          docs.push({
            inputFile: item.inputFile,
            outputFile: item.outputFile,
            code: answer[0].code,
            language,
            memoryLimit: result.memoryLimit,
            timeLimit: result.timeLimit,
            status: 'Queuing',
            isIDE: false
          })
        }
        const { insertedIds } = await mongo.insertMany('processResult', {
          docs
        })
        for (const insertedId in insertedIds) {
          status.push({
            resultId: insertedIds[insertedId],
            status: 'Queuing',
            errMsg: '',
            testId: testData[insertedId]._id
          })
        }
      }
      for (const item of answer) {
        item.topicId = ObjectID(item.topicId)
        item.examId = ObjectID(examId)
        item.userId = ObjectID(userId)
        if (topicType === 'examProgramAnswer') {
          item.status = status
          item.score = 0
        }
      }
      const insertResult = await mongo.insertMany(topicType, {
        docs: answer
      })
      ctx.body = {
        code: 1,
        msg: 'success',
        data: insertResult.insertedIds
      }
      if (topicType === 'examProgramAnswer') {
        const promise = []
        for (const index in status) {
          const pro = new Promise(resolve => {
            const timer = setInterval(async () => {
              const result = await mongo.findOne('processResult', {
                query: {
                  _id: ObjectID(status[index].resultId)
                }
              })
              status[index].status = result.status
              status[index].errMsg = result.errMsg
              await mongo.findOneAndUpdate('examProgramAnswer', {
                filter: {
                  topicId: ObjectID(answer[0].topicId),
                  examId: ObjectID(examId),
                  userId: ObjectID(userId)
                },
                update: {
                  $set: {
                    status
                  }
                }
              })
              if ([ 'Queuing', 'Running' ].indexOf(result.status) < 0) {
                if (result.status === 'Accepted' || result.status === 'Presentation Error') {
                  await mongo.findOneAndUpdate('examProgramAnswer', {
                    filter: {
                      topicId: ObjectID(answer[0].topicId),
                      examId: ObjectID(examId),
                      userId: ObjectID(userId)
                    },
                    update: {
                      $inc: {
                        score: 10
                      }
                    }
                  })
                }
                clearInterval(timer)
                resolve(true)
              }
            }, 200)
          })
          promise.push(pro)
        }
        if (!promise.length) return
        Promise.all(promise)
          .then(async () => {
            const scorePro = await mongo.find('examProgramAnswer', {
              query: {
                examId: ObjectID(examId),
                userId: ObjectID(userId)
              },
              projection: {
                _id: 0,
                score: 1
              }
            })
            let sum = 0
            scorePro.forEach(item => {
              sum += item.score
            })
            await mongo.findOneAndUpdate('examinee', {
              filter: {
                examId: ObjectID(examId),
                _id: ObjectID(userId)
              },
              update: {
                $set: {
                  programScore: sum
                }
              }
            })
          })
      }
    } catch (e) {
      console.error(e)
      ctx.body = {
        code: 0,
        msg: '系统异常'
      }
    }
  }

  async getProgramStatus() {
    const { ctx, app } = this
    try {
      const mongo = app.mongo.get('oj')
      const { topicId, examId } = ctx.request.query
      const { userId } = ctx
      const result = await mongo.findOne('examProgramAnswer', {
        query: {
          topicId: ObjectID(topicId),
          examId: ObjectID(examId),
          userId: ObjectID(userId)
        },
        projection: {
          status: 1,
          topicId: 1
        }
      })
      ctx.body = {
        code: 1,
        data: result,
        msg: 'success'
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

module.exports = OperationController
