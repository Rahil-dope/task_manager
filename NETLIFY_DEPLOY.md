# Netlify Deployment Guide

This project is ready for Netlify deployment.

## Quick Deploy

1. **Connect your repository to Netlify:**
   - Go to [Netlify](https://www.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

2. **Build Settings:**
   - **Build command:** (leave empty - no build needed)
   - **Publish directory:** `.` (root directory)

3. **Deploy!**
   - Netlify will automatically detect the `netlify.toml` configuration
   - Your site will be live at `https://your-site.netlify.app`

## Manual Deploy

If you prefer to deploy manually:

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run: `netlify deploy --prod`
3. Follow the prompts

## Configuration Files

- `netlify.toml` - Netlify configuration
- `_redirects` - URL rewrite rules for SPA routing

## Troubleshooting

If buttons are not working:

1. **Check browser console** for JavaScript errors
2. **Verify all files are uploaded** - Make sure `js/`, `css/`, and `index.html` are in the root
3. **Check module loading** - Open browser DevTools → Network tab and verify all `.js` files load with status 200
4. **Clear browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## File Structure for Netlify

```
/
├── index.html
├── css/
│   ├── styles.css
│   └── themes.css
├── js/
│   ├── main.js
│   ├── taskManager.js
│   ├── calendar.js
│   ├── notifications.js
│   ├── recurring.js
│   ├── sync.js
│   └── utils.js
├── netlify.toml
├── _redirects
└── README.md
```

All files should be in the root directory (not in a `public` or `dist` folder).

