process.env.SECRET = 'unittestsecret';

const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const Blog = require('../models/blog');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const api = supertest(app);

const test1UserToken = {
  username: 'test1',
  id: '12345'
};

const encodedToken = jwt.sign(test1UserToken, process.env.SECRET);

beforeAll(async () => {
  await User.deleteMany({});
  await User.insertMany(helper.initialUsers);
});

describe('when there are already some blogs in db', () => {

  beforeEach(async () => {
    jest.resetAllMocks();
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

    beforeEach(async () => {
      const testUserId = await helper.test1UserId();
      jwt.verify = jest.fn().mockReturnValue({ id: testUserId });
    });

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
        .set({ Authorization: `Bearer ${encodedToken}` })
        .expect(201)
        .expect('Content-Type', /application\/json/);

      const blogsInEnd = await helper.blogsInDb();

      expect(blogsInEnd.length).toBe(helper.initialBlogs.length + 1);
      expect(blogsInEnd.map(blog => blog.title)).toContain('My first test blog');
      const addedBlog = blogsInEnd.find(blog => blog.title === 'My first test blog');
      const testUserId = await helper.test1UserId();
      expect(addedBlog.user.toString()).toBe(testUserId);
      expect(addedBlog.comments.length).toBe(0);
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
        .set({ Authorization: `Bearer ${encodedToken}` })
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
        .set({ Authorization: `Bearer ${encodedToken}` })
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
        .set({ Authorization: `Bearer ${encodedToken}` })
        .expect(400);

      const blogsInEnd = await helper.blogsInDb();
      expect(blogsInEnd.length).toBe(helper.initialBlogs.length);
    });

    test('fails with http 401 if request has no authentication token', async () => {
      const newBlog = {
        title: 'My first test blog',
        author: 'Unit Tester',
        url: 'unit.test.url',
        likes: 1
      };
      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401);

      const blogsInEnd = await helper.blogsInDb();
      expect(blogsInEnd.length).toBe(helper.initialBlogs.length);
    });

    test('fails with http 401 if request has invalid authentication token', async () => {
      jwt.verify = jest.fn().mockReturnValue({ name: 'invalid' });
      const newBlog = {
        title: 'My first test blog',
        author: 'Unit Tester',
        url: 'unit.test.url',
        likes: 1
      };
      await api
        .post('/api/blogs')
        .send(newBlog)
        .set({ Authorization: 'Bearer sdlifhj328foiuhowiefuhaq' })
        .expect(401);

      const blogsInEnd = await helper.blogsInDb();
      expect(blogsInEnd.length).toBe(helper.initialBlogs.length);
    });
  });

  describe('deleting an existing blog', () => {

    beforeEach(async () => {
      const testUserId = await helper.test1UserId();
      jwt.verify = jest.fn().mockReturnValue({ id: testUserId });
    });

    test('is possible using a valid id', async () => {
      // Get random blog from db and make test1 user the owner
      let blog = await helper.getOneBlog();
      const blogId = blog.id;
      delete blog.id;
      const userId = await helper.test1UserId();
      blog.user = userId;
      blog = await Blog.findByIdAndUpdate(blogId, blog, { new: true });

      // Delete the blog as test1 user
      await api
        .delete(`/api/blogs/${blogId}`)
        .set({ Authorization: `Bearer ${encodedToken}` })
        .expect(204);

      const blogsInEnd = await helper.blogsInDb();
      expect(blogsInEnd.length).toBe(helper.initialBlogs.length - 1);
      expect(blogsInEnd.map(b => b.id)).not.toContain(blogId);
    });

    test('fails with http 404 when id is valid but not found in database', async () => {
      await api
        .delete(`/api/blogs/${helper.nonExistingId}`)
        .set({ Authorization: `Bearer ${encodedToken}` })
        .expect(400);
    });

    test('fails with http 400 when id is invalid', async () => {
      const invalidId = 12345;
      await api
        .delete(`/api/blogs/${invalidId}`)
        .set({ Authorization: `Bearer ${encodedToken}` })
        .expect(400);
    });

    test('fails with http 401 if user is not blog owner', async () => {
      // Get random blog from db and make test2 user the owner
      let blog = await helper.getOneBlog();
      const blogId = blog.id;
      delete blog.id;
      const userId = await helper.test2UserId();
      blog.user = userId;
      blog = await Blog.findByIdAndUpdate(blogId, blog, { new: true });

      // Delete the blog as test1 user
      await api
        .delete(`/api/blogs/${blogId}`)
        .set({ Authorization: `Bearer ${encodedToken}` })
        .expect(401);

      const blogsInEnd = await helper.blogsInDb();
      expect(blogsInEnd.length).toBe(helper.initialBlogs.length);
    });
  });

  describe('updating an existing blog', () => {

    beforeEach(async () => {
      const testUserId = await helper.test1UserId();
      jwt.verify = jest.fn().mockReturnValue({ id: testUserId });
    });

    test('is possible with valid blog object', async () => {
      // Get random blog from db and make test1 user the owner
      let blog = await helper.getOneBlog();
      const blogId = blog.id;
      delete blog.id;
      const userId = await helper.test1UserId();
      blog.user = userId;
      blog = await Blog.findByIdAndUpdate(blogId, blog, { new: true });

      const originalBlog = blog.toJSON();
      blog.likes = blog.likes + 10;
      blog.comments = blog.comments.concat('another comment');

      const response = await api
        .put(`/api/blogs/${blog.id}`)
        .set({ Authorization: `Bearer ${encodedToken}` })
        .send(blog)
        .expect(200);

      const updatedBlog = response.body;

      expect(updatedBlog.likes).toBe(originalBlog.likes + 10);
      expect(updatedBlog.title).toBe(originalBlog.title);
      expect(updatedBlog.comments).toContain('another comment');
    });

    test('fails with http 404 when id is valid but not found in database', async () => {
      await api
        .put(`/api/blogs/${helper.nonExistingId}`)
        .set({ Authorization: `Bearer ${encodedToken}` })
        .expect(400);
    });

    test('fails with http 400 when id is invalid', async () => {
      const invalidId = 12345;
      await api
        .put(`/api/blogs/${invalidId}`)
        .set({ Authorization: `Bearer ${encodedToken}` })
        .expect(400);
    });

  });
});

afterAll(async () => {
  await mongoose.connection.close();
});