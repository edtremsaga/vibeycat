# Deployment Guide for Vercel

## Quick Deploy via Web Interface (Easiest)

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click **"Add New Project"**
4. Select your `vibeycat` repository
5. Vercel will auto-detect it's a Vite project
6. Click **"Deploy"** - that's it!

## Deploy via CLI

1. **Login to Vercel:**
   ```bash
   vercel login
   ```
   Follow the prompts to authenticate.

2. **Deploy:**
   ```bash
   vercel
   ```
   - First time: Answer the setup questions
   - Subsequent deploys: Just run `vercel`

3. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## Project Configuration

The project is already configured with:
- ✅ `vercel.json` - Build configuration
- ✅ `package.json` - Build scripts
- ✅ Vite framework auto-detection

## Environment Variables (Optional)

If you need to set environment variables (like `GEMINI_API_KEY`):
1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add your variables

## Custom Domain

After deployment:
1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain

