/*
  This script serves as a demo for automatic downloading of audio files from a given website.
  It mimics users typing and clicking events in the browser and behaves exactly in the same way as if a human-being
  is controlling the browser.

  The basic workflow of this script is:
      1. Open up some windows in the browser.
      2. In each window, type in the information that allows us to identify the targeting callers.
      3. Search based on the information and download the recording showing up on the first row.
      4. Repeat until we have searched all targeting users in a given list.
      5. Download CSV files that map each caller to its corresponding call recording downloading URL.

  Notice that some websites would refresh themselves whenever there are some events, in which case all of the Javascript code and the
  local variables you created will disappear. This script gets around this obstacle by running on a main web-page without triggering any
  events so that this web-page won't refresh, then it opens up another set of new pages and trigger events in those pages by controlling
  them on the main page. In this way, all scripts and local variables can be retained unless user manually refresh the main page (almost
  always by mistake).

  This script also allows users to do the data collection using multi-threading (hopefully in parallel). This can
  be easily achieved by tweaking the variable `chunks` on the bottom of this page.

  However, your life would be much easier if you can implement a web-crawler using Selenium in Python. Please prioritize the web-crawler's
  approach whenever possible. If you cannot get the web-crawler working, then modify this script according to your needs and then copy-paste
  it into your browser (right click => inspect => console). If you are running on your own computer rather than remotely, then the downloading
  speed can be highly impacted by the internet connection speed at your place. Most browsers have a limit on the number of files you can
  download simultaneously (e.g. Google Chrome has a limit of 6) and there is no easy way to get around this constraint. Therefore, it is highly
  likely that you will be missing a number of files in the end, as they are getting clogged during the downloading process and their downloads
  may fail. The bottom line is that the CSV you get after the script terminates can give you all the downloading URLs corresponding to each
  caller. You can iterate through the list of URLs in the CSV and the list of files you download (manually or using other programming languages)
  and then make up the missing ones by simply visiting their downloading URLs using the function `save_file(url, x)`.

  NOTE: THIS SCRIPT IS FOR DEMO ONLY AND ONLY APPLIES TO A SPECIFIC WEBSITE, WHICH HAS BEEN MASKED OUT IN THE CODE DUE TO CONFIDENTIAL REASONS,
        FOR ALL THE OTHER WEBSITES, BE SURE TO MODIFY THE HTML TAGS & ATTRIBUTES ACCORDINGLY!!!
*/

/*
  This function retrieves the file content from the provided URL and save it to the file with
  the same file name from the URL.

  Inputs:
      url: The url of the downloading link.
      x: The variable linking to a web-page on the website.
      contact_id: The corresponding contact_id of the file to download.
*/
function save_file(url, x, contact_id){
    var fname2 = contact_id + ".wav" //url.split("/").pop();
    console.log("Downloading " + fname2);
    fetch(url)
        .then(res => res.blob())
        .then(blob => {
            var link = x.document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url2 = URL.createObjectURL(blob);
                link.setAttribute("href", url2);
                link.setAttribute("download", fname2);
                link.style.visibility = 'hidden';
                x.document.body.appendChild(link);
                link.click();
                x.document.body.removeChild(link);
            }
        });
}

/*
  This function takes in an array and saves it to a CSV file.

  Inputs:
      filename: The filename of the CSV file to save.
      rows: The array storing the content for the CSV file.
*/
function exportToCsv(filename, rows) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

/*
  This function checks the webpage every 5 seconds to see if the targeted contents are loaded.
  If loaded, then download the recording on the webpage. If not, retry until it has reached the max
  retry limit of 10.

  Inputs:
      x: The variable linking to a web-page on the website.
      xId: The position of the webpage.
      cnt: The current number of retries. Begins at 0.
      contact_id: The contact id for the user of interests.
*/
async function page_is_loaded(x, xId, cnt, contact_id){
    var passed = false
    try{
        var len = x.document.getElementsByTagName("tr").length;
        var dnis_web = x.document.getElementsByTagName("tr")[1].getElementsByTagName("td")[11].textContent
        if(dnis_web.toUpperCase() !== prev_dnis_lst[xId].toUpperCase()){
            passed = true;
        } else{
            passed = false;
        }
        if(passed){
            visited_contact_id.push(contact_id);
            dnis_web_tmp_lst[xId] = dnis_web;
        }
    } catch(err){
        passed = false;
    }
    if(!passed && cnt < 10){
        setTimeout(function(){
            page_is_loaded(x, xId, cnt + 1, contact_id);
        }, 1000*5);
    }
}

/*
  This function enters the searching information to the website and downloads the file.

  Inputs:
      x: The variable linking to a web-page on the website.
      xId: The position of the webpage.
      contact_id: The contact id of the user of interests.
*/
async function download_single_recording(x, xId, contact_id){
    x.document.getElementById("user_contact_id").value = contact_id;
    x.document.getElementById("from_dt").value = "10/1/2020";
    x.document.getElementById("to_dt").value = "12/31/2020";
    x.document.getElementById("submit_btn").click()

    page_is_loaded(x, xId, 0, contact_id);
}

/*
  This function downloads all files in the array of policy number by iterating it from index idx to max_len.

  Inputs:
      idx: The index of policy_lst to start with.
      fname: The name of the CSV file to dump the map between the recording file names and their corresponding users.
      rows: The array for storing the contents. New contents will be appended to the rows.
      cnt: The retry number of the file at the current index idx. Default = 0.
      x: The variable linking to a web-page on the website.
      xId: The position of the webpage.
      max_len: The terminal index of the function. Default is the length of the policy_lst.

  Notice that the idx and max_len parameters are especially useful when we are downloading using multi-threading so
  that each thread only takes care of a subset of users from idx to max_len. When we are using a single thread, then
  it will take care of the entire set of users from idx = 0 to max_len = policy_lst.length.
*/
async function download_all(idx, fname, rows, cnt=0, x, xId, max_len=contact_id_lst.length){
    var contact_id = contact_id_lst[idx];
    var passed = false;
    if(cnt == 0){
        try{
            download_single_recording(x, xId, contact_id);
        } catch(err){
            passed = false;
        }
    }
    passed = visited_contact_id.includes(contact_id);
    cnt = cnt + 1;
    setTimeout(function(){
        if(passed || cnt >= 10){
            try{
                var len = x.document.getElementsByTagName("tr").length;
                var key = x.document.getElementsByTagName("tr")[len - 1].getElementsByTagName("td")[0].textContent;
                var url = "<URL>key=" + key + "&accessedFrom=Media";
                if(passed){
                    rows.push([contact_id, url]);
                    prev_dnis_lst[xId] = dnis_web_tmp_lst[xId];
                }
            } catch(err){
                console.log(err);
            }
            if(idx + 1 < max_len){
                download_all(idx + 1, fname, rows, 0, x, xId, max_len);
            } else{
                exportToCsv(fname, rows)
                x.window.close();
            }
        } else{
            download_all(idx, fname, rows, cnt, x, xId, max_len)
        }
    }, 1000*5)
}

/*
  Opens a new page every 5 seconds until the number of pages we have opened equals to the `chunks`.

  Inputs:
      pageId: The current index of page. Starts with 0.
*/
async function open_pages(pageId, chunks){
    var x = window.open("<URL>");
    x_lst.push(x);
    rows_lst.push([]);
    prev_dnis_lst.push("");
    dnis_web_tmp_lst.push("");
    if(pageId + 1 < chunks){
        setTimeout(function(){
            open_pages(pageId + 1);
        }, 1000*5)
    }
}

/*
  Download the file at the position `fileId` in the list.
  Move on to the next one after 2 seconds if we haven't gone through the entire array of files yet.

  Inputs:
      x: The variable linking to a web-page on the website.
      fileId: The position of the file. Starts with 0.
*/
async function download_file(x, fileId){
    if(!downloaded_file_lst.includes(rows_all[fileId][0])){
        save_file(rows_all[fileId][1], x, rows_all[fileId][0]);
        if(fileId + 1 < rows_all.length){
            setTimeout(function(){
                download_file(fileId + 1);
            }, 1000*2)
        }
    } else{
        if(fileId + 1 < rows_all.length){
            download_file(fileId + 1);
        }
    }
}

// Open up multiple pages in order to collect data using multiple threads.
// Tweak the parameter `chunks` to specify the number of threads you want to use.
var chunks = 20;
var visited_contact_id = [];
var x_lst = [];
var rows_lst = [];
var prev_dnis_lst = [];
var dnis_web_tmp_lst = [];
var downloaded_file_lst = [];
var contact_id_lst = [1111111, 2222222, 3333333, 4444444, 5555555];

var batch_size = ~~Math.ceil(contact_id_lst.length / chunks);

// Open up `chunks` number of pages to prepare for multithreading tasks
open_pages(0, chunks);

// Fire up all those threads. A CSV file will be downloaded each time when a thread is done.
for(var i = 0; i < chunks; i++){
    var rows = rows_lst[i];
    var fname = "export_chunk" + i + ".csv";
    download_all(i * batch_size, fname, rows, 0, x_lst[i], i, Math.min((i+1)*batch_size, contact_id_lst.length));
}
// Combine the results from all `chunks` of webpages and merge them into the same array.
// Output the map between the contact_id and the corresponding downloading link of the call recording to a CSV file.
var rows_all = [];
for(var i = 0; i < rows_lst.length; i++){
    for(var j = 0; j < rows_lst[i].length; j++){
        rows_all.push(rows_lst[i][j]);
    }
}
exportToCsv("export.csv", rows_all);

// Open up a new window.
// Download all those files according to their links we have collected.
var x = window.open("<URL>");
// Start downloading all files based on the collected URLs
download_file(x, 0);
