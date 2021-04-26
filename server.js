var express = require('express');
var app = express();

var jwt = require('jsonwebtoken');

const multer = require('multer');

const readXlsxFile = require('read-excel-file/node');

var cors = require('cors');

var xlsxtojson = require("xlsx-to-json");
var xlstojson = require("xls-to-json");

global.__basedir = __dirname;

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Max-Age", "3600");
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    next();
});
// configuration
app.use(express.static(__dirname + '/public')); 

app.use('/public/uploads',express.static(__dirname + '/public/uploads'));   

var PORT = process.env.PORT || 3000;

var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "chandra4418",
    password: "Krish@4418",
    database: "student_quiz"
})

con.connect();

// -> Multer Upload Storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
	   cb(null, __basedir + '/uploads/')
	},
	filename: (req, file, cb) => {
	   cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
	}
});

const upload = multer({storage: storage});

// -> Express Upload RestAPIs
app.post('/api/uploadfile', upload.single("uploadfile"), (req, res) =>{
	importExcelData2MySQL(__basedir + '/uploads/' + req.file.filename);
	res.json({
				'msg': 'File uploaded/import successfully!', 'file': req.file
			});
});

// -> Import Excel Data to MySQL database
function importExcelData2MySQL(filePath){
	// File path.
	readXlsxFile(filePath).then((rows) => {
		// `rows` is an array of rows
		// each row being an array of cells.	 
		console.log(rows);
	 
		/**
		[ [ 'Id', 'Name', 'Address', 'Age' ],
		[ 1, 'Jack Smith', 'Massachusetts', 23 ],
		[ 2, 'Adam Johnson', 'New York', 27 ],
		[ 3, 'Katherin Carter', 'Washington DC', 26 ],
		[ 4, 'Jack London', 'Nevada', 33 ],
		[ 5, 'Jason Bourne', 'California', 36 ] ] 
		*/
	 
		// Remove Header ROW
		rows.shift();

	 	let query = 'INSERT INTO questions (qnId, question, option1, option2, option3, option4, actual_answer, user_answer) VALUES ?';
		con.query(query, [rows], (error, response) => {
		console.log(error || response);
				});
  });
}


app.listen(PORT, function () {
    console.log('Example app listening on port 3000!');
  });

app.use(cors());

app.use(express.json());

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, "chandra4418");
  
    next();
    
  }

  app.post('/api/xlstojson', function(req, res) {
    xlsxtojson({
        input: "./sample.xlsx",  // input xls
        output: "output.json", // output json
        lowerCaseHeaders:true
    }, function(err, result) {
        if(err) {
          res.json(err);
        } else {
          res.json(result);
        }
    });
});

app.get('/getQuestions', authenticateToken, function (req, res) {
    con.query('SELECT * FROM questions', (err, result, fields) => {
        if (err) {
            throw err;
        } else {
            res.send({data: result, totalQues: result.length});
        }
    }
   );
  })

  app.get('/getPartcipants', function (req, res) {
    con.query('SELECT * FROM signup', (err, result, fields) => {
        if (err) {
            throw err;
        } else {
            res.send({data: result, totalParticipant: result.length});
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
  
