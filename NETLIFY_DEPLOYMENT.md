# Netlify Deployment Guide

## Prerequisites
1. Netlify account
2. GitHub repository with your code
3. All API keys and credentials ready

## Environment Variables (Set in Netlify Dashboard)

Go to Site Settings > Environment Variables and add:

### Required Variables
```
NEXT_PUBLIC_BASE_URL=https://your-site-name.netlify.app
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://ivbvjdejhwobsijryllk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
CLOUDINARY_CLOUD_NAME=dkmsvlhpz
CLOUDINARY_API_KEY=514217268532493
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
CORS_ORIGINS=*
```

### Build Settings
- **Build Command**: `yarn build`
- **Publish Directory**: `.next`
- **Node Version**: 18.x

## Deployment Steps

1. **Connect Repository**
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Build command: `yarn build`
   - Publish directory: `.next`
   - Add environment variables (see above)

3. **Deploy**
   - Netlify will automatically build and deploy
   - Monitor the deploy logs for any errors

## Common Issues & Solutions

### 1. Function Timeout
- Netlify functions have a 10s timeout by default (25s for Pro plans)
- The app uses async evaluation to prevent timeouts
- If evaluations fail, check Netlify function logs

### 2. Environment Variables
- Ensure all environment variables are set correctly
- `NEXT_PUBLIC_BASE_URL` must match your Netlify site URL
- Don't forget to update the URL after first deployment

### 3. API Routes
- API routes are automatically handled by Netlify Functions
- Check `/api/*` endpoints work correctly
- Monitor function logs for errors

### 4. CORS Issues
- Set `CORS_ORIGINS=*` for development
- For production, set to your specific domain: `CORS_ORIGINS=https://your-site.netlify.app`

## Testing After Deployment

1. **Test Rubrics API**: `GET /api/rubrics`
2. **Test Submission**: Create a simple algorithm submission
3. **Monitor Evaluation**: Check if submission status changes from "submitted" → "evaluating" → "completed"
4. **Check Function Logs**: Monitor Netlify function logs for errors

## Supabase Setup

Ensure your Supabase database has:
1. All tables created (run `supabase_schema.sql`)
2. Row Level Security policies configured
3. API keys have proper permissions

## Monitoring

- **Netlify Function Logs**: Monitor for timeout or API errors
- **Supabase Logs**: Check for database connection issues
- **Browser Console**: Check for frontend errors

## Optimization Tips

1. **Reduce Bundle Size**: Remove unused dependencies
2. **Optimize Images**: Use Cloudinary transformations
3. **Monitor Performance**: Use Netlify Analytics
4. **Enable Caching**: Configure proper cache headers

## Support

If you encounter issues:
1. Check Netlify function logs
2. Verify all environment variables are set
3. Test API endpoints individually
4. Check Supabase connection and permissions