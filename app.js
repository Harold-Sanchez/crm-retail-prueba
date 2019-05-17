const hbs = require('hbs');
var oracledb = require('oracledb');
let bodyParser = require('body-parser');

var mypw = '2019*';

oracledb.autoCommit = true;


const config = {
  user: "SYSTEM",
  password: mypw,
  connectString: "localhost:1521/orclpdb"
};

async function run() {

  let conn;

  try {

    conn = await oracledb.getConnection(config);

    let result = await conn.execute(
      `SELECT * FROM CAMPAIGN`,
    );

    VARIABLE = result.rows;


    console.log(result);



  } catch (err) {
    console.error(err);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

run();

async function insert(query) {

  let conn;

  try {
    conn = await oracledb.getConnection(config);

    const result = await conn.execute(
      `INSERT INTO CAMPAIGN VALUES (ID_CAMPAIGN.NEXTVAL,` + query + `)`,
    );

    console.log(result);
    run();

  } catch (err) {
    console.log('Ouch!', err);
  } finally {
    if (conn) { 
      await conn.close();
    }
  }

}

function readFileCSV(fileUploadCSV) {
  const fs = require('fs');
  const csv = require('csv-parse');

  const parseador = csv({
    delimiter: ',',
    cast: true,
    comment: '#'
  });

  parseador.on('readable', function () {
    let fila;
    while (fila = parseador.read()) {
      console.log(fila);
      insert(fila);
    }
    run();
  });

  parseador.on('error', function (err) {
    console.error("Error al leer CSV:", err.message);
  });

  fs.createReadStream("./files/" + fileUploadCSV)
    .pipe(parseador)
    .on("end", function () {
      console.log("Se ha terminado de leer el archivo");
      parseador.end();
    });
}

function readFile(fileUpload) {
  const readline = require("readline"),
    fs = require("fs"),
    NOMBRE_ARCHIVO = "./files/" + fileUpload;

  let lector = readline.createInterface({
    input: fs.createReadStream(NOMBRE_ARCHIVO)
  });


  lector.on("line", linea => {

    var lineArr = '';

    if (linea.includes(',')) {
      lineArr = linea.split(',');
    }

    if (linea.includes(';')) {
      lineArr = linea.split(';');
    }

    if (linea.includes('%')) {
      lineArr = linea.split('%');
    }

    console.log('arr', lineArr);
    insert(lineArr);

  });

}

// ---- express ---
const express = require('express')
const fileUpload = require('express-fileupload')
const app = express()

app.use(fileUpload())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.set('view engine', 'hbs');

app.post('/upload', (req, res) => {
  let EDFile = req.files.file
  EDFile.mv(`./files/${EDFile.name}`, err => {
    if (err) return res.status(500).send({ message: err })

    let ext = EDFile.name.split('.').pop();

    if (ext == 'txt'){
      readFile(EDFile.name);

      return res.status(200).send(
        { message: '¡'+EDFile.name+' importado correctamente!' }
        )
    }else if(ext == 'csv'){
      readFileCSV(EDFile.name);

      return res.status(200).send(
        { message: '¡'+EDFile.name+' importado correctamente!' }
        )
    }else{
      return res.status(400).send(
        { message: 'Archivo no permitido' }
        )
    }

    
  })
})

app.get('/', function (req, res) {
  res.render('home', {
    list_data: VARIABLE,
  })
  run();
})

app.listen(3000)

