# Fish-On-Bid Repository – Branch Structure & Guidelines

This repository follows a **clean two-branch strategy** to clearly separate frontend and backend development.

---

##  Branch Overview

| Branch Name  | Purpose                                                |
| ------------ | ------------------------------------------------------ |
| **frontend** | Contains the complete Frontend (PWA / UI) code         |
| **backend**  | Contains the complete Backend (Spring Boot / API) code |

> There is **no `main` branch used for development** in this repository.
> Each branch represents an independent application layer.

---

##  Why This Structure?

* Frontend and Backend were developed **independently**
* Each has its **own Git history**
* Avoids merge conflicts and unrelated-history issues
* Easy for team members to work on specific layers
* Industry-accepted approach for multi-layer applications

---

##  Code Location

### Frontend

* Branch: `frontend`
* Includes:

  * PWA assets
  * UI components
  * Client-side logic

### Backend

* Branch: `backend`
* Includes:

  * Spring Boot application
  * REST APIs
  * Security & configuration

---

##  Switching Between Branches

```bash
git checkout frontend   # Access frontend code
git checkout backend    # Access backend code
```

---

##  Deleted / Removed Branches

* Any temporary or unused branches (e.g., `main`, `master`) have been **safely deleted**
* This was done to keep the repository **clean and understandable**

---

##  Important Notes

* Do NOT merge `frontend` and `backend` branches
* Do NOT reinitialize Git inside subfolders
* Always push frontend changes to `frontend` branch
* Always push backend changes to `backend` branch

---

##  Project Owner

**Fish-On-Bid** – Antony Vivin S 
(Empowering rural communities through modern digital auction technology.)

---

##  Future Developers

If you are new to this repository:

1. Choose the branch based on your task
2. Work only within that branch
3. Push changes to the same branch

This structure ensures **clarity, scalability, and maintainability**.

---

Repository is intentionally structured this way.
