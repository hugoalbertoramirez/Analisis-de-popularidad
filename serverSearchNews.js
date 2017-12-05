'use strict';

// Bing Search APIs v7 (Isaac)
// 30 días a partir de 21 de nov de 2017
// https://api.cognitive.microsoft.com/bing/v7.0/suggestions
// https://api.cognitive.microsoft.com/bing/v7.0/entities
// https://api.cognitive.microsoft.com/bing/v7.0/images
// https://api.cognitive.microsoft.com/bing/v7.0/news
// https://api.cognitive.microsoft.com/bing/v7.0/spellcheck
// https://api.cognitive.microsoft.com/bing/v7.0/videos
// https://api.cognitive.microsoft.com/bing/v7.0
// Key 1: deacf907f3344a08908224848d44bf3d
// Key 2: 4d8f2c183b7c4598ab2422a7b9e5be94

// Entity Linking Intelligence Service API (Hugo)
// Punto de conexión: https://westus.api.cognitive.microsoft.com/entitylinking/v1.0
// Clave 1: f0f0f3f3d3d540fa8affc5fa3c66d5fa
// Clave 2: efd6ce5dbc7c454d97154ba629f5fafc

// Text Analytics API (JC)
// 23 dias a apartir de 21 de nov de 2017
// 5,000 transactions per month.
// Endpoint: https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0
// Key 1: 8005cf47bc6b447db64c4ac0ea973b43
// Key 2: 869c5c790c3a40de924207b501b29a3c

// Emotion API PREVIEW (JC)
// 23 días a partir de 21 de nov de 2017
// 30,000 transactions, 20 per minute.
// Endpoint: https://westus.api.cognitive.microsoft.com/emotion/v1.0
// Key 1: ecb3f17618fb491baebe8fa2b94caff8
// Key 2: db5d3dbb27b644ff92a91e6e82d8703c

// Bing Speech API (JC)
// 23 días a partir de 21 de nov de 2017
// 5,000 transactions, 20 per minute for each feature.
// Endpoint: https://api.cognitive.microsoft.com/sts/v1.0
// Key 1: dc2b1d87519c4e8e8b2dddf7898c2e30
// Key 2: 20ba2fa6a3164530bb5d6e6a20988fea

let https = require('https');
var pg = require('pg');

// Datos Bing Search API:

let bingNewsSearchKey = 'deacf907f3344a08908224848d44bf3d';
let host_BingNewsSearchAPI = 'api.cognitive.microsoft.com';
let path_BingNewsSearchAPI = '/bing/v7.0/news/search';
let limitNumberNews = 100; // MAX = 100

// Datos Text Analytics API:

let hostTextAnaliticsAPI = 'westcentralus.api.cognitive.microsoft.com';
let pathTextAnaliticsAPISentiment =  '/text/analytics/v2.0/sentiment';
let pathTextAnaliticsAPIKeyPhrases = '/text/analytics/v2.0/keyPhrases';

let languageAPI ="es";
let TextAnalysisKey = "8005cf47bc6b447db64c4ac0ea973b43"; 
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
var candidatosPresidencia2018_partidos_estados =
[
    "José Antonio Meade",
    // "Ricardo Anaya",
    // "Margarita Zavala",
    // "Luis Ernesto Derbez",
    // "Rafael Moreno Valle",
    // "Juan Carlos Romero Hicks",
    // "Miguel Márquez",
    // "Ernesto Ruffo",
    // "Miguel Ángel Yunes Linares",
    // "Eruviél Avila",
    // "Manlio Fabio Beltrones",
    // "Enrique Octavio de la Madrid Cordero",
    // "José Antonio Meade",
    // "José Ramón Narro Robles",
    // "Aurelio Nuño Mayer",
    // "Ivonne Aracelly Ortega Pacheco",
    // "Miguel Ángel Osorio Chong",
    // "Luis Videgaray Caso",
    // "Silvano Aureoles Conejo",
    // "Miguel Ángel Mancera",
    // "Graco Luis Ramírez Garrido Abreu",
    // "Juan Zepeda Hernández",
    // "Emilio Álvarez Icaza Longoria",
    // "José Gerardo Rodolfo Fernández Noroña",
    // "Pedro Ferriz de Con",
    // "María de Jesús Patricio Martínez",
    // "Armando Ríos Piter",
    // "Jaime Heliódoro Rodríguez Calderón",
    // "Andrés Manuel López Obrador",

    // "PARTIDO ACCIÓN NACIONAL",
    // "PARTIDO REVOLUCIONARIO INSTITUCIONAL", 
    // "PARTIDO DE LA REVOLUCIÓN DEMOCRÁTICA", 
    // "PARTIDO VERDE ECOLOGISTA DE MÉXICO", 
    // "PARTIDO DEL TRABAJO",
    // "NUEVA ALIANZA",
    // "MOVIMIENTO CIUDADANO",
    // "MOVIMIENTO REGENERACIÓN NACIONAL",
    
    // "AGUASCALIENTES",
    // "BAJA CALIFORNIA",
    // "BAJA CALIFORNIA SUR",
    // "CAMPECHE",
    // "COAHUILA DE ZARAGOZA",
    // "COLIMA",
    // "CHIAPAS",
    // "CHIHUAHUA",
    // "CIUDAD DE MEXICO",
    // "DURANGO",
    // "GUANAJUATO",
    // "GUERRERO",
    // "HIDALGO",
    // "JALISCO",
    // "ESTADO DE MEXICO",
    // "MICHOACAN DE OCAMPO",
    // "MORELOS",
    // "NAYARIT",
    // "NUEVO LEON",
    // "OAXACA",
    // "PUEBLA",
    // "QUERETARO DE ARTEAGA",
    // "QUINTANA ROO",
    // "SAN LUIS POTOSI",
    // "SINALOA",
    // "SONORA",
    // "TABASCO",
    // "TAMAULIPAS",
    // "TLAXCALA",
    // "VERACRUZ DE IGNACIO DE LA LLAVE",
    // "YUCATAN",
    // "ZACATECAS",
];

var terms = candidatosPresidencia2018_partidos_estados;

// Searching news functions:

let Request_BingNewsSearchAPI = function (search) 
{
    var varPath = path_BingNewsSearchAPI + '?q=' + search + '&count=' + limitNumberNews;
    
    if (trending)
    {
        varPath = varPath + '&freshness=Day';
    }


    let request_params = 
    {
        method : 'GET',
        hostname : host_BingNewsSearchAPI,
        path : varPath,
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
    var N = newsAPI.length;

    if (index < N)
    {
        // check results from API:
        // console.log(JSON.stringify(newsAPI, null, 2));
        // console.log(JSON.stringify(opinionsAPI, null, 2));
        // console.log(JSON.stringify(keyPhrasesAPI, null, 2));

        var newAPI;
        var id_nu_opinion;
        var id_nu_content;
        var id_nu_publisher;
        var keyPhrases;
        var nKeyPhrases;

        var query_select_id_nu_content;
        var query_insert_tb_content;
        var query_select_tb_publisher;
        var query_insert_tb_publisher;
        var query_insert_tb_opinion;
        var query_insert_tb_r_content_opinion;
        var query_select_keyPhrase;
        var query_insert_tb_key_phrase;
        var query_insert_tb_r_content_key_phrase;

        newAPI = newsAPI[index];

        pg.connect(connectionString, function(err, client, done) 
        {
            query_select_id_nu_content = "SELECT id_nu_content FROM tb_content WHERE id_nu_content_type = 1 AND url = '"  + newAPI.url  + "'";
            
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
                        console.log("Ya existe la noticia: " + id_nu_content + ":" + newAPI.url);

                        SaveNewsInDB(++index);
                    }
                    else
                    {
                        select_tb_publisher(newAPI)
                    }
                }
            });
        });
    }
    else
    {
        startAnalisis(terms, ++indexSearch);
    }

    function select_tb_publisher(newAPI)
    {
        pg.connect(connectionString, function(err, client, done) 
        {
            query_select_tb_publisher = "SELECT id_nu_publisher FROM tb_publisher WHERE name LIKE '%" + newAPI.provider[0].name + "%'";

            client.query(query_select_tb_publisher, function(err, result) 
            {
                done();
                if (err)
                { 
                    console.error("error: \n" + query_select_tb_publisher + '\n' + err);
                }
                else
                { 
                    if (result.rows.length > 0)
                    {
                        id_nu_publisher = result.rows[0].id_nu_publisher;
                        console.log("Ya existe el publisher: " + id_nu_publisher + ":" + newAPI.provider[0].name);

                        insert_tb_content(newAPI);
                    }
                    else
                    {
                        insert_tb_publisher(newAPI)
                    }
                }
            });
        });
    }

    function insert_tb_publisher(newAPI)
    {
        query_insert_tb_publisher = "INSERT INTO tb_publisher (name, type) " + 
            "VALUES ('" + 
                newAPI.provider[0].name + "','" +
                newAPI.provider[0]._type + "') " +
            "RETURNING id_nu_publisher";

        pg.connect(connectionString, function(err, client, done) 
        {
            pg.connect(connectionString, function(err, client, done) 
            {
                client.query(query_insert_tb_publisher, function(err, result) 
                {
                    done();
                    if (err)
                    { 
                        console.error("error: \n" + query_insert_tb_publisher + '\n' + err);
                    }
                    else
                    { 
                        id_nu_publisher = result.rows[0].id_nu_publisher;
                        console.log("succeded inserting id_nu_publisher: " + id_nu_publisher);

                        insert_tb_content(newAPI);
                    }
                });
            });
        });
    }

    function insert_tb_content(newAPI)
    {
        var id_nu_content_type = trending ? 6 : 1;
        
        query_insert_tb_content = 'INSERT INTO tb_content ' +
            '(id_nu_content_type, tittle, description, url, url_image, dtm_date, id_nu_publisher) ' + 
            "VALUES ('" +
                id_nu_content_type + "','" +
                newAPI.name.replace(/'/g,'') + "','" +
                newAPI.description.replace(/'/g,'') + "','" +
                newAPI.url + "','" +
                (newAPI.image ? newAPI.image.thumbnail.contentUrl : "") + "','" +
                newAPI.datePublished + "','" + 
                id_nu_publisher + "') " +
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
                            console.log("Ya existe la frase: " + id_nu_key_phrase + ":" + keyPhrase);

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
var trending = true;
startAnalisis(terms, indexSearch);