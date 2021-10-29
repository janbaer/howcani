<script>
  function isLocalHost() {
    return window.location.hostname === 'localhost';
  }

  function loginToGitHub() {
    const oauthClientId = isLocalHost() ? 'c5571ab869190bdc5f33' : '82a001ac3b1f5f2aa7ff';
    window.location.href = `https://github-oauth-bridge.jan-baer.vercel.app/api/login?clientId=${oauthClientId}`;
  }
</script>

<div class="form">
  <h2 class="form-header title-font">Login to GitHub</h2>
  <p class="form-help-text">
    To be able to work with HowCanI you need to login with your GitHub account and then select a Git
    repository where the data should be saved.
  </p>
  <button class="form-primary-button" on:click={loginToGitHub}>Login</button>
</div>
