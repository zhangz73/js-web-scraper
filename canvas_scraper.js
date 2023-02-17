/* This is a simplified pipeline that collects files of a given extension from Canvas
*/

global_url = "https://canvas.cornell.edu/courses/50040";

/*
  This function retrieves the file content from the provided URL and save it to the file with
  the same file name from the URL.
  Inputs:
      url: The url of the downloading link.
      x: The variable linking to a web-page on the website.
      contact_id: The corresponding contact_id of the file to download.
*/
function save_file(url, x, fname2){
    console.log("Downloading " + fname2);
    fetch(url, {mode: "no-cors"})
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
  This function enters the searching information to the website and downloads the file.
  Inputs:
      x: The variable linking to a web-page on the website.
      xId: The position of the webpage.
      link: The link to visit.
*/
async function visit_single_link(x, rows, link){
    console.log("Visiting " + link);
    var y = x.window.open(link);
    setTimeout(function(){
        var url = y.document.getElementById('content').getElementsByTagName('a')[0].href;
        var fname = y.document.getElementById('content').getElementsByTagName('a')[0].text.split(' ')[1];
        rows.push([url, fname])
        y.window.close();
    }, 1000 * 2);
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
async function download_all(idx, fname, rows, cnt=0, x, xId, max_len=attachment_link_lst.length){
    var url_to_visit = attachment_link_lst[idx];
    var passed = false;
    var ret = [];
    if(cnt == 0){
        try{
            ret = visit_single_link(x, rows, url_to_visit);
            passed = true;
        } catch(err){
            passed = false;
        }
    }
    cnt = cnt + 1;
    setTimeout(function(){
        if(passed || cnt >= 10){
            if(idx + 1 < max_len){
                download_all(idx + 1, fname, rows, 0, x, xId, max_len);
            } else{
                exportToCsv(fname, rows)
                x.window.close();
            }
        } else{
            download_all(idx, fname, rows, cnt, x, xId, max_len);
        }
    }, 1000*5)
}

/*
  Opens a new page every 2 seconds until the number of pages we have opened equals to the `chunks`.
  Inputs:
      pageId: The current index of page. Starts with 0.
*/
async function open_pages(pageId, chunks){
    var x = window.open(global_url);
    x_lst.push(x);
    rows_lst.push([]);
    if(pageId + 1 < chunks){
        setTimeout(function(){
            open_pages(pageId + 1, chunks);
        }, 1000*2)
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
    if(!downloaded_file_lst.includes(rows_all[fileId][1])){
        save_file(rows_all[fileId][0], x, rows_all[fileId][1]);
        if(fileId + 1 < rows_all.length){
            setTimeout(function(){
                download_file(x, fileId + 1);
            }, 1000*2)
        }
    } else{
        if(fileId + 1 < rows_all.length){
            download_file(x, fileId + 1);
        }
    }
}

/*
  Get the urls to all attachments on Canvas
*/
function get_attachment_links(){
    // Expand all blocks
    var block_lst = document.getElementsByClassName('context_module student-view');
//    for(var i = 0; i < block_lst.length; i++){
//        // Check if the block is already expanded
//        var list_elements = block_lst[i].getElementsByTagName('li');
//        if(list_elements.length == 0){
//            block_lst[i].getElementsByClassName('expand_module_link')[0].click();
//        }
//    }
    // Get all attachments
    var attachment_link_lst = [];
    for(var i = 0; i < block_lst.length; i++){
        var list_elements = block_lst[i].getElementsByTagName('li');
        for(var j = 0; j < list_elements.length; j++){
            var link_type = list_elements[j].getElementsByClassName('type_icon')[0].title;
            if(link_type === "Attachment"){
                var link_url = list_elements[j].getElementsByTagName('a')[0].href;
                attachment_link_lst.push(link_url)
            }
        }
    }
    return(attachment_link_lst);
}

// Open up multiple pages in order to collect data using multiple threads.
// Tweak the parameter `chunks` to specify the number of threads you want to use.
var chunks = 5;
var x_lst = [];
var rows_lst = [];
var downloaded_file_lst = [];

// Get the list of blocks
var attachment_link_lst = get_attachment_links();
var batch_size = ~~Math.ceil(attachment_link_lst.length / chunks);

// Open up `chunks` number of pages to prepare for multithreading tasks
open_pages(0, chunks);

// Fire up all those threads. A CSV file will be downloaded each time when a thread is done.
for(var i = 0; i < chunks; i++){
    var rows = rows_lst[i];
    var fname = "export_chunk" + i + ".csv";
    download_all(i * batch_size, fname, rows, 0, x_lst[i], i, Math.min((i+1)*batch_size, attachment_link_lst.length));
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
var x = window.open(global_url);
// Start downloading all files based on the collected URLs
download_file(x, 0);
