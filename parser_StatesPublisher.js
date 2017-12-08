// npm install fast-csv
var csv = require("fast-csv");
var fs = require("fs");
var pg = require('pg');

// Datos base de datos:

var userName = 'Empower_User';
var password = '3mp0w3rd4t4r00t';
var server = 'dbdevelop.cywmxo6vg4sl.us-west-2.rds.amazonaws.com';
var port = '5432';
var database = 'politica';
let connectionString = 'pg://' + userName + ':' + password + '@' + server + ':' + port + '/' + database;

let parserRow = function (index)
{
    if (index < rows.length)
    {
        var row = rows[index];
        console.log(row);

        if (row[1] == "")
        {
            console.log("=============================" + row[0] + "==================");
            parserRow(++index);
        }
        else
        {
            var typePub = "";
            switch (row[2])
            {
                case "BC":
                    if (row[5])
                    {
                        typePub = row[5];
                    }
                break;
                case "IN":
                    typePub = "Internet";
                break;
                case "MG":
                    typePub = "Revista";
                break;
                case "NP":
                    typePub = "Periódico";
                break;
                case "PA":
                    typePub = "Agencia de Prensa";
                break;
            }

            var namePub = row[1];
            var id_nu_state = null;

            if (row[6] !== "")
            {
                var id_nu_state = row[6];
            }
                
            insert_tb_publisher(typePub, namePub, id_nu_state, index);
        }
    }
    else
    {
        console.log("Done :)");
    }
}

function insert_tb_publisher(typePub, namePub, id_nu_state, index)
{
    var id_nu_publisher;  
    
    var query_insert_tb_publisher = "INSERT INTO tb_publisher (name, type) " + 
        "VALUES ('" + 
            namePub + "','" +
            typePub + "') " +
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

                if (id_nu_state)
                {
                    insert_tb_r_publisher_state(id_nu_publisher, id_nu_state, index); 
                }
                else
                {
                    insert_tb_r_publisher_state(id_nu_publisher, 0, index); 
                }
            }
        });
    });
}

function insert_tb_r_publisher_state(id_nu_publisher, id_nu_state, index)
{
    var id_nu_publisher_state;

    var query_insert_tb_r_publisher_state = "INSERT INTO tb_r_publisher_state (id_nu_publisher, id_nu_state) " + 
        "VALUES ('" + 
            id_nu_publisher + "','" +
            id_nu_state + "') " +
        "RETURNING id_nu_publisher_state";
                   

    pg.connect(connectionString, function(err, client, done) 
    {
        client.query(query_insert_tb_r_publisher_state, function(err, result) 
        {
            done();
            if (err)
            { 
                console.error("error: \n" + query_insert_tb_r_publisher_state + '\n' + err);
            }
            else
            { 
                id_nu_publisher_state = result.rows[0].id_nu_publisher_state;
                console.log("succeded inserting id_nu_publisher_state: " + id_nu_publisher_state);

                parserRow(++index);
            }
        });
    });
}

var rows = [];

let startParser = function()
{
    var stream = fs.createReadStream("PublishersMexico.csv");

    var csvStream = csv().on("data", function(row)
    {
        rows.push(row);
    })
    .on("end", function()
    {
        //console.log(JSON.stringify(rows));
        parserRow(0);
    });

    stream.pipe(csvStream);
}

startParser();
