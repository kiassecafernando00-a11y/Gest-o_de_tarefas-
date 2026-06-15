# Security Specification (TDD for Firestore Security Rules)

## 1. Data Invariants and Relational Logic
- **Users**: A user can only write to their own profile at `/users/{userId}` where `userId == request.auth.uid`. No user can alter another's profile.
- **Projects**: Only signed-in, email-verified users can create projects. A project owner is always set as the authenticated user who created it (`request.auth.uid`). Users can only read and write to projects if they are the `ownerId` or a member of the `members` array.
- **Tasks**: Tasks reside under `/projects/{projectId}/tasks/{taskId}`. A task can only be read, created, updated, or deleted by users who are authenticated, verified, and are current members or the owner of the parent project `/projects/{projectId}`.
- **Comments**: High-frequency discussions on tasks. Can only be created by members of the parent project.
- **Activities**: Historical change trail. Only modifiable/creatable during activities within a project. Cannot be modified or deleted once created (immutable logs).

---

## 2. The "Dirty Dozen" Malicious Payloads

We will test against these 12 malicious patterns to verify that they are correctly blocked by `PERMISSION_DENIED`:

1. **Email Spoofing Profile Creation**: Creating a user profile as a different user UID or setting email as someone else.
2. **Identity Spoofing on Project Creation**: Attempting to create a project where the `ownerId` is someone else's UID instead of `request.auth.uid`.
3. **Project Member Hijacking**: An authenticated non-member of a project trying to read parent project metadata.
4. **Unbounded Members Injection**: Trying to inject an array of 10,000 members into a project definition to exhaust backend resources.
5. **Task Creation in Foreign Project**: Creating a task in a project that the user does not own or belongs to.
6. **Task Status Bypass**: Making a malicious update that attempts to change the `status` of a finished/archived task to skip sequence processes, or updating fields like `createdBy` which should be immutable.
7. **Ad-hoc Self-RBAC Escalation**: Modifying self roles or project roles inline inside the payload.
8. **Resource Exhaustion/ID Poisoning**: Trying to write a task with an ID of 1.5KB long, containing non-alphanumeric symbols.
9. **Timestamp Spoofing**: Submitting client-generated timestamps in `createdAt` or `updatedAt` instead of native `request.time`.
10. **Malicious Comment Spoofing**: Writing a comment under a task on behalf of another user UID.
11. **Malicious Activity Log Alteration**: Modifying or deleting an existing activity log to erase the audit trail of modifications.
12. **Blanket Collection Scraping Queries**: Sending a general list query targeting all projects without limiting search queries specifically to documents containing the user's membership.

---

## 3. Test Cases Draft / Rules Verification

These states are covered in the `firestore.rules` specification:

- Accessing a document in `/projects/{projectId}` validates if `request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.members` or is owner.
- Checking that all operations verify the user's email is verified: `request.auth.token.email_verified == true`.
- Verifying timestamp integrity via `request.time`.
