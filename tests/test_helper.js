const Blog = require('../models/blog');
const User = require('../models/user');

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    comments: [
      'very useful',
      'i like'
    ]
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    comments: [
      'complete trash',
      'could not agree more'
    ]
  },
  {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
    comments: [
      'interesting...'
    ]
  },
  {
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 10,
    comments: [
      'testing sucks'
    ]
  },
  {
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0,
    comments: []
  },
  {
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
    comments: [
      'war is awesome'
    ]
  }
];

const initialUsers = [
  {
    username: 'test1',
    name: 'TestUser1',
    passwordHash: '123123986'
  },
  {
    username: 'test2',
    name: 'TestUser2',
    passwordHash: '049875203894657'
  }
];

const nonExistingId = async () => {
  const blog = new Blog({
    title: 'willremovethissoon',
    author: 'Test Helper',
    url: 'some url',
    likes: 0
  });
  await blog.save();
  await blog.remove();

  return blog._id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map(blog => blog.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map(u => u.toJSON());
};

const test1UserId = async () => {
  const searchResult = await User.find({ username: 'test1' });
  return searchResult[0]._id.toString();
};

const test2UserId = async () => {
  const searchResult = await User.find({ username: 'test2' });
  return searchResult[0]._id.toString();
};

const getOneBlog = async () => {
  return (await Blog.findOne()).toJSON();
};

module.exports = {
  initialBlogs, initialUsers, nonExistingId,
  blogsInDb, usersInDb, test1UserId, test2UserId, getOneBlog
};