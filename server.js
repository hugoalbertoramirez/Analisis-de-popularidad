'use strict';

let https = require('https');
var pg = require('pg');

let bingNewsSearchKey = 'cb266542a9cc4c01a008ccd985ea8917'; // 21 dias a partir de 26/10/2017
let host = 'api.cognitive.microsoft.com';
let path = '/bing/v7.0/news/search';
//////////////////////////

var SpeechToTextKey = "8e60a0fb81a047298615383a2c8dfa64"; // 30 días apartir del 25/10/2017
var TextAnalysisKey = "0c140e28fe754315b816691babf92e4e"; // no se
var urlkeyPhrases = "https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases";
var urlSentiment = "https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment";
//////////////////////////


var userName = 'Empower_User';
var password = '3mp0w3rd4t4r00t';
var server = 'dbdevelop.cywmxo6vg4sl.us-west-2.rds.amazonaws.com';
var port = '5432';
var database = 'politica';
let connectionString = 'pg://' + userName + ':' + password + '@' + 
                        server + ':' + port + '/' + database;

let term = 'trump';

let response_handler = function (response) 
{
    let body = '';
    response.on('data', function (d) 
    {
        body += d;
    });
    response.on('end', function () 
    {
        body = JSON.parse(body);
        //SaveResultsInDB(body.value);

        var documents = { documents: [] };
        var document;
        var lang ="es";
        
        var N = body.value.length;
        for (var i = 0; i < N; i++) 
        {
            var element = body.value[i];
            document = { id: i + 1, language: lang, text: element.description };
            documents.documents.push(document);    
        }

        RequestOpinion(documents);
        
    });
    response.on('error', function (e) {
        console.log('Error: ' + e.message);
    });
};

let SaveResultsInDB = function(resultsAPI)
{
    // check results from API:
    // console.log(JSON.stringify(resultsAPI, null, 2));

    // get all URL of news in DB 
    var urls = [];
    var querySelect;
    pg.connect(connectionString, function(err, client, done) 
    {
        querySelect = 'SELECT url FROM tb_content WHERE id_nu_content_type = 1;';
        client.query(querySelect, function(err, result) 
        {
            done();
            if (err)
            { 
                console.error("error: " + querySelect + '\n' + err);
            }
            else
            { 
                urls = result.rows;
                //RequestOpinion(resultsAPI);
                insertNews(urls);

                // check urls from news from DB:
                //console.log(JSON.stringify(urls, null, 4));
            }
        });
    });

    function insertNews(urls_db)
    {
        var newAPI;
        var values = "";
        var N = resultsAPI.length;
        console.log(N);
        for (var i = 0; i < N; i++)
        {
            newAPI = resultsAPI[i];
            
            if (!contains(urls_db, newAPI.url))
            {
                values += 
                    "('1','" +
                    newAPI.name.replace(/'/g,'') + "','" +
                    newAPI.description.replace(/'/g,'') + "','" +
                    newAPI.url + "','" +
                    (newAPI.image ? newAPI.image.thumbnail.contentUrl : "") + "','" +
                    newAPI.datePublished + "','" +
                    "0,0" + "','" +
                    "" + "')," ;
            }
        }
        values = values.substring(0, values.length - 1);
    
        // check values to insert in DB:
        // console.log("VALUES> " + values);

        if(values != "")
        {
            var queryINSERT = 'INSERT INTO tb_content ' +
            '(id_nu_content_type, tittle, description, url, url_image, dtm_date, location, state) ' + 
            'VALUES ' + values;
            
            pg.connect(connectionString, function(err, client, done) 
            {
                client.query(queryINSERT, function(err, result) 
                {
                    done();
                    if (err)
                    { 
                        console.error("error: " + queryINSERT + '\n' + err);
                    }
                    else
                    { 
                        console.log("succeded insert rows");
                    }
                });
            });
        }   
    }
}

function RequestOpinion(documents) {

    let body = JSON.stringify (documents);
    //console.log(body);

    let request_params = {
        method : 'POST',
        hostname : 'westcentralus.api.cognitive.microsoft.com',
        path : '/text/analytics/v2.0/sentiment',
        headers : {
            'Ocp-Apim-Subscription-Key' : TextAnalysisKey,
        }
    };

    let req = https.request (request_params, response_handlerOpinions);
    req.write (body);
    req.end ();
}

let response_handlerOpinions = function (response) {
    let body = '';
    response.on ('data', function (d) {
        body += d;
    });
    response.on ('end', function () {
        let body_ = JSON.parse (body);
        let body__ = JSON.stringify (body_, null, 4);
        console.log (body__);
    });
    response.on ('error', function (e) {
        console.log ('Error: ' + e.message);
    });
};


function contains(a, obj)
{
    for (var i = 0; i < a.length; i++) 
    {
        if (a[i].url == obj) 
        {
            return true;
        }
    }
    return false;
}

let bing_news_search = function (search) 
{
  console.log('Searching news for: ' + term);
  let request_params = {
        method : 'GET',
        hostname : host,
        path : path + '?q=' + search + '&count=100',
        headers : {
            'Ocp-Apim-Subscription-Key' : bingNewsSearchKey,
        }
    };

    let req = https.request(request_params, response_handler);
    //console.log('path: ' + request_params.path);
    req.end();
}

bing_news_search(term);