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