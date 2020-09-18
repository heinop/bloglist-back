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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
};