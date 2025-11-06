---
name: Hotfix
about: Critical fix for production
title: 'hotfix: '
labels: 'hotfix'
assignees: ''
---

## Description

<!-- Provide a clear and concise description of the hotfix -->

## Type of Change

- [ ] Critical bug fix (fixes a critical production issue)
- [ ] Security fix (fixes a security vulnerability)
- [ ] Data loss prevention (prevents data loss or corruption)

## Urgency

<!-- Why is this a hotfix? What makes it critical? -->
**Urgency Level:**
- [ ] Critical - Production is down or severely impacted
- [ ] High - Significant functionality broken
- [ ] Medium - Important issue affecting users

**Impact:**
<!-- Describe the impact if this hotfix is not deployed -->

## Issue Description

<!-- Describe the critical issue -->
**Issue:**
<!-- What is the critical issue? -->

**Affected Systems:**
<!-- What systems or features are affected? -->

**User Impact:**
<!-- How are users affected? -->

## Solution

<!-- Describe how you fixed the critical issue -->

## How Has This Been Tested?

<!-- Describe the tests you ran to verify your fix -->
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] Manual testing performed
- [ ] Production-like environment testing (if applicable)
- [ ] Regression tests added to prevent future occurrence

## Test Coverage

<!-- Ensure test coverage meets 85% threshold -->
- [ ] New code is covered by tests
- [ ] Coverage report shows ≥85% coverage

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective
- [ ] New and existing unit tests pass locally with my changes
- [ ] Branch follows git-flow naming: `hotfix/hotfix-name`
- [ ] PR targets `main` or `master` branch (or `develop` if appropriate)
- [ ] Commit messages follow conventional commit format
- [ ] Branch has linear commit history (no merge commits)
- [ ] Hotfix has been tested in a production-like environment

## Related Issues

<!-- Link to related issues -->
Fixes #
Closes #

## Deployment Plan

<!-- Describe the deployment plan for this hotfix -->
- [ ] Hotfix tested in staging/pre-production
- [ ] Rollback plan documented
- [ ] Deployment window identified
- [ ] Team notified of hotfix deployment

## Post-Deployment

<!-- What needs to happen after deployment? -->
- [ ] Monitor for issues
- [ ] Verify fix in production
- [ ] Merge hotfix back into `develop` branch
- [ ] Update documentation if needed

## Additional Notes

<!-- Any additional information that reviewers should know -->

