const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const Blog = require('../models/blog');
const test_helper = require('./test_helper');
const blogsRouter = require('../controllers/blogs');

const api = supertest(app);

describe('when there are already some blogs in db', () => {

  beforeEach(async () => {
    await Blog.deleteMany({});
    await Blog.insertMany(helper.initialBlogs);
  });

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

  describe('adding a new blog to database', () => {

    test('can be done using a valid blog object', async () => {
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

    test('adds a default value of 0 to likes if no value is provided', async () => {
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

    test('fails with http 400 if new blog has no title', async () => {
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

    test('fails with http 400 if new blog has no url', async () => {
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

  });

  describe('deleting an existing blog', () => {

    test('is possible using a valid id', async () => {
      const blogsAtStart = await helper.blogsInDb();
      const id = blogsAtStart[0].id;

      await api
        .delete(`/api/blogs/${id}`)
        .expect(204);

      const blogsInEnd = await helper.blogsInDb();
      expect(blogsInEnd.length).toBe(helper.initialBlogs.length - 1);
    });

    test('fails with http 404 when id is valid but not found in database', async () => {
      await api
        .delete(`/api/blogs/${helper.nonExistingId}`)
        .expect(400);
    });

    test('fails with http 400 when id is invalid', async () => {
      const invalidId = 12345;
      await api
        .delete(`/api/blogs/${invalidId}`)
        .expect(400);
    });

  });

  describe('updating an existing blog', () => {

    test('is possible with valid blog object', async () => {
      const blogsAtStart = await helper.blogsInDb();
      const blogToUpdate = { ...blogsAtStart[0] };
      blogToUpdate.likes = blogToUpdate.likes + 10;

      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(blogToUpdate)
        .expect(200);

      const updatedBlog = response.body;

      expect(updatedBlog.likes).toBe(blogsAtStart[0].likes + 10);
      expect(updatedBlog.title).toBe(blogsAtStart[0].title);
    });

    test('fails with http 404 when id is valid but not found in database', async () => {
      await api
        .put(`/api/blogs/${helper.nonExistingId}`)
        .expect(400);
    });

    test('fails with http 400 when id is invalid', async () => {
      const invalidId = 12345;
      await api
        .put(`/api/blogs/${invalidId}`)
        .expect(400);
    });

  });
});

afterAll(() => {
  mongoose.connection.close();
});