'use strict';

let https = require('https');
var pg = require('pg');

// Datos Bing Search API:

let bingNewsSearchKey = 'cb266542a9cc4c01a008ccd985ea8917'; // 21 dias a partir de 26/10/2017
let host_BingNewsSearchAPI = 'api.cognitive.microsoft.com';
let path_BingNewsSearchAPI = '/bing/v7.0/news/search';
let limitNumberNews = 100; // MAX = 100

// Datos Text Analytics API:

let hostTextAnaliticsAPI = 'westcentralus.api.cognitive.microsoft.com';
let pathTextAnaliticsAPISentiment =  '/text/analytics/v2.0/sentiment';
let pathTextAnaliticsAPIKeyPhrases = '/text/analytics/v2.0/keyPhrases';

let languageAPI ="es";
let TextAnalysisKey = "0c140e28fe754315b816691babf92e4e"; // 13 dias a partir de 20/10/2017
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

//
var newsAPI;
var keyPhrasesAPI;
var opinionsAPI;

var documents = { documents: [] };
var term = '';

// Searching news functions:

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
        newsAPI = (JSON.parse(body)).value;

        BuildJSONDocs(newsAPI);
    });
    response.on('error', function (e) {
        console.log('Error ResponseHandler_BingNewsSearchAPI: ' + e.message);
    });
};

// Text Analitics - opinions API: 

let Request_Opinion = function (documents) 
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
        opinionsAPI = (JSON.parse(body)).documents;

        Request_KeyPhrasesExtraction(documents);
    });
    response.on ('error', function (e) 
    {
        console.log ('Error ResponseHandler_Opinions: ' + e.message);
    });
};

// Test analitics - key phrases extraction API:

let Request_KeyPhrasesExtraction = function (documents)
{
    let body = JSON.stringify (documents);
    
    let request_params = {
        method : 'POST',
        hostname : hostTextAnaliticsAPI,
        path : pathTextAnaliticsAPIKeyPhrases,
        headers : {
            'Ocp-Apim-Subscription-Key' : TextAnalysisKey,
        }
    };

    let req = https.request (request_params, ResponseHandler_KeyPhrases);
    req.write (body);
    req.end ();
}

let ResponseHandler_KeyPhrases = function (response)
{
    let body = '';
    response.on ('data', function (d) {
        body += d;
    });
    response.on ('end', function () {
        
        keyPhrasesAPI = (JSON.parse(body)).documents;

        SaveNewsInDB(0);
    });
    response.on ('error', function (e) {
        console.log ('Error: ' + e.message);
    });
}

// Database functions:

let SaveNewsInDB = function(index)
{
    // check results from API:
    // console.log(JSON.stringify(newsAPI, null, 2));
    // console.log(JSON.stringify(opinionsAPI, null, 2));
    // console.log(JSON.stringify(keyPhrasesAPI, null, 2));

    var N = newsAPI.length;
    var newAPI;
    var query_id_nu_content;
    var id_nu_opinion;
    var id_nu_content;

    if (index < N)
    {
        newAPI = newsAPI[index];

        pg.connect(connectionString, function(err, client, done) 
        {
            query_id_nu_content = "SELECT id_nu_content FROM tb_content WHERE url = '"  + newAPI.url  + "'";
            
            client.query(query_id_nu_content, function(err, result) 
            {
                done();
                if (err)
                { 
                    console.error("error: \n" + query_id_nu_content + '\n' + err);
                }
                else
                { 
                    if (result.rows.length > 0)
                    {
                        id_nu_content = result.rows[0].id_nu_content;
                        console.log("Ya existe: " + id_nu_content + ":" + newAPI.url);
                    }
                    else
                    {
                        insert_tb_content(newAPI);
                    }
                    SaveNewsInDB(++index);
                }
            });
        });
    }

    function insert_tb_content(newAPI)
    {
        var query_insert_tb_content = 'INSERT INTO tb_content ' +
            '(id_nu_content_type, tittle, description, url, url_image, dtm_date, location, id_nu_state) ' + 
            'VALUES (' +
                "'1','" +
                newAPI.name.replace(/'/g,'') + "','" +
                newAPI.description.replace(/'/g,'') + "','" +
                newAPI.url + "','" +
                (newAPI.image ? newAPI.image.thumbnail.contentUrl : "") + "','" +
                newAPI.datePublished + "','" +
                "0,0" + "','" +
                "1" + "') " +
            "RETURNING id_nu_content";
        
        pg.connect(connectionString, function(err, client, done) 
        {
            client.query(query_insert_tb_content, function(err, result) 
            {
                done();
                if (err)
                { 
                    console.error("error: \n" + query_insert_tb_content + '\n' + err);
                }
                else
                { 
                    id_nu_content = result.rows[0].id_nu_content;
                    console.log("succeded inserting id_nu_content: " + id_nu_content);

                    insert_tb_opinion();
                }
            });
        });
    }

    function insert_tb_opinion()
    {
        var opinion = searchOpinion(newAPI.url)

        if (opinion)
        {
            var query_insert_tb_opinion = "INSERT INTO tb_opinion (opinion) VALUES (" + opinion + ") RETURNING id_nu_opinion";

            pg.connect(connectionString, function(err, client, done) 
            {
                client.query(query_insert_tb_opinion, function(err, result) 
                {
                    done();
                    if (err)
                    { 
                        console.error("error: \n" + query_insert_tb_opinion + '\n' + err);
                    }
                    else
                    { 
                        id_nu_opinion = result.rows[0].id_nu_opinion;
                        console.log("succeded inserting id_nu_opinion: " + id_nu_opinion);
    
                        insert_tb_r_content_opinion();
                    }
                });
            });
        }
    }

    function insert_tb_r_content_opinion()
    {
        if (id_nu_opinion && id_nu_content)
        {
            var query_insert_tb_r_content_opinion = "INSERT INTO tb_r_content_opinion (id_nu_content, id_nu_opinion) VALUES (" + 
                                                   id_nu_content + ", " + id_nu_opinion + ") RETURNING id_nu_content_opinion";
            
            pg.connect(connectionString, function(err, client, done) 
            {
                client.query(query_insert_tb_r_content_opinion, function(err, result) 
                {
                    done();
                    if (err)
                    { 
                        console.error("error: \n" + query_insert_tb_r_content_opinion + '\n' + err);
                    }
                    else
                    { 
                        console.log("succeded inserting id_nu_content_opinion: " + result.rows[0].id_nu_content_opinion);
    
                        insert_key_phrases();
                    }
                });
            });
        }
    }

    function insert_key_phrases()
    {
        // var keyPhrases = searchKeyPhrases(newAPI.url);

        // var nPhrases = keyPhrases.length;

        // if (indexPhrase < nPhrases)
        // {

        // }

    }
}

// Helper functions

let BuildJSONDocs = function()
{
    // Build JSON to get opinions and key phrases:
    
    var document;

    var N = newsAPI.length;
    for (var i = 0; i < N; i++) 
    {
        document = { id: newsAPI[i].url, language: languageAPI, text: newsAPI[i].description };
        documents.documents.push(document);    
    }

    Request_Opinion(documents);
}

function searchOpinion(url)
{
    var N = opinionsAPI.length;

    for (var i = 0; i < N; i++) 
    {
        if (opinionsAPI[i].id == url)
        {
            return opinionsAPI[i].score;
        }
    }
    return null;
}

function searchKeyPhrases(url)
{
    var N = keyPhrasesAPI.length;

    for (var i = 0; i < N; i++) 
    {
        if (keyPhrasesAPI[i].id == url)
        {
            return keyPhrasesAPI[i].keyPhrases;
        }
    }
    return null;
}

Request_BingNewsSearchAPI(term);