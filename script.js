
const $ = (id) => document.getElementById(id);

let currentUser = null;
let currentProfile = null;
let postsCache = [];
let profilesCache = {};
let likedPostIds = new Set();
let selectedChannel = null;
let loadingPosts = false;

const CHANNELS = {
  anime: {
    name: "⚡ Anime",
    description: "Anime discussions, characters and theories."
  },
  manga: {
    name: "📚 Manga",
    description: "Manga reviews, recommendations and theories."
  },
  gaming: {
    name: "🎮 Gaming",
    description: "Games, tips, updates and fellow players."
  },
  general: {
    name: "🌌 General Fandom",
    description: "Everything else you love about fandom."
  }
};

const accountStatus = $("account-status");
const signupForm = $("signup-form");
const loginForm = $("login-form");
const logoutButton = $("logout-button");

const profileSection = $("profile-section");
const profileForm = $("profile-form");
const profileUsername = $("profile-username");
const profileBio = $("profile-bio");
const profileFandom = $("profile-fandom");
const profilePictureInput = $("profile-picture-input");
const profilePicturePreview = $("profile-picture-preview");
const uploadPictureButton = $("upload-picture-button");
const pictureMessage = $("picture-message");
const profileMessage = $("profile-message");

const postForm = $("post-form");
const postTitle = $("post-title");
const postContent = $("post-content");
const postsFeed = $("posts-feed");
const searchInput = $("search");
const noResults = $("no-results");

let notificationList = null;

function showMessage(target, text, isError = false) {
  if (!target) return;
  target.textContent = text;
  target.style.color = isError ? "#ff7777" : "#9bffcb";
}

function makeElement(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

function makeButton(text, callback) {
  const node = makeElement("button", "", text);
  node.type = "button";
  node.addEventListener("click", callback);
  return node;
}

function addStyles() {
  if ($("fandom-nexus-extra-styles")) return;

  const style = document.createElement("style");
  style.id = "fandom-nexus-extra-styles";
  style.textContent = `
    .fn-post-card {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #27365d;
      border-radius: 18px;
      background: linear-gradient(145deg, #10172a, #0a0f1d);
      overflow-wrap: anywhere;
    }

    .fn-post-card[hidden] {
      display: none !important;
    }

    .fn-post-heading {
      margin-top: 0;
      color: #c4b5fd;
    }

    .fn-author {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 12px 0;
    }

    .fn-avatar {
      width: 46px;
      height: 46px;
      object-fit: cover;
      border-radius: 50%;
      border: 2px solid #a78bfa;
      flex-shrink: 0;
    }

    .fn-avatar-default {
      display: grid;
      place-items: center;
      background: #302343;
      font-size: 22px;
    }

    .fn-muted {
      opacity: .75;
      font-size: .88rem;
    }

    .fn-post-actions,
    .fn-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin: 14px 0;
    }

    .fn-post-actions button,
    .fn-toolbar button,
    .fn-comment-form button,
    .fn-reply-form button {
      padding: 8px 13px;
      border: 1px solid #343d69;
      border-radius: 18px;
      background: #1b2040;
      color: #d8ccff;
      cursor: pointer;
    }

    .fn-comments {
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #29304c;
    }

    .fn-comment {
      margin: 10px 0;
      padding: 10px 0;
      background: transparent;
      overflow-wrap: anywhere;
    }

    .fn-comment p {
      white-space: pre-wrap;
    }

    .fn-comment-author {
      color: #c4b5fd;
      font-weight: bold;
    }

    .fn-replies {
      margin: 10px 0 0 14px;
      padding-left: 14px;
      border-left: 2px solid #383838;
    }

    .fn-comment-form,
    .fn-reply-form {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 9px;
      margin-top: 10px;
    }

    .fn-comment-form textarea,
    .fn-reply-form textarea {
      box-sizing: border-box;
      width: 100%;
      min-height: 48px;
      padding: 10px 12px;
      color: white;
      background: #090e1b;
      border: 1px solid #30416d;
      border-radius: 10px;
      font: inherit;
    }

    .fn-comment-form button,
    .fn-reply-form button {
      align-self: flex-start;
      width: auto;
    }

    .fn-reply-button {
      display: inline-flex;
      width: auto;
      margin-top: 4px;
      padding: 5px 10px;
      color: #aeb7c5;
      background: transparent;
      border: none;
      border-radius: 18px;
      font-size: 12px;
      cursor: pointer;
    }

    .fn-reply-button:hover {
      color: white;
      background: #292d35;
    }

    .fn-notifications {
      margin: 20px 0;
      padding: 16px;
      border: 1px solid #27365d;
      border-radius: 16px;
      background: #0d1222;
    }

    .fn-notification {
      padding: 12px 4px;
      border-bottom: 1px solid #29304c;
    }

    .fn-notification.fn-unread {
      border-left: 3px solid #a78bfa;
      padding-left: 12px;
    }

    .fn-empty {
      opacity: .8;
      padding: 12px 0;
    }

    .channel-card {
      cursor: pointer;
    }

    .channel-card span {
      display: inline-block;
      margin-top: 10px;
      color: #a78bfa;
      font-weight: bold;
    }

    .channel-card.active {
      border-color: #a78bfa;
      box-shadow: 0 0 20px #7138ff35;
    }

    #channel-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin: 16px 0;
    }

    #channel-toolbar button {
      padding: 8px 13px;
      color: #d8ccff;
      background: #1b2040;
      border: 1px solid #343d69;
      border-radius: 20px;
    }

    #channel-toolbar button.active {
      color: white;
      background: #7138d4;
      border-color: #a78bfa;
    }

    #channel-heading {
      color: #a78bfa;
    }

    #post-community {
      width: 100%;
      padding: 12px;
    }

    button:disabled {
      opacity: .55;
      cursor: not-allowed;
    }
  `;

  document.head.appendChild(style);
}

addStyles();

function updatePostAccess() {
  if (postForm) postForm.hidden = !currentUser;

  const notice = $("post-login-notice");
  if (notice) notice.hidden = !!currentUser;
}

// ================================
// CHANNEL NAVIGATION
// ================================

function setupChannels() {
  const communities = $("communities");
  const postSection = $("post-section");

  if (!communities || !postSection) return;

  let heading = $("channel-heading");
  let description = $("channel-description");
  let toolbar = $("channel-toolbar");

  const feedHeading = postSection.querySelector("h2");

  if (!heading) {
    heading = makeElement("h3");
    heading.id = "channel-heading";

    if (feedHeading) {
      feedHeading.insertAdjacentElement("afterend", heading);
    } else {
      postSection.prepend(heading);
    }
  }

  if (!description) {
    description = makeElement("p");
    description.id = "channel-description";
    heading.insertAdjacentElement("afterend", description);
  }

  if (!toolbar) {
    toolbar = makeElement("div");
    toolbar.id = "channel-toolbar";
    toolbar.setAttribute("aria-label", "Choose a community channel");
    description.insertAdjacentElement("afterend", toolbar);
  }

  toolbar.replaceChildren();

  toolbar.appendChild(
    makeButton("🌌 All channels", () => selectChannel(null))
  ).dataset.channel = "all";

  for (const [key, channel] of Object.entries(CHANNELS)) {
    const button = makeButton(channel.name, () => selectChannel(key));
    button.dataset.channel = key;
    toolbar.appendChild(button);
  }

  document.querySelectorAll(".channel-card").forEach(card => {
    card.setAttribute("aria-label", `Open ${CHANNELS[card.dataset.channel]?.name || "community"} channel`);
    card.setAttribute("aria-pressed", "false");

    card.addEventListener("click", () => {
      selectChannel(card.dataset.channel);
    });

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectChannel(card.dataset.channel);
      }
    });
  });

  updateChannelUI();
}

function selectChannel(channel) {
  if (channel !== null && !CHANNELS[channel]) return;

  selectedChannel = channel;

  const selector = $("post-community");
  if (selector && channel) {
    selector.value = channel;
  }

  updateChannelUI();
  loadPosts();

  if (channel) {
    $("post-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function updateChannelUI() {
  const heading = $("channel-heading");
  const description = $("channel-description");
  const selector = $("post-community");

  if (heading) {
    heading.textContent = selectedChannel
      ? CHANNELS[selectedChannel].name
      : "🌌 All Community Channels";
  }

  if (description) {
    description.textContent = selectedChannel
      ? CHANNELS[selectedChannel].description
      : "Explore posts from every fandom community.";
  }

  document.querySelectorAll("#channel-toolbar button").forEach(button => {
    button.classList.toggle(
      "active",
      selectedChannel
        ? button.dataset.channel === selectedChannel
        : button.dataset.channel === "all"
    );
  });

  document.querySelectorAll(".channel-card").forEach(card => {
    card.classList.toggle(
      "active",
      card.dataset.channel === selectedChannel
    );

    card.setAttribute(
      "aria-pressed",
      String(card.dataset.channel === selectedChannel)
    );
  });

  if (selector && selectedChannel) {
    selector.value = selectedChannel;
  }
}

const postCommunity = $("post-community");

if (postCommunity) {
  postCommunity.addEventListener("change", () => {
    const value = postCommunity.value;

    if (CHANNELS[value]) {
      selectedChannel = value;
      updateChannelUI();
      loadPosts();
    }
  });
}

// ================================
// PROFILE HELPERS
// ================================

async function getProfile(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username, bio, favorite_fandom, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function ensureProfile(user) {
  let profile = await getProfile(user.id);
  if (profile) return profile;

  const username = user.user_metadata?.username;

  if (!username || !/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return null;
  }

  const { error } = await supabaseClient.from("profiles").insert({
    id: user.id,
    username,
    bio: "",
    favorite_fandom: ""
  });

  if (error && error.code !== "23505") throw error;

  return await getProfile(user.id);
}

function fillProfile(profile) {
  if (profileUsername) {
    profileUsername.value = profile.username || "";
  }

  if (profileBio) {
    profileBio.value = profile.bio || "";
  }

  if (profileFandom) {
    profileFandom.value = profile.favorite_fandom || "";
  }

  if (profilePicturePreview) {
    if (profile.avatar_url) {
      profilePicturePreview.src = profile.avatar_url;
      profilePicturePreview.hidden = false;
    } else {
      profilePicturePreview.removeAttribute("src");
      profilePicturePreview.hidden = true;
    }
  }
}

// ================================
// ACCOUNT / AUTHENTICATION
// ================================

async function refreshAccount() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    currentUser = null;
    currentProfile = null;
    likedPostIds.clear();

    if (accountStatus) {
      accountStatus.textContent = "You're browsing as a guest.";
    }

    if (logoutButton) logoutButton.hidden = true;
    if (signupForm) signupForm.hidden = false;
    if (loginForm) loginForm.hidden = false;
    if (profileSection) profileSection.hidden = true;

    updatePostAccess();
    return;
  }

  currentUser = data.user;

  if (signupForm) signupForm.hidden = true;
  if (loginForm) loginForm.hidden = true;
  if (logoutButton) logoutButton.hidden = false;
  if (profileSection) profileSection.hidden = false;

  if (accountStatus) {
    accountStatus.textContent = "Loading your profile...";
  }

  try {
    currentProfile = await ensureProfile(currentUser);

    if (!currentProfile) {
      if (accountStatus) {
        accountStatus.textContent =
          "You're logged in, but your profile was not found.";
      }

      updatePostAccess();
      return;
    }

    profilesCache[currentUser.id] = currentProfile;
    fillProfile(currentProfile);

    if (accountStatus) {
      accountStatus.textContent =
        `Logged in as @${currentProfile.username}`;
    }

    updatePostAccess();
    await loadMyLikes();
    await loadNotifications();
  } catch (err) {
    console.error("Account loading failed:", err);

    if (accountStatus) {
      accountStatus.textContent =
        "Profile loading failed. Check the browser Console.";
    }

    updatePostAccess();
  }
}

async function loadMyLikes() {
  likedPostIds.clear();
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from("post_likes")
    .select("post_id")
    .eq("user_id", currentUser.id);

  if (error) {
    console.error("Loading likes failed:", error);
    return;
  }

  for (const row of data || []) {
    likedPostIds.add(String(row.post_id));
  }
}

// SIGN UP
if (signupForm) {
  signupForm.addEventListener("submit", async event => {
    event.preventDefault();

    const status = $("account-message");
    const email = $("signup-email")?.value.trim();
    const password = $("signup-password")?.value;
    const username = $("signup-username")?.value.trim();

    if (!email || !password || !username) {
      showMessage(status, "Please complete every field.", true);
      return;
    }

    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
      showMessage(
        status,
        "Use 3–20 letters, numbers or underscores.",
        true
      );
      return;
    }

    showMessage(status, "Creating your account...");

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin + "/index.htm"
      }
    });

    if (error) {
      showMessage(status, error.message, true);
      return;
    }

    if (data.user && data.session) {
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert({
          id: data.user.id,
          username,
          bio: "",
          favorite_fandom: ""
        });

      if (profileError && profileError.code !== "23505") {
        console.error("Profile creation failed:", profileError);
      }

      showMessage(status, "Account created!");
      await refreshAccount();
      await loadPosts();
    } else {
      showMessage(
        status,
        "Check your email for the confirmation link, then log in."
      );
    }
  });
}

// LOG IN
if (loginForm) {
  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const status = $("account-message");

    showMessage(status, "Logging in...");

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: $("login-email")?.value.trim(),
      password: $("login-password")?.value
    });

    if (error) {
      showMessage(status, error.message, true);
      return;
    }

    showMessage(status, "Login successful!");
    await refreshAccount();
    await loadPosts();
  });
}

// LOG OUT
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      showMessage(
        accountStatus,
        "Could not log out: " + error.message,
        true
      );
      return;
    }

    currentUser = null;
    currentProfile = null;

    if (profileForm) profileForm.reset();

    await refreshAccount();
    await loadPosts();
  });
}

// SAVE PROFILE
if (profileForm) {
  profileForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) {
      showMessage(profileMessage, "Please log in first.", true);
      return;
    }

    const username = profileUsername?.value.trim() || "";
    const bio = profileBio?.value.trim() || "";
    const favorite_fandom = profileFandom?.value.trim() || "";

    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
      showMessage(
        profileMessage,
        "Use 3–20 letters, numbers or underscores.",
        true
      );
      return;
    }

    showMessage(profileMessage, "Saving your profile...");

    const { data, error } = await supabaseClient
      .from("profiles")
      .update({ username, bio, favorite_fandom })
      .eq("id", currentUser.id)
      .select("id, username, bio, favorite_fandom, avatar_url")
      .maybeSingle();

    if (error) {
      showMessage(profileMessage, error.message, true);
      return;
    }

    if (!data) {
      showMessage(
        profileMessage,
        "No profile row was updated. Check Supabase.",
        true
      );
      return;
    }

    currentProfile = data;
    profilesCache[currentUser.id] = data;
    fillProfile(data);

    if (accountStatus) {
      accountStatus.textContent = `Logged in as @${data.username}`;
    }

    showMessage(profileMessage, "Profile saved!");
    await loadPosts();
  });
}

// UPLOAD PROFILE PICTURE
if (uploadPictureButton) {
  uploadPictureButton.addEventListener("click", async () => {
    if (!currentUser) {
      showMessage(pictureMessage, "Please log in first.", true);
      return;
    }

    const file = profilePictureInput?.files?.[0];

    if (!file) {
      showMessage(pictureMessage, "Choose an image first.", true);
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif"
    ];

    if (!allowedTypes.includes(file.type)) {
      showMessage(
        pictureMessage,
        "Choose a PNG, JPG, WEBP or GIF image.",
        true
      );
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showMessage(
        pictureMessage,
        "Image must be smaller than 3 MB.",
        true
      );
      return;
    }

    showMessage(pictureMessage, "Uploading picture...");

    const extension = file.name.includes(".")
      ? file.name.split(".").pop().toLowerCase()
      : "jpg";

    const filePath =
      `${currentUser.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error("Avatar upload failed:", uploadError);
      showMessage(pictureMessage, uploadError.message, true);
      return;
    }

    const { data: publicData } = supabaseClient.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const { data, error } = await supabaseClient
      .from("profiles")
      .update({ avatar_url: publicData.publicUrl })
      .eq("id", currentUser.id)
      .select("id, username, bio, favorite_fandom, avatar_url")
      .maybeSingle();

    if (error || !data) {
      console.error("Avatar profile save failed:", error);
      showMessage(
        pictureMessage,
        error?.message || "Could not save avatar URL.",
        true
      );
      return;
    }

    currentProfile = data;
    profilesCache[currentUser.id] = data;
    fillProfile(data);

    showMessage(pictureMessage, "Profile picture updated!");
    await loadPosts();
  });
}

// ================================
// CREATE POST IN SELECTED CHANNEL
// ================================

if (postForm) {
  postForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) {
      showMessage($("post-message"), "Please log in first.", true);
      return;
    }

    let profile;

    try {
      profile = await getProfile(currentUser.id);
    } catch (err) {
      console.error("Profile lookup failed:", err);
      showMessage($("post-message"), "Could not load your profile.", true);
      return;
    }

    if (!profile) {
      showMessage($("post-message"), "Your profile was not found.", true);
      return;
    }

    const title = postTitle?.value.trim() || "";
    const content = postContent?.value.trim() || "";
    const community =
      $("post-community")?.value || selectedChannel || "general";

    if (!title || !content) {
      showMessage(
        $("post-message"),
        "Add a title and some content.",
        true
      );
      return;
    }

    if (!CHANNELS[community]) {
      showMessage(
        $("post-message"),
        "Please choose a valid channel.",
        true
      );
      return;
    }

    showMessage($("post-message"), "Publishing post...");

    const { error } = await supabaseClient.from("posts").insert({
      user_id: currentUser.id,
      username: profile.username,
      title,
      content,
      community
    });

    if (error) {
      showMessage($("post-message"), error.message, true);
      return;
    }

    selectedChannel = community;
    updateChannelUI();

    postForm.reset();

    const selector = $("post-community");
    if (selector) selector.value = community;

    showMessage(
      $("post-message"),
      `Post published in ${CHANNELS[community].name}!`
    );

    await loadPosts();
  });
}

// ================================
// LOAD POSTS FOR THE SELECTED CHANNEL
// ================================

async function loadPosts() {
  if (!postsFeed || loadingPosts) return;

  loadingPosts = true;
  postsFeed.textContent = "Loading posts...";

  try {
    const { data: allPosts, error } = await supabaseClient
      .from("posts")
      .select("id, user_id, username, title, content, created_at, community")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const validPosts = allPosts || [];

    postsCache = selectedChannel
      ? validPosts.filter(post => post.community === selectedChannel)
      : validPosts;

    profilesCache = {};

    const userIds = [
      ...new Set(
        validPosts.map(post => post.user_id).filter(Boolean)
      )
    ];

    if (currentUser) userIds.push(currentUser.id);

    if (userIds.length) {
      const { data: profiles, error: profileError } =
        await supabaseClient
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", [...new Set(userIds)]);

      if (profileError) {
        console.error("Author profile lookup failed:", profileError);
      } else {
        for (const profile of profiles || []) {
          profilesCache[profile.id] = profile;
        }
      }
    }

    const likeCounts = {};

    if (validPosts.length) {
      const { data: likes, error: likesError } = await supabaseClient
        .from("post_likes")
        .select("post_id");

      if (likesError) {
        console.error("Like count lookup failed:", likesError);
      } else {
        for (const like of likes || []) {
          const id = String(like.post_id);
          likeCounts[id] = (likeCounts[id] || 0) + 1;
        }
      }
    }

    postsFeed.replaceChildren();

    if (!postsCache.length) {
      const message = selectedChannel
        ? `No posts in ${CHANNELS[selectedChannel].name} yet. Be the first to post!`
        : "No posts yet. Be the first to share something!";

      postsFeed.appendChild(makeElement("p", "fn-empty", message));
      return;
    }

    for (const post of postsCache) {
      const profile = profilesCache[post.user_id];
      const username = profile?.username || post.username || "Fan";
      const postId = String(post.id);

      const card = makeElement("article", "fn-post-card");
      card.dataset.title = (post.title || "").toLowerCase();
      card.dataset.content = (post.content || "").toLowerCase();
      card.dataset.community = post.community || "general";

      const heading = makeElement(
        "h3",
        "fn-post-heading",
        post.title || "Untitled"
      );

      const channel = CHANNELS[post.community] || CHANNELS.general;
      const channelLabel = makeElement("small", "fn-muted", channel.name);

      const author = makeElement("div", "fn-author");
      let avatar;

      if (profile?.avatar_url) {
        avatar = makeElement("img", "fn-avatar");
        avatar.src = profile.avatar_url;
        avatar.alt = `${username}'s profile picture`;
        avatar.loading = "lazy";
      } else {
        avatar = makeElement(
          "div",
          "fn-avatar fn-avatar-default",
          "🌌"
        );
      }

      const authorInfo = makeElement("div");
      authorInfo.appendChild(
        makeElement("strong", "fn-profile-link", `@${username}`)
      );
      authorInfo.appendChild(
        makeElement("div", "fn-muted", "Fandom Nexus member")
      );

      author.append(avatar, authorInfo);

      const content = makeElement("p", "", post.content || "");
      content.style.whiteSpace = "pre-wrap";

      const date = makeElement(
        "small",
        "fn-muted",
        post.created_at
          ? new Date(post.created_at).toLocaleString()
          : ""
      );

      const actions = makeElement("div", "fn-post-actions");

      const likeButton = makeButton(
        `${likedPostIds.has(postId) ? "❤️ Liked" : "🤍 Like"} (${likeCounts[postId] || 0})`,
        async () => {
          await toggleLike(post);
        }
      );

      const commentsArea = makeElement("div", "fn-comments");
      commentsArea.hidden = true;

      const commentsButton = makeButton("💬 Comments", () => {
        commentsArea.hidden = !commentsArea.hidden;
      });

      actions.append(likeButton, commentsButton);

      commentsArea.appendChild(
        makeElement("h4", "", "Comments and replies")
      );

      const commentsList = makeElement("div");
      commentsList.textContent = "Loading comments...";
      commentsArea.appendChild(commentsList);

      const commentForm = makeElement("form", "fn-comment-form");
      const commentInput = makeElement("textarea");
      commentInput.placeholder = "Write a comment...";
      commentInput.maxLength = 1000;
      commentInput.required = true;
      commentInput.setAttribute("aria-label", "Write a comment");

      const commentSubmit = makeElement("button", "", "Send comment");
      commentSubmit.type = "submit";

      commentForm.append(commentInput, commentSubmit);

      commentForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentUser) {
          alert("Log in to comment.");
          return;
        }

        const text = commentInput.value.trim();
        if (!text) return;

        commentSubmit.disabled = true;

        const { error: commentError } = await supabaseClient
          .from("post_comments")
          .insert({
            post_id: post.id,
            user_id: currentUser.id,
            content: text
          });

        commentSubmit.disabled = false;

        if (commentError) {
          alert("Comment failed: " + commentError.message);
          return;
        }

        commentInput.value = "";
        await loadComments(post.id, commentsList);
        await loadNotifications();
      });

      commentsArea.appendChild(commentForm);

      card.append(
        channelLabel,
        heading,
        author,
        content,
        date,
        actions,
        commentsArea
      );

      postsFeed.appendChild(card);

      await loadComments(post.id, commentsList);
    }

    applySearch();
  } catch (err) {
    console.error("Post loading failed:", err);
    postsFeed.textContent =
      "Posts could not load. Check the browser Console and Supabase setup.";
  } finally {
    loadingPosts = false;
  }
}

// ================================
// LIKES
// ================================

async function toggleLike(post) {
  if (!currentUser) {
    alert("Log in to like posts.");
    return;
  }

  const postId = String(post.id);

  if (likedPostIds.has(postId)) {
    const { error } = await supabaseClient
      .from("post_likes")
      .delete()
      .eq("post_id", post.id)
      .eq("user_id", currentUser.id);

    if (error) {
      alert("Could not remove like: " + error.message);
      return;
    }

    likedPostIds.delete(postId);
  } else {
    const { error } = await supabaseClient
      .from("post_likes")
      .insert({
        post_id: post.id,
        user_id: currentUser.id
      });

    if (error && error.code !== "23505") {
      alert("Could not like post: " + error.message);
      return;
    }

    likedPostIds.add(postId);
  }

  await loadPosts();
  await loadNotifications();
}

// ================================
// COMMENTS AND REPLIES
// ================================

async function loadComments(postId, list) {
  const { data: comments, error } = await supabaseClient
    .from("post_comments")
    .select("id, post_id, user_id, parent_id, content, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  list.replaceChildren();

  if (error) {
    console.error("Comment loading failed:", error);
    list.textContent =
      "Comments could not load. Check the database setup.";
    return;
  }

  const allComments = comments || [];

  // Also load profiles for comment authors who haven't made posts.
  const commentUserIds = [
    ...new Set(allComments.map(comment => comment.user_id).filter(Boolean))
  ].filter(id => !profilesCache[id]);

  if (commentUserIds.length) {
    const { data: commentProfiles, error: profilesError } =
      await supabaseClient
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", commentUserIds);

    if (profilesError) {
      console.error("Comment author lookup failed:", profilesError);
    } else {
      for (const profile of commentProfiles || []) {
        profilesCache[profile.id] = profile;
      }
    }
  }

  const topLevel = allComments.filter(comment => comment.parent_id == null);

  if (!topLevel.length) {
    list.appendChild(makeElement("p", "fn-muted", "No comments yet."));
  }

  for (const comment of topLevel) {
    const wrapper = makeElement("div", "fn-comment");

    const profile = profilesCache[comment.user_id];
    const author = profile?.username || "Fan";

    wrapper.appendChild(
      makeElement("strong", "fn-comment-author", `@${author}`)
    );

    const body = makeElement("p", "", comment.content);
    body.style.whiteSpace = "pre-wrap";
    wrapper.appendChild(body);

    wrapper.appendChild(
      makeElement(
        "small",
        "fn-muted",
        new Date(comment.created_at).toLocaleString()
      )
    );

    const replies = allComments.filter(
      reply => String(reply.parent_id) === String(comment.id)
    );

    if (replies.length) {
      const repliesContainer = makeElement("div", "fn-replies");

      for (const reply of replies) {
        const replyProfile = profilesCache[reply.user_id];
        const replyBox = makeElement("div", "fn-comment");

        replyBox.appendChild(
          makeElement(
            "strong",
            "fn-comment-author",
            `↳ @${replyProfile?.username || "Fan"}`
          )
        );

        const replyBody = makeElement("p", "", reply.content);
        replyBody.style.whiteSpace = "pre-wrap";
        replyBox.appendChild(replyBody);

        replyBox.appendChild(
          makeElement(
            "small",
            "fn-muted",
            new Date(reply.created_at).toLocaleString()
          )
        );

        repliesContainer.appendChild(replyBox);
      }

      wrapper.appendChild(repliesContainer);
    }

    const replyButton = makeButton("Reply", () => {
      if (!currentUser) {
        alert("Log in to reply.");
        return;
      }

      replyForm.hidden = !replyForm.hidden;
    });

    replyButton.className = "fn-reply-button";

    const replyForm = makeElement("form", "fn-reply-form");
    replyForm.hidden = true;

    const replyInput = makeElement("textarea");
    replyInput.placeholder = `Reply to @${author}...`;
    replyInput.maxLength = 1000;
    replyInput.required = true;

    const replySubmit = makeElement("button", "", "Send reply");
    replySubmit.type = "submit";

    replyForm.append(replyInput, replySubmit);

    replyForm.addEventListener("submit", async event => {
      event.preventDefault();

      if (!currentUser) {
        alert("Log in to reply.");
        return;
      }

      const text = replyInput.value.trim();
      if (!text) return;

      replySubmit.disabled = true;

      const { error: replyError } = await supabaseClient
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          parent_id: comment.id,
          content: text
        });

      replySubmit.disabled = false;

      if (replyError) {
        alert("Reply failed: " + replyError.message);
        return;
      }

      await loadComments(postId, list);
      await loadNotifications();
    });

    wrapper.append(replyButton, replyForm);
    list.appendChild(wrapper);
  }
}

// ================================
// SEARCH COMMUNITIES AND POSTS
// ================================

function applySearch() {
  const query = searchInput?.value.trim().toLowerCase() || "";

  const communityCards = [
    ...document.querySelectorAll("#communities .card")
  ];

  for (const card of communityCards) {
    const matches = card.textContent.toLowerCase().includes(query);
    card.hidden = !matches;
  }

  if (noResults) {
    noResults.hidden = communityCards.some(card => !card.hidden);
  }

  if (postsFeed) {
    postsFeed.querySelectorAll(".fn-post-card").forEach(card => {
      const text = `${card.dataset.title || ""} ${card.dataset.content || ""}`;
      const matchesSearch = !query || text.includes(query);
      const matchesChannel =
        !selectedChannel || card.dataset.community === selectedChannel;

      card.hidden = !matchesSearch || !matchesChannel;
    });
  }
}

if (searchInput) {
  searchInput.addEventListener("input", applySearch);
}

// ================================
// NOTIFICATIONS
// ================================

function setupNotifications() {
  if ($("notifications-panel")) {
    notificationList = $("notifications-list");
    return;
  }

  const panel = makeElement("section", "fn-notifications");
  panel.id = "notifications-panel";

  panel.appendChild(makeElement("h3", "", "🔔 Notifications"));

  const toolbar = makeElement("div", "fn-toolbar");
  toolbar.appendChild(makeButton("Refresh", loadNotifications));
  toolbar.appendChild(
    makeButton("Mark all as read", markAllNotificationsRead)
  );

  panel.appendChild(toolbar);

  notificationList = makeElement("div");
  notificationList.id = "notifications-list";
  panel.appendChild(notificationList);

  const accountSection = $("account-section");

  if (accountSection) {
    accountSection.appendChild(panel);
  }
}

async function loadNotifications() {
  if (!notificationList) return;

  if (!currentUser) {
    notificationList.textContent =
      "Log in to see your notifications.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("notifications")
    .select("id, message, is_read, created_at")
    .eq("recipient_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(30);

  notificationList.replaceChildren();

  if (error) {
    console.error("Notifications failed to load:", error);
    notificationList.textContent =
      "Notifications could not load. Check your SQL setup.";
    return;
  }

  if (!data?.length) {
    notificationList.textContent = "You're all caught up!";
    return;
  }

  for (const item of data) {
    const row = makeElement(
      "div",
      `fn-notification${item.is_read ? "" : " fn-unread"}`
    );

    row.appendChild(makeElement("p", "", item.message));

    row.appendChild(
      makeElement(
        "small",
        "fn-muted",
        new Date(item.created_at).toLocaleString()
      )
    );

    if (!item.is_read) {
      row.appendChild(
        makeButton("Mark as read", async () => {
          const { error: updateError } = await supabaseClient
            .from("notifications")
            .update({ is_read: true })
            .eq("id", item.id)
            .eq("recipient_id", currentUser.id);

          if (updateError) {
            alert("Could not mark as read: " + updateError.message);
            return;
          }

          await loadNotifications();
        })
      );
    }

    notificationList.appendChild(row);
  }
}

async function markAllNotificationsRead() {
  if (!currentUser) {
    alert("Log in to manage notifications.");
    return;
  }

  const { error } = await supabaseClient
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", currentUser.id)
    .eq("is_read", false);

  if (error) {
    alert("Could not mark notifications as read: " + error.message);
    return;
  }

  await loadNotifications();
}

setupNotifications();
setupChannels();

// Refresh session state when authentication changes.
supabaseClient.auth.onAuthStateChange(() => {
  setTimeout(async () => {
    await refreshAccount();
    await loadPosts();
  }, 0);
});

// INITIAL SETUP
updatePostAccess();
refreshAccount();
loadPosts();

/* DISABLE RIGHT-CLICK AND COMMON SOURCE SHORTCUTS */
document.addEventListener("contextmenu", function (event) {
  event.preventDefault();
});

document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();

  // Block Ctrl+U / Cmd+U (View Source)
  if ((event.ctrlKey || event.metaKey) && key === "u") {
    event.preventDefault();
  }

  // Block Ctrl+Shift+I / Cmd+Option+I (Developer Tools)
  if (
    (event.ctrlKey && event.shiftKey && key === "i") ||
    (event.metaKey && event.altKey && key === "i")
  ) {
    event.preventDefault();
  }

  // Block F12
  if (key === "f12") {
    event.preventDefault();
  }
});
