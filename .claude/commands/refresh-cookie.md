# /project:refresh-cookie

Update the Instagram session cookie in GCP Secret Manager and redeploy.

## Steps

1. Ask the user to paste the new raw cookie string (from Chrome DevTools → Application → Cookies → instagram.com)
2. URL-decode the cookie: replace `%3A` with `:` and any other encoded chars
3. Update the secret in GCP:
   ```
   echo -n "<decoded-cookie>" | gcloud secrets versions add INSTAGRAM_SESSION_COOKIE --data-file=- --project=instagramagent-491221
   ```
4. Also update `.env` locally with the new cookie
5. Redeploy using /project:deploy
6. Test a profile search to confirm it returns real data (not zeros)

## Notes
- Cookie must be stored URL-decoded — colons as `:` not `%3A`
- Cookie format: `sessionid=XXX; csrftoken=YYY; ds_user_id=ZZZ`
- Expires approximately every 90 days
- When profiles return all zeros (followers: 0, posts: 0), this is the first thing to check
