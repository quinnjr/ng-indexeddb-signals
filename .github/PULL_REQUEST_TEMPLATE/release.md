---
name: Release
about: Prepare a new release
title: 'release: '
labels: 'release'
assignees: ''
---

## Release Information

**Version:** <!-- e.g., 1.0.0 -->
**Release Type:**
- [ ] Major (breaking changes)
- [ ] Minor (new features, backward compatible)
- [ ] Patch (bug fixes, backward compatible)

## Release Notes

<!-- Provide a summary of changes in this release -->

### Added
<!-- New features -->
-

### Changed
<!-- Changes to existing functionality -->
-

### Fixed
<!-- Bug fixes -->
-

### Deprecated
<!-- Soon-to-be removed features -->
-

### Removed
<!-- Removed features -->
-

### Security
<!-- Security fixes -->
-

## Pre-Release Checklist

- [ ] All features from `develop` are included
- [ ] Version number updated in `package.json`
- [ ] CHANGELOG.md updated (if applicable)
- [ ] All tests pass (`pnpm test` and `pnpm e2e`)
- [ ] Code coverage meets 85% threshold
- [ ] Documentation is up to date
- [ ] No breaking changes (or breaking changes are documented)
- [ ] Branch follows git-flow naming: `release/version-number`
- [ ] PR targets `main` or `master` branch (only way to update main)
- [ ] Commit messages follow conventional commit format
- [ ] Branch has linear commit history (no merge commits)

## Testing

<!-- Describe testing performed for this release -->
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Manual testing completed
- [ ] Integration testing completed (if applicable)
- [ ] Performance testing completed (if applicable)

## Deployment Notes

<!-- Any special deployment instructions or considerations -->

## Rollback Plan

<!-- Describe how to rollback this release if needed -->

## Related Issues

<!-- Link to related issues or milestones -->
Closes #
Fixes #

## Additional Notes

<!-- Any additional information for reviewers or release managers -->

