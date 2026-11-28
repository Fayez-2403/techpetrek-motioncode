# Factcheck: Feed ka Muqabla (checked 2026-11-28, before any VO)

Every claim the voice or the screen makes, with the exact source line. A line not in this table does not go in the reel.

| # | Claim (where) | Source (verbatim) | Status |
|---|---|---|---|
| F1 | Twitter: Lady Gaga, 31 million followers, a tweet could take up to 5 minutes to reach them all (hook, taunt) | High Scalability, "The Architecture Twitter Uses to Deal with 150M Active Users, 300K QPS, a 22 MB/S Firehose, and Send Tweets in Under 5 Seconds" (8 Jul 2013, write-up of Raffi Krikorian's QCon SF 2012 talk "Timelines at Scale"): "it can take up to 5 minutes for a tweet to flow from Lady Gaga's fingers to her 31 million followers." ([highscalability.com](https://highscalability.com/the-architecture-twitter-uses-to-deal-with-150m-active-users/)) | ✅ (a 2012-13 figure; said as "Twitter's engineers said", never as today) |
| F2 | Twitter: 300K reads per second vs 6,000 writes per second (Bhejo verse) | Same page: "300K QPS are spent reading timelines and only 6000 requests per second are spent on writes." | ✅ |
| F3 | Push = the post is written into each follower's home timeline at write time (Bhejo verse) | Same page: "Tweets that come in are placed into a massive Redis cluster." System Design Primer (Twitter solution): "Stores the tweet in the home timeline of the user's followers in a Memory Cache." ([github.com](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/twitter/README.md)) | ✅ |
| F4 | The hybrid: don't fan out for superstars, merge their posts in at read time; at Twitter this was a PLAN (milan) | High Scalability, "The Future": "For people like Taylor Swift don't bother with fanout anymore, instead merge in her timeline at read time." System Design Primer: "We could also avoid fanning out tweets from highly-followed users." + merge "at serve time". | ✅ (VO says "Twitter ka plan bhi yahi tha": a plan, not a claim about today) |
| F5 | Pull = fetch from everyone you follow when the feed opens; slow for a user who follows many (Bhejo's taunt) | The general fan-out-on-read pattern (System Design Primer's alternative: "search to find tweets ... merge the search results ... re-order the tweets at serve time"). "500 follows" is a hypothetical in the fable, not a statistic. | ✅ concept |
| F6 | Trade-off lines: push = fast read, costly write; pull = cheap write, slow read (taraazu) | Follows from F2-F5 (precompute at write time vs compute at read time). | ✅ concept |

**Not claimed:** how Instagram, X or any app builds its feed today; any number beyond F1/F2; the superstar is fictional (no real person is drawn). The "Bhejo" and "Maango" parties are the fable's names for push and pull.
