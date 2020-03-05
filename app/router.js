'use strict'

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app
  router.get('/', controller.home.index)
  router.get('/student/exam/getExamList', controller.exam.getExamList)
  router.get('/student/exam/getExamInfo', controller.exam.getExamInfo)
  router.get('/student/exam/getExamineeInfo', controller.exam.getExamineeInfo)
  router.get('/student/account/getPublicKey', controller.account.getPublicKey)
  router.post('/student/account/login', controller.account.login)
  router.post('/student/account/userPasswordModify', controller.account.userPasswordModify)
  router.get('/student/topic/getTopicList', controller.topic.getTopicList)
  router.get('/student/topic/getTopicInfo', controller.topic.getTopicInfo)
  router.post('/student/operation/topicSubmit', controller.operation.topicSubmit)
  router.get('/student/operation/getProgramStatus', controller.operation.getProgramStatus)
  router.post('/student/ide/addIDEData', controller.ide.addIDEData)
  router.get('/student/ide/getIDEData', controller.ide.getIDEData)
  router.get('/student/rank/getRankList', controller.rank.getRankList)
}
