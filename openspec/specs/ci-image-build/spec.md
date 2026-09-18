# ci-image-build Specification

## Purpose
Publishing the Docker image is the job of CI, not of a workstation. A version bump that reaches `main` is what releases: the Forgejo runner builds the image, pushes the version tag and then `:latest`, which the deploy webhook picks up. Only `main` publishes, so an image always corresponds to reviewed code.
## Requirements
### Requirement: Workflow trigger

The repository SHALL contain `.forgejo/workflows/docker-image.yml`, triggered by pushes to `main` that change `package.json` and by `workflow_dispatch`. The job SHALL run only for `refs/heads/main`, so that only reviewed code is published.

#### Scenario: Version bump merged to main
- **WHEN** a commit changing `package.json` is pushed to `main`
- **THEN** the workflow SHALL start

#### Scenario: Unrelated push to main
- **WHEN** a commit that does not change `package.json` is pushed to `main`
- **THEN** the workflow SHALL NOT start

#### Scenario: Manual run on main
- **WHEN** the workflow is started from the Forgejo UI on `main`
- **THEN** it SHALL run the same steps as a push-triggered run

#### Scenario: Manual run on another ref
- **WHEN** the workflow is started on a feature branch
- **THEN** the job SHALL be skipped and SHALL NOT build or push

### Requirement: Skip existing versions

The workflow SHALL read the version from `package.json` and SHALL NOT build or push when `forgejo.home.janbaer.de/jan/howcani:<version>` already exists in the registry.

#### Scenario: Version already published
- **WHEN** the registry already contains the tag for the current version
- **THEN** the workflow SHALL finish successfully without building or pushing

### Requirement: Build and publish

The workflow SHALL build the image without a `BUN_VERSION` build argument, push `:<version>` and then `:latest`, logging in as `jan` with the `REGISTRY_TOKEN` secret, and SHALL remove both local tags afterwards.

#### Scenario: New version
- **WHEN** the registry does not contain the tag for the current version
- **THEN** the image SHALL be built, `:<version>` SHALL be pushed before `:latest`, and both tags SHALL be removed from the Docker daemon

#### Scenario: Build failure
- **WHEN** the image build fails
- **THEN** nothing SHALL be pushed

### Requirement: Result notification

The workflow SHALL post the result of every run that builds to `https://ntfy.home.janbaer.de` on topic `forgejo-cicd`, including a link to the run.

#### Scenario: Successful release
- **WHEN** both tags were pushed
- **THEN** a success notification with the version and the run link SHALL be sent

#### Scenario: Failed run
- **WHEN** any step of the job fails
- **THEN** a failure notification with high priority and the run link SHALL be sent

