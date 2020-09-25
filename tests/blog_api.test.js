const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const Blog = require('../models/blog');
const test_helper = require('./test_helper');

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

afterAll(() => {
  mongoose.connection.close();
});