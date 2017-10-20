'use strict';

let https = require('https');
var afterLoad=require('after-load');

let subscriptionKey = 'cb266542a9cc4c01a008ccd985ea8917';
let host = 'api.cognitive.microsoft.com';
let path = '/bing/v7.0/news/search';

let term = 'epn';

let response_handler = function (response) {
    let body = '';
    response.on('data', function (d) {
        body += d;
    });
    response.on('end', function () {
        console.log('\nRelevant Headers:\n');
        for (var header in response.headers)
        {
            // header keys are lower-cased by Node.js
            if (header.startsWith("bingapis-") || header.startsWith("x-msedge-"))
            {
                 console.log(header + ": " + response.headers[header]);
            }
        }

        body = JSON.parse(body);
        var N = body.value.length;
        
        for (var i = 0; i < N; i++)
        {
            var value = body.value[i];    
            console.log("=========" + value.name + "=========");
            console.log("Descripcion: " + value.description);
            console.log("Image URL:" + value.image.thumbnail.contentUrl);
            console.log("Date: " + value.datePublished);
            console.log("URL: " + value.url + '\n\n');

            // var html = afterLoad(value.url);
            // console.log(html);
        }
        
    });
    response.on('error', function (e) {
        console.log('Error: ' + e.message);
    });
};

let bing_news_search = function (search) {
  console.log('Searching news for: ' + term);
  let request_params = {
        method : 'GET',
        hostname : host,
        path : path + '?q=' + encodeURIComponent(search),
        headers : {
            'Ocp-Apim-Subscription-Key' : subscriptionKey,
        }
    };

    let req = https.request(request_params, response_handler);
    req.end();
}

bing_news_search(term);