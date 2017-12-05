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

let bingVideosSearchKey = 'deacf907f3344a08908224848d44bf3d';
let host_BingVideosSearchAPI = 'api.cognitive.microsoft.com';
let path_BingVideosSearchAPI = '/bing/v7.0/videos/search';
let limitNumberNews = 20; // MAX = 100

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

var videosAPI;
var keyPhrasesAPI;
var opinionsAPI;
var documents = { documents: [] };

// Fuente: https://elmercurio.com.mx/nacional/conoce-los-28-aspirantes-a-la-presidencia-mexico-en-2018
var candidatosPresidencia2018_partidos_estados =
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

    "PARTIDO ACCIÓN NACIONAL",
    "PARTIDO REVOLUCIONARIO INSTITUCIONAL", 
    "PARTIDO DE LA REVOLUCIÓN DEMOCRÁTICA", 
    "PARTIDO VERDE ECOLOGISTA DE MÉXICO", 
    "PARTIDO DEL TRABAJO",
    "NUEVA ALIANZA",
    "MOVIMIENTO CIUDADANO",
    "MOVIMIENTO REGENERACIÓN NACIONAL",
    
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

let Request_BingVideosSearchAPI = function (search) 
{
    let request_params = 
    {
        method : 'GET',
        hostname : host_BingVideosSearchAPI,
        path : path_BingVideosSearchAPI + '?q=' + search + '&count=' + limitNumberNews + '&freshness=Day',
        headers : 
        {
            'Ocp-Apim-Subscription-Key' : bingVideosSearchKey,
        }
    };

    let req = https.request(request_params, ResponseHandler_BingVideosSearchAPI);
    req.end();
}

let ResponseHandler_BingVideosSearchAPI = function (response) 
{
    let body = '';
    videosAPI = { };
    response.on('data', function (d) 
    {
        body += d;
    });
    response.on('end', function () 
    {
        videosAPI = (JSON.parse(body)).value;
        //console.log(JSON.stringify(videosAPI, null, 4));
        SaveVideosInDB(0);
    });
    response.on('error', function (e) {
        console.log('Error ResponseHandler_BingVideosSearchAPI: ' + e.message);
    });
};

// Database functions:

let SaveVideosInDB = function (index)
{
    if (videosAPI == undefined)
    {
        startAnalisis(terms, ++indexSearch);
        return;
    }

    var N = videosAPI.length;

    if (index < N)
    {
        // check results from API:
        //console.log(JSON.stringify(videosAPI, null, 2));

        if (videosAPI[index].embedHtml == undefined || videosAPI[index].embedHtml== null || videosAPI[index].embedHtml == "")
        {
            SaveVideosInDB(++index);
            return;
        }

        var videoAPI = videosAPI[index];
        var id_nu_content;
        var id_nu_publisher;
        var id_nu_encoding_format;
        var id_nu_video_info;

        var query_select_id_nu_content;
        var query_insert_tb_content;
        var query_select_tb_publisher;
        var query_insert_tb_publisher;
        var query_select_tb_cat_encoding_format;
        var query_insert_tb_cat_encoding_format;
        var query_insert_tb_video_info;

        var str = videosAPI[index].embedHtml;
        console.log(str);
        var startIndex = str.search(/http/);
        var endIndex = str.substring(startIndex, str.length).search(/\?/i);
        if (endIndex == -1)
        {
            endIndex = str.substring(startIndex, str.length).search(/ /i);
        }
        var urlVideo = str.substring(startIndex, endIndex +startIndex);
        console.log(startIndex + " + " + endIndex);

        pg.connect(connectionString, function(err, client, done) 
        {
            query_select_id_nu_content = "SELECT id_nu_content FROM tb_content WHERE id_nu_content_type = 4 AND url = '"  + urlVideo  + "'";
            
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
                        console.log("Ya existe el video: " + id_nu_content + ":" + urlVideo);

                        SaveVideosInDB(++index);
                        return;
                    }
                    else
                    {
                        select_tb_publisher(videoAPI)
                    }
                }
            });
        });
    }
    else
    {
        startAnalisis(terms, ++indexSearch);
        return;
    }

    function select_tb_publisher(videoAPI)
    {
        pg.connect(connectionString, function(err, client, done) 
        {
            query_select_tb_publisher = "SELECT id_nu_publisher FROM tb_publisher WHERE name = '" + videoAPI.publisher[0].name + "'";

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
                        console.log("Ya existe el publisher: " + id_nu_publisher + ":" + videoAPI.publisher[0].name);

                        insert_tb_content(videoAPI); 
                    }
                    else
                    {
                        insert_tb_publisher(videoAPI)
                    }
                }
            });
        });
    }

    function insert_tb_publisher(videoAPI)
    {
        query_insert_tb_publisher = "INSERT INTO tb_publisher (name, creator) " + 
            "VALUES ('" + 
                videoAPI.publisher[0].name + "','" +
                videoAPI.name + "') " +
            "RETURNING id_nu_publisher";

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

                    insert_tb_content(videoAPI); 
                }
            });
        });
    }

    function insert_tb_content(videoAPI)
    {
        query_insert_tb_content = 'INSERT INTO tb_content ' +
            '(id_nu_content_type, tittle, description, url, url_image, dtm_date, id_nu_publisher) ' + 
            'VALUES (' +
                "'4','" +
                videoAPI.name.replace(/'/g,'') + "','" +
                (videoAPI.description ? videoAPI.description.replace(/'/g,'') : null) + "','" +
                urlVideo + "','" +
                videoAPI.thumbnailUrl + "','" +
                videoAPI.datePublished + "','" + 
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

                    save_video_info(videoAPI);
                }
            });
        });
    }

    function save_video_info(videoAPI)
    {
        query_select_tb_cat_encoding_format = "SELECT id_nu_encoding_format FROM tb_cat_encoding_format WHERE name = '" + videoAPI.encodingFormat + "'";
    
        pg.connect(connectionString, function(err, client, done) 
        {
            client.query(query_select_tb_cat_encoding_format, function(err, result) 
            {
                done();
                if (err)
                { 
                    console.error("error: \n" + query_select_tb_cat_encoding_format + '\n' + err);
                }
                else
                { 
                    if (result.rows.length > 0)
                    {
                        id_nu_encoding_format = result.rows[0].id_nu_encoding_format;
                        console.log("Ya existe el formato: " + videoAPI.encodingFormat);

                        insert_tb_video_info(videoAPI); 
                    }
                    else
                    {
                        insert_tb_cat_encodig_format(videoAPI)
                    }
                }
            });
        });


        function insert_tb_cat_encodig_format(videoAPI)
        {
            query_insert_tb_cat_encoding_format = 'INSERT INTO tb_cat_encoding_format ' +
                '(name) ' + 
                "VALUES ('" +
                    videoAPI.encodingFormat + "') " +
                "RETURNING id_nu_encoding_format";
        
            pg.connect(connectionString, function(err, client, done) 
            {
                client.query(query_insert_tb_cat_encoding_format, function(err, result) 
                {
                    done();
                    if (err)
                    { 
                        console.error("error: \n" + query_insert_tb_cat_encoding_format + '\n' + err);
                    }
                    else
                    { 
                        id_nu_encoding_format = result.rows[0].id_nu_encoding_format;
                        console.log("succeded inserting id_nu_encoding_format: " + id_nu_encoding_format);

                        insert_tb_video_info(videoAPI); 
                    }
                });
            });
        }

        function insert_tb_video_info(videoAPI)
        {
            var dur, T, H, M, S;

            if (videoAPI.duration)
            {
                dur = convertISO806Duration(videoAPI.duration);
            }
            else
            {
                dur = null;
            }
            
            query_insert_tb_video_info = 'INSERT INTO tb_video_info  ' +
                '(id_nu_content, id_nu_encoding_format, "video_id_API", url_page, url_motion_thumbnail, width_video, height_video, width_image, height_image, "viewCount", duration) ' + 
                "VALUES ('" +
                    id_nu_content + "','" + 
                    id_nu_encoding_format + "','" + 
                    (videoAPI.videoId ? videoAPI.videoId : null) + "','" + 
                    (videoAPI.hostPageUrl ? videoAPI.hostPageUrl : null) + "','" + 
                    (videoAPI.motionThumbnailUrl ? videoAPI.motionThumbnailUrl : null) + "','" + 
                    (videoAPI.width ? videoAPI.width : null) + "','" + 
                    (videoAPI.height ? videoAPI.height : null) + "','" + 
                    (videoAPI.thumbnail ? videoAPI.thumbnail.width : null) + "','" + 
                    (videoAPI.thumbnail ? videoAPI.thumbnail.height : null) + "','" + 
                    (videoAPI.viewCount ? videoAPI.viewCount : -1) + "'," + 
                    (dur ? "'" + dur + "'" : null) + 
                ") " +
                "RETURNING id_nu_video_info";
    
            pg.connect(connectionString, function(err, client, done) 
            {
                client.query(query_insert_tb_video_info, function(err, result) 
                {
                    done();
                    if (err)
                    { 
                        console.error("error: \n" + query_insert_tb_video_info + '\n' + err);
                    }
                    else
                    { 
                        id_nu_video_info = result.rows[0].id_nu_video_info;
                        console.log("succeded inserting id_nu_video_info: " + id_nu_video_info);

                        SaveVideosInDB(++index);
                        return;
                    }
                });
            });
        }
    }

}

// Helper functions

let convertISO806Duration = function(str)
{
    var iso8601DurationRegex = /(-)?P(?:([\.,\d]+)Y)?(?:([\.,\d]+)M)?(?:([\.,\d]+)W)?(?:([\.,\d]+)D)?T(?:([\.,\d]+)H)?(?:([\.,\d]+)M)?(?:([\.,\d]+)S)?/;
    
    var matches = str.match(iso8601DurationRegex);

    var hrs = matches[6] ? matches[6] : "00";
    var mins = matches[7] ? matches[7] : "00";
    var segs = matches[8] ? matches[8] : "00";

    return hrs + ":" + mins + ":" + segs;
    // return {
    //     sign: matches[1] === undefined ? '+' : '-',
    //     years: matches[2] === undefined ? 0 : matches[2],
    //     months: matches[3] === undefined ? 0 : matches[3],
    //     weeks: matches[4] === undefined ? 0 : matches[4],
    //     days: matches[5] === undefined ? 0 : matches[5],
    //     hours: matches[6] === undefined ? 0 : matches[6],
    //     minutes: matches[7] === undefined ? 0 : matches[7],
    //     seconds: matches[8] === undefined ? 0 : matches[8]
    // };
}

let startAnalisis = function (termsToSearch, indexSearch)
{
    if (indexSearch < termsToSearch.length)
    {
        var term = termsToSearch[indexSearch].replace(/ /g, '+');

        console.log('=============== Buscando videos de ' + term + '===============');
        Request_BingVideosSearchAPI(term);
    }
}

var indexSearch = 0;
startAnalisis(terms, indexSearch);
