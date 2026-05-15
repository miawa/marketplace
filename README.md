# Minted - Student Marketplace

A peer-to-peer marketplace web application built for university students to buy and sell second-hand items. Built with HTML, CSS and JavaScript using Supabase as the backend.

## Getting Started

No installation or build step is required. Open `login.html` in a browser to get started, or serve the project locally using a tool like Live Server in VS Code.

## Project Structure
/css          - Stylesheets for each page
/js           - JavaScript files for each page
/images       - Static assets and icons
/tests        - Jest unit tests

## Key Files

- `login.html` / `auth.js` - Authentication and session management
- `index.html` / `index.js` - Marketplace homepage, filtering and recommendations
- `messages.html` / `messages.js` - Messaging, offers and order flow
- `admin.html` / `admin.js` - Admin moderation panel
- `supabase.js` - Supabase client initialisation
- `global.js` - Shared utilities and accessibility settings

## Dependencies

- Supabase JS client (loaded via CDN)
- Jest (unit testing)

## Testing

```bash
npm install
npm test
```

## Known Limitations

- Supabase credentials are stored directly in `supabase.js` rather than environment variables
- Recommendation system is category-based only and runs client-side