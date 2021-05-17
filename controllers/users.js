const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usersRouter = require('express').Router();
const User = require('../models/user');

usersRouter.get('/', async (request, response) => {

  const users = await User
    .find({})
    .populate('blogs', { url: 1, title: 1, author: 1 });
  response.json(users.map(u => u.toJSON()));
});

usersRouter.post('/', async (request, response) => {
  const body = request.body;
  if (!body.password) {
    return response.status(400).json({ error: 'password required' });
  } else if (body.password.length < 3) {
    return response.status(400).json({ error: 'password min length is 3 characters' });
  }

  const saltRoounds = 10;
  const passwordHash = await bcrypt.hash(body.password, saltRoounds);

  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash
  });

  const savedUser = await user.save();
  response.json(savedUser);
});

const authenticate = (request, response) => {
  const token = request.token;
  if (!token) {
    console.log('token missing');
    return response.status(401).json({ error: 'missing token' });
  }
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'invalid token' });
  }
  return decodedToken;
};

module.exports = usersRouter;