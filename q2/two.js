const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const TEST_SERVER_URL = 'http://20.244.56.144/evaluation-service';

// Data structures to store and manage data efficiently
const users = new Map();
const posts = new Map();
const commentCounts = new Map();
const latestPosts = [];

// Function to fetch and update data from the test server
async function updateData() {
  try {
    // Fetch users
    const usersResponse = await axios.get(`${TEST_SERVER_URL}/users`);
    for (const [id, name] of Object.entries(usersResponse.data.users)) {
      if (!users.has(id)) {
        users.set(id, { id, name, postCount: 0 });
      }
    }

    // Fetch posts for each user
    for (const userId of users.keys()) {
      const postsResponse = await axios.get(`${TEST_SERVER_URL}/users/${userId}/posts`);
      for (const post of postsResponse.data.posts) {
        if (!posts.has(post.id)) {
          posts.set(post.id, post);
          users.get(userId).postCount++;
          commentCounts.set(post.id, 0);
          latestPosts.unshift(post);
          if (latestPosts.length > 5) latestPosts.pop();
        }

        // Fetch comments for each post
        const commentsResponse = await axios.get(`${TEST_SERVER_URL}/posts/${post.id}/comments`);
        const commentCount = commentsResponse.data.comments.length;
        commentCounts.set(post.id, commentCount);
      }
    }
  } catch (error) {
    console.error('Error updating data:', error.message);
  }
}

// API endpoint for top users
app.get('/users', (req, res) => {
  const topUsers = Array.from(users.values())
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5);
  res.json(topUsers);
});

// API endpoint for top/latest posts
app.get('/posts', (req, res) => {
  const { type } = req.query;

  if (type === 'popular') {
    const maxComments = Math.max(...commentCounts.values());
    const popularPosts = Array.from(posts.values())
      .filter(post => commentCounts.get(post.id) === maxComments);
    res.json(popularPosts);
  } else if (type === 'latest') {
    res.json(latestPosts);
  } else {
    res.status(400).json({ error: 'Invalid type parameter' });
  }
});

// Start the server and update data periodically
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  updateData();
  setInterval(updateData, 60000); // Update data every minute
});
