'use strict';

let https = require('https');
var pg = require('pg');

// Datos Bing Search API:

let bingNewsSearchKey = 'cb266542a9cc4c01a008ccd985ea8917'; // 21 dias a partir de 26/10/2017
let host_BingNewsSearchAPI = 'api.cognitive.microsoft.com';
let path_BingNewsSearchAPI = '/bing/v7.0/news/search';
let limitNumberNews = 100;

// Datos Text Analytics API:

let hostTextAnaliticsAPI = 'westcentralus.api.cognitive.microsoft.com';
let pathTextAnaliticsAPISentiment =  '/text/analytics/v2.0/sentiment';

let languageAPI ="es";
let TextAnalysisKey = "0c140e28fe754315b816691babf92e4e"; // no se
let urlkeyPhrases = "https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases";
let urlSentiment = "https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment";

// Datos speech to text API:

var SpeechToTextKey = "8e60a0fb81a047298615383a2c8dfa64"; // 30 días apartir del 25/10/2017

// Datos base de datos:

var userName = 'Empower_User';
var password = '3mp0w3rd4t4r00t';
var server = 'dbdevelop.cywmxo6vg4sl.us-west-2.rds.amazonaws.com';
var port = '5432';
var database = 'politica';
let connectionString = 'pg://' + userName + ':' + password + '@' + server + ':' + port + '/' + database;

let term = 'trump';

// Serching news functions:

let Request_BingNewsSearchAPI = function (search) 
{
    console.log('Searching news for: ' + term);
    let request_params = 
    {
        method : 'GET',
        hostname : host_BingNewsSearchAPI,
        path : path_BingNewsSearchAPI + '?q=' + search + '&count=' + limitNumberNews,
        headers : 
        {
            'Ocp-Apim-Subscription-Key' : bingNewsSearchKey,
        }
    };

    let req = https.request(request_params, ResponseHandler_BingNewsSearchAPI);
    req.end();
}

let ResponseHandler_BingNewsSearchAPI = function (response) 
{
    let body = '';
    response.on('data', function (d) 
    {
        body += d;
    });
    response.on('end', function () 
    {
        body = JSON.parse(body);
        //SaveNewsInDB(body.value);

        // Build JSON to get opinions:
        var documents = { documents: [] };
        var document;
        
        var N = body.value.length;
        for (var i = 0; i < N; i++) 
        {
            document = { id: body.value[i].url, language: languageAPI, text: body.value[i].description };
            documents.documents.push(document);    
        }

        Request_Opinion(documents);
        
    });
    response.on('error', function (e) {
        console.log('Error ResponseHandler_BingNewsSearchAPI: ' + e.message);
    });
};

// Text Analitics - opinions API: 

function Request_Opinion(documents) 
{
    let body = JSON.stringify (documents);

    let request_params = 
    {
        method : 'POST',
        hostname : hostTextAnaliticsAPI,
        path : pathTextAnaliticsAPISentiment,
        headers :
        {
            'Ocp-Apim-Subscription-Key' : TextAnalysisKey,
        }
    };

    let req = https.request (request_params, ResponseHandler_Opinions);
    req.write (body);
    req.end ();
}

let ResponseHandler_Opinions = function (response) 
{
    let body = '';
    response.on ('data', function (d) 
    {
        body += d;
    });
    response.on ('end', function () 
    {
        let body_ = JSON.parse(body);
        let body__ = JSON.stringify (body_, null, 4);
        console.log (body__);
    });
    response.on ('error', function (e) 
    {
        console.log ('Error ResponseHandler_Opinions: ' + e.message);
    });
};

// Database functions:

let SaveNewsInDB = function(resultsAPI)
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
                insertNewsInDB(urls);

                // check urls from news from DB:
                //console.log(JSON.stringify(urls, null, 4));
            }
        });
    });

    function insertNewsInDB(urls_db)
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
                        console.log("succeded inserting rows");
                    }
                });
            });
        }   
    }
}

let SaveOpinions = function()
{

}

// Helper functions

function contains(arr, obj)
{
    var N = arr.length;
    for (var i = 0; i < N; i++) 
    {
        if (a[i].url == obj) 
        {
            return true;
        }
    }
    return false;
}

Request_BingNewsSearchAPI(term);