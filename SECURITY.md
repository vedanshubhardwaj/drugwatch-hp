# Security & Privacy Policy: DrugWatch HP

## 1. Ethical Governance & Strict Bans
DrugWatch HP is designed under strict ethical parameters to protect citizen privacy and uphold Indian constitutional standards:
- **No Facial Recognition:** The system does not possess or utilize facial recognition, computer vision identification, or biometric extraction.
- **No Individual Targeting:** Predictive analytics and anomaly detection operate solely at the district aggregate level (all 12 districts of Himachal Pradesh). The system never predicts or targets specific private households, streets, or individuals.
- **Segregation of Citizen Reports:** Anonymous reports submitted by citizens are treated as unverified intelligence tips. They are never automatically converted into official police crime statistics or FIR case files.

## 2. Anonymous Reporting Security
- **No Required PII:** The platform does not solicit or record names, phone numbers, email addresses, or user account credentials from citizens submitting reports.
- **Cryptographic Reference Tokens:** Random, non-sequential alphanumeric codes (`HP-DW-XXXX-XXXX`) are generated using cryptographically strong pseudo-random number generators (`secrets` / `crypto.randomBytes`).
- **Zero Public Exposure:** The Status Lookup portal allows a submitter to check their status using only their secret token. It redacts all detailed private allegations, location specifics, and attachments, and never discloses reports from other users.
- **File Validation:** Evidence uploads are restricted to safe document and image formats (JPEG, PNG, WEBP, PDF) with a strict 10 MB file size ceiling to prevent denial of service and remote code execution vulnerabilities.

## 3. Reporting Vulnerabilities
If you identify a security or privacy flaw in the codebase, please notify the development team by opening a private security advisory on GitHub or emailing the academic project maintainer. Do not file public issue tickets disclosing exploitable vulnerabilities.
