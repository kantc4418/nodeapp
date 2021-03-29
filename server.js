var express = require('express');
var app = express();

var jwt = require('jsonwebtoken');

var cors = require('cors');
const bodyParser = require('body-parser');

var PORT = process.env.PORT || 3000;

var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "emp_management"
})

con.connect();

app.listen(PORT, function () {
    console.log('Example app listening on port 3000!');
  });

app.use(cors());

app.use(bodyParser.json());

app.get('/getQuestions', function (req, res) {
    con.query('SELECT * FROM questions', (err, result, fields) => {
        if (err) {
            throw err;
        } else {
            res.send(result);
        }
    }
   );
  })

app.post('/registerUser', function (req, res) {
con.query(
    'INSERT INTO signup (name, email, password) VALUES (?,?,?)',
    [req.body.name, req.body.email, req.body.password],
    (error) => {
    if (error) {
        console.error(error);
        res.status(500).json({status: 'error'});
    } else {
        res.status(200).json({status: 'user has been registered successfully'});
    }
    }
);
})
  
app.post('/loginUser', function (req, res) {
    var formemail= req.body.email;
    var formpassword = req.body.password;
    if (formemail && formpassword) {
    con.query('SELECT * FROM signup WHERE email = ? AND password = ?', [formemail, formpassword], function(error, results, fields) {
    if (results.length > 0) {
                // res.status(200).json({status: 'success'});
                var token = jwt.sign({ id: results.id }, "chandra4418", {
                expiresIn: 86400 // expires in 24 hours
                });
                res.status(200).send({ status: 'success', auth: true, token: token });
                // res.send('user logged in successgully');
    } else {
                res.status(500).json({status: 'error'});
        // res.send('Incorrect Username and/or Password!');
    }     
    res.end();
    });
} else {
    res.send('Please enter Username and Password!');
    res.end();
}
})
  
