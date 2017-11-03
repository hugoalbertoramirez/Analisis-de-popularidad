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

// Variables de analisis:

var newsAPI;
var keyPhrasesAPI;
var opinionsAPI;
var documents = { documents: [] };

// Fuente: https://elmercurio.com.mx/nacional/conoce-los-28-aspirantes-a-la-presidencia-mexico-en-2018
var candidatosPresidencia2018 =
[
    "Ricardo Anaya",
    "Margarita Zavala",
    "Luis Ernesto Derbez",
    "Rafael Moreno Valle",
    "Juan Carlos Romero Hicks",
    "Miguel Márquez",
    "Ernesto Ruffo",
    "Miguel Ángel Yunes Linares",
    "Eruviél Avila",
    "Manlio Fabio Beltrones",
    "Enrique Octavio de la Madrid Cordero",
    "José Antonio Meade",
    "José Ramón Narro Robles",
    "Aurelio Nuño Mayer",
    "Ivonne Aracelly Ortega Pacheco",
    "Miguel Ángel Osorio Chong",
    "Luis Videgaray Caso",
    "Silvano Aureoles Conejo",
    "Miguel Ángel Mancera",
    "Graco Luis Ramírez Garrido Abreu",
    "Juan Zepeda Hernández",
    "Emilio Álvarez Icaza Longoria",
    "José Gerardo Rodolfo Fernández Noroña",
    "Pedro Ferriz de Con",
    "María de Jesús Patricio Martínez",
    "Armando Ríos Piter",
    "Jaime Heliódoro Rodríguez Calderón",
    "Andrés Manuel López Obrador",
];

var partidosPoliticos =
[
    "PARTIDO ACCIÓN NACIONAL",
    "PARTIDO REVOLUCIONARIO INSTITUCIONAL", 
    "PARTIDO DE LA REVOLUCIÓN DEMOCRÁTICA", 
    "PARTIDO VERDE ECOLOGISTA DE MÉXICO", 
    "PARTIDO DEL TRABAJO",
    "NUEVA ALIANZA",
    "MOVIMIENTO CIUDADANO",
    "MOVIMIENTO REGENERACIÓN NACIONAL"
];

var statesMexico = 
[
    "AGUASCALIENTES",
    "BAJA CALIFORNIA",
    "BAJA CALIFORNIA SUR",
    "CAMPECHE",
    "COAHUILA DE ZARAGOZA",
    "COLIMA",
    "CHIAPAS",
    "CHIHUAHUA",
    "CIUDAD DE MEXICO",
    "DURANGO",
    "GUANAJUATO",
    "GUERRERO",
    "HIDALGO",
    "JALISCO",
    "ESTADO DE MEXICO",
    "MICHOACAN DE OCAMPO",
    "MORELOS",
    "NAYARIT",
    "NUEVO LEON",
    "OAXACA",
    "PUEBLA",
    "QUERETARO DE ARTEAGA",
    "QUINTANA ROO",
    "SAN LUIS POTOSI",
    "SINALOA",
    "SONORA",
    "TABASCO",
    "TAMAULIPAS",
    "TLAXCALA",
    "VERACRUZ DE IGNACIO DE LA LLAVE",
    "YUCATAN",
    "ZACATECAS"
];

var terms = candidatosPresidencia2018;

// Video indexer API function:

let Request_VideoIndexAPI = function(search)
{
    let request_params = 
    {
        method : 'GET',
        hostname : 'videobreakdown.azure-api.net',
        path : '/Breakdowns/Api/Partner/Breakdowns?videoUrl=' + 'https://www.youtube.com/watch?v=Y56EwvOhg7U',
        headers : 
        {
            'Ocp-Apim-Subscription-Key' : '7c3b04e87be44f10be0386b5558dde91',
        }
    };

    let req = https.request(request_params, ResponseHandler_BingNewsSearchAPI);
    req.end();
}

let Response_VideoIndexAPI = function(response)
{

}

// Searching news functions:

let Request_BingNewsSearchAPI = function (search) 
{
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
    newsAPI = { };
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
    opinionsAPI = { };
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
    keyPhrasesAPI = { };
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

let SaveNewsInDB = function (index)
{
    // check results from API:
    // console.log(JSON.stringify(newsAPI, null, 2));
    // console.log(JSON.stringify(opinionsAPI, null, 2));
    // console.log(JSON.stringify(keyPhrasesAPI, null, 2));

    var N = newsAPI.length;
    var newAPI;
    var id_nu_opinion;
    var id_nu_content;
    var keyPhrases;
    var nKeyPhrases;

    var query_select_id_nu_content;
    var query_insert_tb_content;
    var query_insert_tb_opinion;
    var query_insert_tb_r_content_opinion;
    var query_select_keyPhrase;
    var query_insert_tb_key_phrase;
    var query_insert_tb_r_content_key_phrase;

    if (index < N)
    {
        newAPI = newsAPI[index];

        pg.connect(connectionString, function(err, client, done) 
        {
            query_select_id_nu_content = "SELECT id_nu_content FROM tb_content WHERE url = '"  + newAPI.url  + "'";
            
            client.query(query_select_id_nu_content, function(err, result) 
            {
                done();
                if (err)
                { 
                    console.error("error: \n" + query_select_id_nu_content + '\n' + err);
                }
                else
                { 
                    if (result.rows.length > 0)
                    {
                        id_nu_content = result.rows[0].id_nu_content;
                        console.log("Ya existe: " + id_nu_content + ":" + newAPI.url);

                        SaveNewsInDB(++index);
                    }
                    else
                    {
                        insert_tb_content(newAPI);
                    }
                }
            });
        });
    }
    else
    {
        startAnalisis(terms, ++indexSearch);
    }

    function insert_tb_content(newAPI)
    {
        query_insert_tb_content = 'INSERT INTO tb_content ' +
            '(id_nu_content_type, tittle, description, url, url_image, dtm_date) ' + 
            'VALUES (' +
                "'1','" +
                newAPI.name.replace(/'/g,'') + "','" +
                newAPI.description.replace(/'/g,'') + "','" +
                newAPI.url + "','" +
                (newAPI.image ? newAPI.image.thumbnail.contentUrl : "") + "','" +
                newAPI.datePublished + "') " +
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
            query_insert_tb_opinion = "INSERT INTO tb_opinion (opinion) VALUES (" + opinion + ") RETURNING id_nu_opinion";

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
            query_insert_tb_r_content_opinion = "INSERT INTO tb_r_content_opinion (id_nu_content, id_nu_opinion) VALUES (" + 
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
    
                        keyPhrases = searchKeyPhrases(newAPI.url);
                        nKeyPhrases = keyPhrases.length;
                        saveKeyPhrases(0);
                    }
                });
            });
        }
    }

    function saveKeyPhrases(indexKey)
    {
        if (indexKey < nKeyPhrases)
        {
            pg.connect(connectionString, function(err, client, done) 
            {
                var keyPhrase = keyPhrases[indexKey];
                query_select_keyPhrase = "SELECT id_nu_key_phrase FROM tb_key_phrase WHERE key_phrase = " + "'" + keyPhrase.replace(/'/g,'+') + "'";

                client.query(query_select_keyPhrase, function(err, result) 
                {
                    done();
                    if (err)
                    { 
                        console.error("error: \n" + query_select_keyPhrase + '\n' + err);
                    }
                    else
                    { 
                        if (result.rows.length > 0)
                        {
                            var id_nu_key_phrase = result.rows[0].id_nu_key_phrase;
                            console.log("Ya existe: " + id_nu_key_phrase + ":" + keyPhrase);

                            insert_tb_r_content_key_phrase(id_nu_key_phrase, -1);
                        }
                        else
                        {
                            insert_tb_key_phrase(keyPhrase);
                        }
                    }
                });
            });

            function insert_tb_key_phrase(keyPhrase)
            {
                pg.connect(connectionString, function(err, client, done) 
                {
                    query_insert_tb_key_phrase = "INSERT INTO tb_key_phrase (key_phrase) VALUES ('" + keyPhrase.replace(/'/g,'+') + "') RETURNING id_nu_key_phrase";
    
                    client.query(query_insert_tb_key_phrase, function(err, result) 
                    {
                        done();
                        if (err)
                        { 
                            console.error("error: \n" + query_insert_tb_key_phrase + '\n' + err);
                        }
                        else
                        { 
                            var id_nu_key_phrase = result.rows[0].id_nu_key_phrase;

                            console.log("succeded inserting id_nu_key_phrase: " + id_nu_key_phrase);

                            insert_tb_r_content_key_phrase(id_nu_key_phrase, 1)
                        }
                    });
                });
            }

            function insert_tb_r_content_key_phrase(id_nu_key_phrase, frequency)
            {
                pg.connect(connectionString, function(err, client, done) 
                {
                    query_insert_tb_r_content_key_phrase = "INSERT INTO tb_r_content_key_phrase (id_nu_content, id_nu_key_phrase, frequency) VALUES (" + 
                                                                id_nu_content + "," + 
                                                                id_nu_key_phrase + "," + 
                                                                (frequency > 0 ?  frequency : 1) + ") RETURNING id_nu_content_key_phrase";
    
                    client.query(query_insert_tb_r_content_key_phrase, function(err, result) 
                    {
                        done();
                        if (err)
                        { 
                            console.error("error: \n" + query_insert_tb_r_content_key_phrase + '\n' + err);
                        }
                        else
                        { 
                            console.log("succeded inserting id_nu_content_key_phrase: " + result.rows[0].id_nu_content_key_phrase);

                            saveKeyPhrases(++indexKey);
                        }
                    });
                });
            }
        }
        else
        {
            SaveNewsInDB(++index);
        }
        
    }
}

// Helper functions

let BuildJSONDocs = function ()
{
    // Build JSON to get opinions and key phrases:
    documents = { documents: [] };
    var document;

    var N = newsAPI.length;
    for (var i = 0; i < N; i++) 
    {
        document = { id: newsAPI[i].url, language: languageAPI, text: newsAPI[i].description };
        documents.documents.push(document);    
    }

    Request_Opinion(documents);
}

let searchOpinion = function (url)
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

let searchKeyPhrases = function (url)
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

let startAnalisis = function (termsToSearch, indexSearch)
{
    if (indexSearch < termsToSearch.length)
    {
        var term = termsToSearch[indexSearch].replace(/ /g, '+');

        console.log('=============== Buscando noticias para ' + term + '===============');
        Request_BingNewsSearchAPI(term);
    }
}

var indexSearch = 0;
startAnalisis(terms, indexSearch);