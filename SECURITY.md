# Security Policy

## Supported Versions

Only the latest commit on the `main` branch of this repository is supported for security updates.

| Version / Branch | Supported          |
| ---------------- | ------------------ |
| `main`           | :white_check_mark: |
| Older commits    | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability or potential risk within this repository, please report it responsibly rather than opening a public issue.

### Preferred Method
1. Go to the repository's **Security** tab on GitHub.
2. Click **Report a vulnerability** to submit a private security advisory.

### Alternative Contact
If GitHub Private Vulnerability Reporting is unavailable, please reach out via:
- **Email**: Private disclosure via contact details listed on [kunalsuri.github.io](https://kunalsuri.github.io) or author profile.

---

## Response & Disclosure Policy

When a vulnerability is reported:
1. **Acknowledgement**: We aim to acknowledge receipt of the report within **48 hours**.
2. **Assessment**: The report will be reviewed and verified for impact.
3. **Resolution**: If confirmed, a fix will be implemented and merged to `main` as quickly as possible.
4. **Disclosure**: Details of the vulnerability will be published after a fix has been deployed.

---

## Security Practices & Automation

This repository enforces security best practices for static site delivery:

- **Automated Code Analysis**: CodeQL static analysis runs automatically on pushes and pull requests to `main`.
- **Dependency Scanning**: Dependabot automated security updates monitor npm dependencies for known vulnerabilities.
- **Secret Scanning**: GitHub Secret Scanning prevents accidental commits of sensitive credentials or API tokens.
- **Static Hosting**: The site is compiled to static HTML/CSS/JS via Astro and hosted on GitHub Pages with strict HTTPS enforcement.

---

## Scope & External Services

- **Blog & Source Code**: Static source code is covered under [Apache 2.0](LICENSE); content under [CC BY 4.0](CONTENT_LICENSE).
- **Third-Party Integrations**: Commenting (Giscus) and analytics/search capabilities rely on client-side integrations with their respective privacy and security models.
