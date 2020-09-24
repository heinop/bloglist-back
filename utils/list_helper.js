const _ = require('lodash');

const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => {
    return sum + blog.likes;
  }, 0);
};

const favoriteBlog = (blogs) => {
  let favorite = blogs.reduce((currFavorite, blog) => {
    return (currFavorite === null || blog.likes > currFavorite.likes)
      ? blog
      : currFavorite;
  }, null);
  return favorite !== null
    ? {
      title: favorite.title,
      author: favorite.author,
      likes: favorite.likes
    }
    : null;
};

const mostBlogs = (blogs) => {
  return _.reduce(_.countBy(blogs, 'author'), (leader, value, key) => {
    if (!leader || value > leader.blogs) {
      return {
        author: key,
        blogs: value
      };
    } else {
      return leader;
    }
  }, null);
};

const mostLikes = (blogs) => {
  const likeCounts = _.reduce(blogs, (result, current) => {
    result[current.author] = result[current.author]
      ? result[current.author] + current.likes
      : current.likes;
    return result;
  }, {});

  const likesArr = Object.keys(likeCounts).map(key => {
    return {
      author: key,
      likes: likeCounts[key]
    };
  });

  return _.maxBy(likesArr, 'likes');
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
};