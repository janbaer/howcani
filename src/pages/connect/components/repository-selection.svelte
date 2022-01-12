<script>
  import { push as navigate } from 'svelte-spa-router';
  import { Card, CardText, CardActions, Row, Col, TextField, Button } from 'svelte-materialify';

  import GithubService from '/@/services/github.service.js';
  import { configStore } from '/@/stores/config.store';

  let user = '';
  let repository = '';
  let isUserValid = true;
  let isRepositoryValid = true;

  configStore.subscribe((config) => {
    if (!config.oauthToken) {
      return;
    }
    readUser(config.oauthToken);
  });

  async function readUser(oauthToken) {
    const githubService = new GithubService();
    const githubUser = await githubService.getAuthenticatedUser(oauthToken);
    if (githubUser) {
      user = githubUser.loginName;
    }
  }

  async function handleSubmit() {
    isUserValid = !!user;
    isRepositoryValid = !!repository;

    if (isUserValid) {
      const githubService = new GithubService();
      const githubUser = await githubService.getUser(user);
      if (!githubUser) {
        isUserValid = false;
        isRepositoryValid = false;
        return;
      }

      const githubRepository = await githubService.getRepository(user, repository);
      if (!githubRepository) {
        isRepositoryValid = false;
        return;
      }
    }

    if (isUserValid && isRepositoryValid) {
      configStore.update((config) => {
        config.user = user;
        config.repository = repository;
        return config;
      });
      navigate('/');
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <Card outlined style="max-width:600px;">
    <CardText>
      <h2 class="heading text-h4 mb-3">Connect to GitHub repository</h2>
      <p>Please enter your GitHub user name and select a repository</p>
      <Row>
        <Col>
          <TextField readonly filled value={user}>User</TextField>
        </Col>
      </Row>
      <Row>
        <Col>
          <TextField
            placeholder="Enter repository name"
            bind:value={repository}
            error={!isRepositoryValid}
          >
            Repository
          </TextField>
        </Col>
      </Row>
    </CardText>
    <CardActions>
      <Button class="primary-color" type="submit">Connect</Button>
    </CardActions>
  </Card>
</form>
