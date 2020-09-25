const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const Blog = require('../models/blog');
const test_helper = require('./test_helper');
const blogsRouter = require('../controllers/blogs');

beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(helper.initialBlogs);
});

const api = supertest(app);

test('blogs are returned as JSON', async () => {
  await api.get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/);
});

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/);

  expect(response.body.length).toBe(helper.initialBlogs.length);
});

test('a specific blog is within returned blogs', async () => {
  const response = await api.get('/api/blogs');
  const titles = response.body.map(blog => blog.title);

  expect(titles).toContain('Canonical string reduction');
});

test('returned blogs are identified by id field', async () => {
  const response = await api.get('/api/blogs');
  for (let blog of response.body) {
    expect(blog.id).toBeDefined();
  }
});

test('a new blog can be added to database', async () => {
  const newBlog = {
    title: 'My first test blog',
    author: 'Unit Tester',
    url: 'unit.test.url',
    likes: 1
  };
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/);

  const blogsInEnd = await helper.blogsInDb();

  expect(blogsInEnd.length).toBe(helper.initialBlogs.length + 1);
  expect(blogsInEnd.map(blog => blog.title)).toContain('My first test blog');
});

test('if a new blog has no likes a default value of 0 is set', async () => {
  const newBlog = {
    title: 'My first test blog',
    author: 'Unit Tester',
    url: 'unit.test.url'
  };
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/);

  const blogsInEnd = await helper.blogsInDb();

  expect(blogsInEnd.length).toBe(helper.initialBlogs.length + 1);
  const addedBlog = blogsInEnd.find(b => b.title === 'My first test blog');
  expect(addedBlog.likes).toBe(0);
});

test('adding a new blog that is missing title results in http 400', async () => {
  const newBlog = {
    author: 'Unit Tester',
    url: 'unit.test.url',
    likes: 3
  };
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400);

  const blogsInEnd = await helper.blogsInDb();
  expect(blogsInEnd.length).toBe(helper.initialBlogs.length);
});

test('adding a new blog that is missing url results in http 400', async () => {
  const newBlog = {
    title: 'My first test blog',
    author: 'Unit Tester',
    likes: 3
  };
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400);

  const blogsInEnd = await helper.blogsInDb();
  expect(blogsInEnd.length).toBe(helper.initialBlogs.length);
});

test('deleting a blog is possible using a valid id', async () => {
  const blogsAtStart = await helper.blogsInDb();
  const id = blogsAtStart[0].id;

  await api
    .delete(`/api/blogs/${id}`)
    .expect(204);

  const blogsInEnd = await helper.blogsInDb();
  expect(blogsInEnd.length).toBe(helper.initialBlogs.length - 1);
});

afterAll(() => {
  mongoose.connection.close();
});