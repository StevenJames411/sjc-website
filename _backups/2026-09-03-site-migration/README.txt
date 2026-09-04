SITE MIGRATION BACKUP — 2026-09-03
==================================
Taken immediately BEFORE moving stevenjamesconsulting.com off the site id
"sjc-landingsite-build" and onto "sjc-website".

WHY THE RENAME: the old id carried the name of the vendor whose $20 design was
imported. Steven, day one of the company: that name has no business living in
the URL architecture two years from now.

WHAT IS IN HERE: every page of the live site, draft and published, exactly as
it was before the move — nav, footer, home, the five system pages, about,
podcast, careers, and the explainer. Plus the registry entry (_sites.json)
and the brand record.

TO RESTORE: PUT each <page>.<draft|pub>.json back through /api/puck with
site=<target id>, then PATCH the domain back onto the site you want serving.
The old site "sjc-landingsite-build" was NOT deleted and still holds all of
this content directly.
