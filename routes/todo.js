let express = require('express');
let router = express.Router();

const fs = require('fs');

/* GET home page. */
//let todo = new Array(); 

//Показване на Login форма
router.get('/login', function(req, res) {
	res.render('login', {info: 'PLEASE LOGIN'});
});
//Може да тестваме логин формата --> npm start или nodemon --> http://127.0.0.1:3000/todo/login
//Защо при изпращане на данните от формата възникна грешка?

//Създаване на сесия след успешен Login
session = require('express-session'); //Как да инсталираме и намерим информация за този модул?
router.use(session({
    secret: 'random string',
    resave: true,
    saveUninitialized: true,
}));

sqlite3 = require('sqlite3');
db = new sqlite3.Database('todo.sqlitedb');
db.serialize();
db.run(`CREATE TABLE IF NOT EXISTS todo(
    id INTEGER PRIMARY KEY,
    user TEXT NOT NULL,
    task TEXT,
    url TEXT,
    date_created TEXT,
    date_modified TEXT)`
);
db.parallelize();

fileUpload = require('express-fileupload');
router.use(fileUpload());

bcrypt = require('bcryptjs');
users = require('./passwd.json');

router.post('/login', function(req, res){
	bcrypt.compare(req.body.password, users[req.body.username] || "", function(err, is_match) {
		if(err) throw err;
		if(is_match === true) {
			req.session.username = req.body.username;
			req.session.count = 0;
			res.redirect("/todo/");
		} else {
			res.render('login', {warn: 'TRY AGAIN'});
		}
	});
});
//Може да тестваме логин формата --> http://127.0.0.1:3000/todo/login

//Logout - унищожаване на сесия
router.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect("/todo/");
});

//Всеки потребител със собствен файл
//let filename = "";



router.all('*', function(req, res, next) {
	if(!req.session.username) {
		res.redirect("/todo/login");
		return;
	}
	next();
/*
	filename = req.session.username + ".txt";
	fs.readFile(filename, (err, data) => {
		if(err) todo = new Array();
		else {
			todo = data.toString().split("\n").filter(s => s.length > 0);
		}
		next();
	});
*/	
});

router.get('/', function(req, res, next) {
	req.session.count++;
	s = "User: " + req.session.username + " Count: " + req.session.count + " " + new Date();
//	res.render('todo', { info: s, todo: todo });
	db.all('SELECT * FROM todo ORDER BY date_modified DESC;', function(err, rows) {
		if(err) throw err;
		res.render('todo', { info: s, rows: rows });
	});
});

/*
router.post('/', function(req, res, next) {
	let q = req.body;
	if(q.action=="add") todo.push(q.todo);
	if(q.action=="del") todo.splice(q.todo, 1);
	if(q.action=="add" || q.action=="del") {
		let txt = '';
		for(v of todo) txt += v+"\n";
		fs.writeFile(filename, txt, (err) => {
			if (err) throw err;
			console.log('The file has been saved!');
		});
	}
//	res.render('todo', { title: 'Express', todo: todo });
res.redirect("/todo/");
});
*/

//CREATErud + Picture upload
router.post('/upload',(req, res) => {
    url = "";
    if(req.files && req.files.file) {
        req.files.file.mv('./public/images/' + req.files.file.name, (err) => {
            if (err) throw err;
        });
        url = '/images/' + req.files.file.name;
    }
        
    db.run(`
        INSERT INTO todo(
            user,
            task,
            url,
            date_created,
            date_modified
        ) VALUES (
            ?,
            ?,
            ?,
            DATETIME('now','localtime'),
            DATETIME('now','localtime'));
        `,
        [req.session.username, req.body.task || "", url],
        (err) => {
            if(err) throw err;
            res.redirect('/todo/');
        });
});

//cruDELETE
router.post('/delete', (req, res) => {
    db.run('DELETE FROM todo WHERE id = ?', req.body.id, (err) => {
        if(err) throw err;
        res.redirect('/todo/');
    });
});

//crUPDATEd
router.post('/update', (req, res) => {
    db.run(`UPDATE todo
            SET user = ?,
                task = ?,
                url = ?,
                date_modified = DATETIME('now','localtime')
            WHERE id = ?;`,
        req.session.username,
        req.body.task,
        req.body.url,
        req.body.id,
        (err) => {
            if(err) throw err;
            res.redirect('/todo/');
    });
});

router.all('*', function(req, res) {
    res.send("No such page or action! Go to: <a href='/todo/'>main page</a>");
});

module.exports = router;
