const blogsRouter = require('express').Router();
const blog = require('../models/blog');
const Blog = require('../models/blog');

// Get all blogs
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

// Add new blog
blogsRouter.post('/', (request, response, next) => {
  const blog = new Blog(request.body);

  blog.save()
    .then(result => {
      response.status(201).json(result);
    })
    .catch(error => next(error));
});

module.exports = blogsRouter;