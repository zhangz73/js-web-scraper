# js-web-scraper

## Background
Web-scraping is widely used in a variety of fields. Web-crawlers are mostly implemented using `BeautifulSoup` and `Selenium` in Python. When it comes to the tasks at your company, web-scraping becomes much trickier. <strong>Most companies that have a well-established development environment tend to block all HTTP/HTTPS requests sent to external websites, so web-crawlers built in Python are no longer available. </strong> However, it doesn't mean that employees in those companies should ever do the dull and repetitive web-scraping tasks by hand. In this repo, we provided a demo script that does the massive amount of web-scraping and file downloads using JavaScript, with error resilience.

## Methodology
The basic methodology can be demonstrated with a non-trivial example. Suppose we have a large number of users, each of whom has an audio file we need to download from a website. The workflow for a human agent will be as follows: Enter the credentials of the first user and search for the audio file associated with that user, click on the link for downloading the file, save the file to a local directory, and repeat those steps for the subsequent users. JavaScript does exactly what a human would do on the website. To launch the JavaScript web-scraper, `Open Your Browser` --> `Navigate to the Website` --> `Right Click` --> `Inspect` --> `Console` --> `Copy & Paste JavaScript and Run`.

While the exact procedures can be found in the pipeline diagram below, we highlighted a few important steps that tend to be ignored by novice:
* Webpage loadings take time, we need to wait at least a few seconds as long as we click some buttons on the website.
* The `sleep` function in JavaScript can pause everything, including the page loading. Therefore, we should use `setTimeout` on a function recursively in order to hang over for the page to load.
* We need to implement the JavaScript `asynchronously` in order to pause without disrupting the page loading process.
* Multiple pages are opened in order to fire up the web-scraper using more than one threads.
* It is better to collect the corresponding downloading URLs for each user in the first pass, using multiple threads, while downloading those files in the second pass, using a single thread. Web traffic can easily get jammed if you download files with more than one threads.
![Web-scraper Pipeline](Images/Workflow.png)

Web-scraping is a highly customized job, as different websites have completely different layouts. <strong>Therefore, the code `js_scraper_demo.js` can only be used as a reference, while you should build your own web-craper tailoring to your specific use case.</strong>

## Cautious
Web-scraping is a very tricky task, as it depends not only on your script and your local computer, but also on the remote servers that host the website you are scraping. A lot of things you are supposed to keep in mind while implementing a web-scraper:
* Error Resilience
  * Webpages can fail to load for no reasons, be sure to add a `retrying` scheme to mitigate some temporary disruptions
  * Not everything can be collected in the first round, even with the retrying scheme. Re-running the whole procedure on the missing records for a few rounds can always help reduce loss on information that is supposed to be available.
  * You might be temporarily blocked due to frequent interactions with their servers. Adding some durations before sending out a new request. If you do get blocked, pause the procedure and come back a few minutes later.
  * Save as much intermediate results as you can.
* Browser & Device
  * Do not refresh or close the page that hosts your script, otherwise everything will be gone!
  * Some websites automatically refresh by nature. Therefore, it is safe to host your script in an empty webpage, open up and control a few other child pages that scrape the target websites.
  * Bulk files should be downloaded one by one, rather than concurrently. Google Chrome allows up to 6 files downloading simultaneously, but it risks getting your web traffic clogged.
  * Prevent your computer from sleeping when you are sleeping, otherwise your web-scraping pipeline will pause as well!
* Performance
  * The speed can be highly correlated to the internet speed at your location.
  * To leverage the waiting time while pages are loading, web-scrape with multiple threads can achieve the effect of parallelization.
* Mental Health (Expect less to lose less)
  * Don't expect to get everything done in one pass.
  * Don't expect the web-scraper can run smoothly while you sleep. Server maintenance, network issues, device idling, unexpected website structures can all pop up.
  * Don't get discouraged. Celebrate whenever you have made a small step ahead!
