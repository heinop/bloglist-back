const blogsRouter = require('express').Router();
const blog = require('../models/blog');
const Blog = require('../models/blog');

// Get all blogs
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

// Add new blog
blogsRouter.post('/', async (request, response, next) => {
  const blog = new Blog(request.body);

  const result = await blog.save();
  response.status(201).json(result);
});

// Delete an existing blog
blogsRouter.delete('/:id', async (request, response, next) => {
  await Blog.findByIdAndRemove(request.params.id);
  response.status(204).end();
});

module.exports = blogsRouter;