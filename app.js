const express = require("express");
const app = express();
const fs = require('fs').promises;
const { Pool } = require('pg');
require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.listen(3000, () => {
console.log("El servidor está inicializado en el puerto 3000");
});

let config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
}
const pool = new Pool(config)

app.get("/", (req, res) =>{
    res.sendFile(__dirname + "/index.html") 
})

app.post("/usuario", async(req, res) =>{
    try {
        let {nombre, balance} = req.body
        let query = {
            text: "INSERT INTO usuarios VALUES (default, $1, $2) RETURNING *",
            values: [nombre, balance]
        }
        let response = await pool.query(query)
        res.status(201).send(response)
    } catch (error) {
        res.status(500).send(error)
    }
})

 app.get("/usuarios", async(req, res) =>{
     try {
         let query = {
             text: "SELECT * FROM usuarios",
         }
         let response = await pool.query(query)
         res.status(200).send(response.rows)
     } catch (error) {
        res.status(500).send(error)
     }
 })

 app.put("/usuario", async(req, res) =>{
    console.log(req)
     try {
         let {name, balance} = req.body
         let {id} = req.query
         let query = {
             text: "UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3 RETURNING *;",
             values: [name, balance, id]
         }
         let response = await pool.query(query)
         res.status(201).send(response.rows)
     } catch (error) {
        res.status(500).send(error)
     }
 })

 app.delete("/usuario", async(req, res) =>{
     try {
         let {id} = req.query
         let query = {
             text: "DELETE FROM usuarios WHERE id = $1",
             values: [id]
         }
         let response = await pool.query(query)
         res.status(200).send(response)
     } catch (error) {
        res.status(500).send(error)
     }
 })

 app.post("/transferencia", async(req, res) =>{
     try {
         let {emisor, receptor, monto} = req.body

         let sumarSaldo = {
            text: "UPDATE usuarios SET balance = balance + $1 WHERE id = $2",
            values: [monto, receptor]
        }

        let restarSaldo = {
            text: "UPDATE usuarios SET balance = balance - $1 WHERE id = $2",
            values: [monto, emisor]
        }

         let transferencias = {
             text: "INSERT INTO transferencias VALUES (default, $1, $2, $3, NOW()) RETURNING *",
             values: [emisor, receptor, monto]
         }
         await pool.query("BEGIN")
         await pool.query(sumarSaldo)
         await pool.query(restarSaldo)
         let comprobante = await pool.query(transferencias)
         await pool.query("COMMIT")
 
         res.status(201).send({
             mensaje: "Transferencia realizada con éxito",
             data:comprobante.rows
         })
     } catch (error) {
        res.status(500).send(error)
     }
 })

 app.get("/transferencias", async(req, res) =>{
     try {
         let query = {
             text: "SELECT t.id, u_emisor.nombre as emisor, u_receptor.nombre as receptor, t.monto, t.fecha FROM transferencias t INNER JOIN usuarios u_emisor ON t.emisor = u_emisor.id INNER JOIN usuarios u_receptor ON t.receptor = u_receptor.id ORDER BY t.fecha DESC",
             rowMode: "array"
         }
         let response = await pool.query(query)
          res.status(200).send(response.rows)
     } catch (error) {
        res.status(500).send(error)
     }
 })

 