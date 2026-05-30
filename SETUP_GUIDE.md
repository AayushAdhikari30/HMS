# Hospital Management System - Setup Guide

## 🔒 Environment Setup

### Initial Setup

1. **Install python-dotenv** in your backend:
   ```bash
   cd backend
   pip install python-dotenv
   ```

2. **Set your SECRET_KEY** in `backend/.env`:
   - Generate a secure key using:
     ```python
     python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
     ```
   - Replace the placeholder in `.env`

3. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

### Git Workflow

1. **Add .env files to .gitignore** ✅ Already done
   - `.env` files are automatically ignored
   - `.env.example` files ARE committed (as templates)

2. **Push to GitHub safely**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **What will be ignored**:
   - ✅ `.env` (your actual secrets)
   - ✅ `node_modules/` (frontend dependencies)
   - ✅ `__pycache__/` (Python cache)
   - ✅ `.venv/` (virtual environment)
   - ✅ `db.sqlite3` (local database)

4. **What will be committed**:
   - ✅ `.env.example` (template for others)
   - ✅ `requirements.txt` or `Pipfile` (dependencies list)
   - ✅ `package.json` & `package-lock.json` (frontend deps list)
   - ✅ Source code (`.py`, `.jsx`, `.css`, etc.)
   - ✅ Configuration files (`vite.config.js`, `eslint.config.js`, etc.)

### For Collaborators

When someone clones your repository:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with their own values

3. Install dependencies and run the project

---

## 📋 Checklist

- [ ] Generate a new Django SECRET_KEY and update `.env`
- [ ] Update `ALLOWED_HOSTS` in `.env` if needed
- [ ] Create `backend/requirements.txt`: `pip freeze > requirements.txt`
- [ ] Verify `.gitignore` covers all sensitive files
- [ ] Test git push (dry run): `git push --dry-run`
