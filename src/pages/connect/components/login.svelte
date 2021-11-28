<script>
  function isLocalHost() {
    return window.location.hostname === 'localhost';
  }

  function loginToGitHub() {
    const oauthClientId = isLocalHost() ? 'c5571ab869190bdc5f33' : '82a001ac3b1f5f2aa7ff';
    window.location.href = `https://github-oauth-bridge.jan-baer.vercel.app/api/login?clientId=${oauthClientId}`;
  }
</script>

<div class="Form">
  <h2 class="Form-header title-font">Login to GitHub</h2>
  <p class="FormHelpText-paragraph">
    To be able to work with HowCanI you need to login with your GitHub account and then select a Git
    repository where the data should be saved.
  </p>
  <button class="FormButton-primary" on:click={loginToGitHub}>Login</button>
</div>
