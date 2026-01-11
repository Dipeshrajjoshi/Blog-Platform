const API_BASE = "http://localhost:3000/api";
let currentUser = null;

// ----- AUTH -----
async function register() {
  const username = document.getElementById("regUsername").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  try {
    const res = await axios.post(`${API_BASE}/users/register`, { username, email, password });
    alert(res.data.message);
  } catch (err) {
    alert(err.response?.data?.error || err.message);
  }
}

async function login() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await axios.post(`${API_BASE}/users/login`, { username, password });
    currentUser = res.data.user;
    alert("Login successful! Welcome, " + currentUser.username);
    loadPosts();
  } catch (err) {
    alert(err.response?.data?.error || err.message);
  }
}

// ----- POSTS -----
async function loadPosts() {
  try {
    const res = await axios.get(`${API_BASE}/posts?sort=newest&limit=10`);
    const postsDiv = document.getElementById("posts");
    postsDiv.innerHTML = "";

    res.data.posts.forEach(post => {
      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `
        <h3>${post.title}</h3>
        <p><em>By ${post.author.username}</em></p>
        <p>${post.content}</p>
        <div class="likes">
          <span>❤️ Likes: <span id="likes-${post._id}">${post.likes}</span></span>
          <button onclick="likePost('${post._id}')">Like</button>
        </div>
        <div id="comments-${post._id}"><h4>Comments</h4></div>
        <textarea id="commentText-${post._id}" placeholder="Add a comment"></textarea>
        <button class="comment-btn" onclick="addComment('${post._id}')">Add Comment</button>
      `;
      postsDiv.appendChild(div);
      loadComments(post._id);
    });
  } catch (err) {
    console.error(err);
  }
}

async function likePost(postId) {
  try {
    const res = await axios.post(`${API_BASE}/posts/${postId}/like`);
    document.getElementById(`likes-${postId}`).innerText = res.data.likes;
  } catch (err) {
    console.error(err);
  }
}

// ----- COMMENTS -----
async function loadComments(postId) {
  try {
    const res = await axios.get(`${API_BASE}/posts/${postId}/comments`);
    const commentsDiv = document.getElementById(`comments-${postId}`);
    commentsDiv.innerHTML = "<h4>Comments</h4>";

    res.data.comments.forEach(c => {
      const div = document.createElement("div");
      div.className = "comment";
      div.innerHTML = `
        <p><strong>${c.commenter.username}</strong>: ${c.text} 
          (Likes: ${c.likes}) 
          <button onclick="likeComment('${c._id}', '${postId}')">Like</button>
        </p>
      `;
      commentsDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

async function addComment(postId) {
  if (!currentUser) return alert("Please login first!");
  const text = document.getElementById(`commentText-${postId}`).value;
  if (!text) return alert("Comment cannot be empty");

  try {
    await axios.post(`${API_BASE}/comments`, {
      text,
      commenterId: currentUser.id,
      blogPostId: postId
    });
    document.getElementById(`commentText-${postId}`).value = "";
    loadComments(postId);
  } catch (err) {
    console.error(err);
  }
}

async function likeComment(commentId, postId) {
  try {
    await axios.post(`${API_BASE}/comments/${commentId}/like`);
    loadComments(postId);
  } catch (err) {
    console.error(err);
  }
}
