const express = require("express");
const {google} = require("googleapis");
const path = require('path');

const app = express();
const MAX_OPERATIONS = 5; // Número máximo de operaciones a mostrar

let operations = []; // Array para almacenar las operaciones
let data = {};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.get('/login', (req, res) => {
    // Render the login page
    res.render('login');
});
app.get('/', (req, res) => {
    
    const firstTenOperations = operations.slice(0, MAX_OPERATIONS); // Obtener las primeras diez operaciones
    res.render('index', { data, operations: firstTenOperations }); // Pasar las operaciones al template
})
app.post('/login', (req, res) => {
    // Handle login form submission
    const { username, password } = req.body;
    // Perform authentication logic here
    // ...
    // Redirect to the main page after successful login
    res.redirect('/');
});
app.post ("/", async(req, res) =>{
    const {date,descripcionOperacion,categoriaOperacion,montoOperacion,tipoOperacion }= req.body;
    const parts = date.split("-"); // Dividir la fecha en partes (año, mes, día)
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // Formato: día/mes/año
    if (isNaN(parseFloat(montoOperacion))) {
        // El monto no es un número válido
        const firstTenOperations = operations.slice(0, MAX_OPERATIONS); // Obtener las primeras diez operaciones
        res.render('index', { data, operations: firstTenOperations, errorMessage: 'Ingrese un número válido para el monto' });
        return;
    }
    data = {
        date: formattedDate,
        descripcionOperacion: req.body.descripcionOperacion,
        categoriaOperacion: req.body.categoriaOperacion,
        montoOperacion: req.body.montoOperacion,
        tipoOperacion: req.body.tipoOperacion
      };
      
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",

    });
    
    const client = await auth.getClient();
    const sheets = google.sheets({version: "v4", auth});
    const spreadsheetId = "1NgDdM7pFLMFjjRUWFwcSu9HdYRPJ-MvM_rvQAZrsBxk";
    const metaData = await sheets.spreadsheets.get({
        auth,
        spreadsheetId,

    })
    //obtiene la filas
    const getRows = await sheets.spreadsheets.values.get({
       auth,
        spreadsheetId,
        range: "registro de gastos",

     }); 
     console.log(getRows.data.values)
//envia los datos del form
    await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'registro de gastos',
        valueInputOption: "USER_ENTERED",
        resource : {
            values: [
                [
                    `=MES(C${getRows.data.values.length + 1})`,
                    `=AÑO(C${getRows.data.values.length + 1})`,
                    date,
                    categoriaOperacion,
                    tipoOperacion,
                    montoOperacion,
                   descripcionOperacion
                ]
            ]
        }
        
        
    }) 

    // Agregar nueva operación al principio del array
    operations.unshift(data);
    
    // Si el array tiene más de diez operaciones, eliminar la última
    if (operations.length > MAX_OPERATIONS) {
        operations.pop();
    }
    
    res.redirect('/');
})

app.listen(1337, async(req, res) => console.log("hi"));