const _ = require('lodash');
const settings = require('../../config/settings');
const ClassificationModel = require('../models').Classification;
const CommentModel = require('../models').Comment;
const ReadModel = require('../models').Read;
const { getUserBasicInfo } = require('../utils/dataAsync');
const moment = require('moment');
const { read } = require('../utils/cacheUtil');

class Classification {
  constructor() {
    // super()
  }

  async getAll(req, res, next) {
    try {
      let current = req.query.current || 1;
      let pageSize = req.query.pageSize || 10;
      let keyword = req.query.keyword || '';
      let readerId = req.query.readerId || '';

      let query = { available: true };
      if (keyword) {
        query.title = { $regex: keyword, $options: 'i' };
      }

      let classifications = await ClassificationModel.aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: 'users', localField: 'userId', foreignField: 'userId', as: 'user',
          },
        },
        {
          $project: {
            userId: 1,
            title: 1,
            desc: 1,
            sort: 1,
            image: 1,
            published: 1,
            free: 1,
            price: 1,
            upCount: 1,
            downCount: 1,
            commentCount: 1,
            createdAt: 1,
            'user.avatar': 1,
            'user.accountName': 1,
          },
        },
        { $limit: Number(pageSize) },
        { $skip: Number(pageSize) * (Number(current) - 1) },
        { $sort: { upCount: -1, downCount: 1 } },
      ]);

      const totalItems = await ClassificationModel.countDocuments(query);

      if (readerId) {
        let readIdRes = await ReadModel.find({ userId: readerId }, { classificationId: 1 }).sort({
          createdAt: -1,
        });

        classifications = classifications.map(c => {
          let target = readIdRes.filter(r => {
            return r.classificationId === c._id;
          });
          if (target.length) {
            return Object.assign(c, {
              hasRead: true,
            });
          }
          return c;
        });
      }

      res.send({
        state: 'success',
        data: classifications,
        pagination: {
          totalItems,
          current: Number(current) || 1,
          pageSize: Number(pageSize) || 10,
        },
      });
    } catch (err) {
      res.status(500);
      res.send({
        state: 'error',
        stack: err && err.stack,
        message: '获取classifications失败',
      });
    }
  }

  async getTodayRecommend(req, res, next) {
    let readerId = req.query.readerId || '';
    try {
      let query = { available: true };
      let classifications = await ClassificationModel.aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: 'users', localField: 'userId', foreignField: 'userId', as: 'user',
          },
        },
        {
          $project: {
            userId: 1,
            title: 1,
            desc: 1,
            sort: 1,
            image: 1,
            published: 1,
            free: 1,
            price: 1,
            upCount: 1,
            downCount: 1,
            commentCount: 1,
            createdAt: 1,
            'user.avatar': 1,
            'user.accountName': 1,
          },
        },
        { $sort: { upCount: -1 } },
        { $skip: 0 },
        { $limit: 2 },
      ]);

      if (readerId) {
        let readIdRes = await ReadModel.find({ userId: readerId }, { classificationId: 1 }).sort({
          createdAt: -1,
        });

        classifications = classifications.map(c => {
          let target = readIdRes.filter(r => {
            return r.classificationId === c._id;
          });
          if (target.length) {
            return Object.assign(c, {
              hasRead: true,
            });
          }
          return c;
        });
      }


      res.send({
        state: 'success',
        data: classifications,
      });
    } catch (err) {
      res.status(500);
      res.send({
        state: 'error',
        stack: err && err.stack,
        message: '获取classifications失败',
      });
    }
  }

  async getAllByUserId(req, res, next) {
    try {
      let userId = req.query.userId;
      let current = req.query.current || 1;
      let pageSize = req.query.pageSize || 10;

      if (!userId || userId == 'undefined') {
        res.send({
          state: 'error',
          message: 'userId 不能为空',
        });
        return;
      }

      let query = { available: true, userId };
      let classifications = await ClassificationModel.aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: 'users', localField: 'userId', foreignField: 'userId', as: 'user',
          },
        },
        {
          $project: {
            userId: 1,
            title: 1,
            desc: 1,
            sort: 1,
            image: 1,
            published: 1,
            free: 1,
            price: 1,
            upCount: 1,
            downCount: 1,
            commentCount: 1,
            createdAt: 1,
            'user.avatar': 1,
            'user.accountName': 1,
          },
        },
        { $limit: Number(pageSize) },
        { $skip: Number(pageSize) * (Number(current) - 1) },
        { $sort: { upCount: -1, downCount: 1 } },
      ]);

      const totalItems = await ClassificationModel.countDocuments(query);

      res.send({
        state: 'success',
        data: classifications,
        pagination: {
          totalItems,
          current: Number(current) || 1,
          pageSize: Number(pageSize) || 10,
        },
      });
    } catch (err) {
      res.status(500);
      res.send({
        state: 'error',
        stack: err && err.stack,
        message: '获取个人classifications失败',
      });
    }
  }

  async getById(req, res, next) {
    try {
      let _id = req.query.id;

      if (!_id || _id == 'undefined') {
        res.send({
          state: 'error',
          message: 'id 不能为空',
        });
        return;
      }

      let query = { available: true, _id };
      let classification = await ClassificationModel.aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: 'users', localField: 'userId', foreignField: 'userId', as: 'user',
          },
        },
        {
          $project: {
            userId: 1,
            title: 1,
            desc: 1,
            sort: 1,
            image: 1,
            published: 1,
            free: 1,
            price: 1,
            upCount: 1,
            downCount: 1,
            commentCount: 1,
            createdAt: 1,
            'user.accountName': 1,
            'user.avatar': 1,
            'user.username': 1,
          },
        },
      ]);

      classification = Object.assign(classification[0], { user: classification[0].user[0] });

      let query2 = { classificationId: classification._id };
      let comments = await CommentModel.aggregate([
        {
          $match: query2,
        },
        {
          $lookup: {
            from: 'users', localField: 'userId', foreignField: 'userId', as: 'user',
          },
        },
        {
          $project: {
            attitude: 1,
            contents: 1,
            'user.userId': 1,
            'user.accountName': 1,
            'user.avatar': 1,
            'user.username': 1,
          },
        },
      ]);

      comments = comments.map(c => {
        return Object.assign(c, { user: c.user[0] });
      });

      classification = Object.assign(classification, { comments });

      res.send({
        state: 'success',
        data: classification,
      });
    } catch (err) {
      res.status(500);
      res.send({
        state: 'error',
        stack: err && err.stack,
        message: '获取个人classifications失败',
      });
    }
  }

  async addOne(req, res, next) {
    const userId = req.body.userId;

    const title = req.body.title;
    const desc = req.body.desc;
    const image = req.body.image;
    const sort = req.body.sort;

    const free = req.body.free;
    const price = req.body.price;

    if (!userId) {
      res.status(500);
      res.send({
        state: 'error',
        message: 'userId 不能为空',
      });
      return;
    }
    try {
      const classificationObj = {
        userId,

        title,
        desc,
        image,
        sort,
        free,
        price,
      };

      const newClassification = new ClassificationModel(classificationObj);
      await newClassification.save();
      res.send({
        state: 'success',
        id: newClassification._id,
      });

    } catch (err) {
      res.status(500);
      res.send({
        state: 'error',
        stack: err && err.stack,
        message: '保存数据失败:',
      });
    }
  }

  async takeOff(req, res, next) {
    const _id = req.body.id;

    if (!_id) {
      res.status(500);
      res.send({
        state: 'error',
        message: 'id 不能为空',
      });
      return;
    }

    try {
      const classification = {
        published: false,
      };
      await ClassificationModel.findOneAndUpdate({ _id }, classification, { upsert: true });
      res.send({
        state: 'success',
        message: '',
      });

    } catch (err) {
      res.status(500);
      res.send({
        state: 'error',
        stack: err && err.stack,
        message: '保存数据失败:',
      });
    }
  }
}

module.exports = new Classification();
