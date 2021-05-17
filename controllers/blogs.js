const jwt = require('jsonwebtoken');
const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');

// Get all blogs
blogsRouter.get('/', async (request, response) => {
  //const userToken = authenticate(request, response);

  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

// Add new blog
blogsRouter.post('/', async (request, response, next) => {
  const userToken = authenticate(request, response);

  const body = request.body;
  console.log('Adding new blog:', body);

  const user = await User.findById(userToken.id);

  const blog = new Blog({ user: user._id, ...request.body });
  let savedBlog = await blog.save();

  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  await savedBlog.populate('user', { username: 1, name: 1 }).execPopulate();

  response.status(201).json(savedBlog.toJSON());
});

// Delete an existing blog
blogsRouter.delete('/:id', async (request, response, next) => {
  const userToken = authenticate(request, response);

  const userId = userToken.id;
  const blog = await Blog.findById(request.params.id);

  if (blog.user.toString() === userId.toString()) {
    await Blog.findByIdAndRemove(request.params.id);
    response.status(204).end();
  } else {
    return response.status(401).json({ error: 'user can only delete their own blogs' });
  }
});

// Update an existing blog
blogsRouter.put('/:id', async (request, response, next) => {
  authenticate(request, response);

  const body = request.body;
  console.log('Updating blog:', body);

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: body.user
  };
  const updatedBlog = await Blog
    .findByIdAndUpdate(request.params.id, blog, { new: true })
    .populate('user', { username: 1, name: 1 });
  response.json(updatedBlog.toJSON());
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

module.exports = blogsRouter;