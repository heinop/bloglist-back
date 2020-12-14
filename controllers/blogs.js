const jwt = require('jsonwebtoken');
const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');

// Get all blogs
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

// Add new blog
blogsRouter.post('/', async (request, response, next) => {
  const body = request.body;
  console.log('Adding new blog:', body);

  const token = request.token;
  if (!token) {
    console.log('token missing');
    return response.status(401).json({ error: 'missing token' });
  }
  console.log('Token', token);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  console.log('Decoded token:', decodedToken);
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'invalid token' });
  }
  const user = await User.findById(decodedToken.id);

  const blog = new Blog({ user: user._id, ...request.body });
  const savedBlog = await blog.save();

  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  response.status(201).json(savedBlog.toJSON());
});

// Delete an existing blog
blogsRouter.delete('/:id', async (request, response, next) => {
  const token = request.token;
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'invalid or missing token' });
  }
  const userId = decodedToken.id;
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
  const body = request.body;
  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  };
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true });
  response.json(updatedBlog);
});

module.exports = blogsRouter;