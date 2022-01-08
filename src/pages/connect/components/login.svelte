<script>
  import { Card, CardText, CardActions, Button } from 'svelte-materialify';
  import { isLocalHost } from '/@/helpers/env.helpers.js';

  function loginToGitHub() {
    const oauthClientId = isLocalHost() ? 'c5571ab869190bdc5f33' : '82a001ac3b1f5f2aa7ff';
    window.location.href = `https://github-oauth-bridge.vercel.app//api/login?clientId=${oauthClientId}`;
  }
</script>

<Card outlined style="max-width:600px;">
  <CardText>
    <h2 class="heading text-h4 mb-3">Login to GitHub</h2>
    <p>
      To be able to work with HowCanI you need to login with your GitHub account and then select a
      Git repository where the data should be saved.
    </p>
  </CardText>
  <CardActions>
    <Button class="primary-color" on:click={loginToGitHub}>Login</Button>
  </CardActions>
</Card>
