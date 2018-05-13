// EXPRESS
var express = require('express');
var app = express();
app.use(express.static(__dirname));

// parse application/x-www-form-urlencoded
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// set environment variable to override port
app.set('port', process.env.PORT || 3000);

// HANDELBARS
var handlebars = require('express-handlebars').create({
    defaultLayout:'main',
    // register handlebars helper function to format dates in list
    helpers: {
        formatDate: function(date) {
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            if(month < 10) {
                month = "0" + month;
            }
            if(day < 10) {
            day = "0" + day;
            }
            return year + "-" + month + "-" + day;
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// MONGODB
var mongoose = require('mongoose');
// format: 'mongodb://<username>:<password>@ds117200.mlab.com:17200/todos'
const url = 'mongodb://user01:palpebralfissures@ds117200.mlab.com:17200/todos';
mongoose.connect(url, (err) => {
    if(err) console.log(err);
    console.log("connected to DB")
});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// DB MODEL
// a schema represents a collection and defines the shape of a document in that collection
var Schema = mongoose.Schema;
var todoSchema = new Schema({
    description: String,
    deadline: { type: Date, default: Date.now },
    progress: Number
});
// convert schema to model. instances of models are documents
var todoModel = mongoose.model('ToDo', todoSchema);

/*
* page to create TO-DO
* */
app.get('/addTODO', function(req, res) {
    res.render('create');
});

/*
* create new to-do if it doesnt exists
* */
app.post('/addTODO', (req, res) => {

    var todo = new todoModel(req.body);

    // insert document only if to-do doesnt exist
    todo.save((err, todo) => {
        if (err) {
            if(err.code === 11000) {
                console.log("TODO already exists");
            } else console.log(err);
        } else {
            console.log("saved : " + JSON.stringify(todo));
        }
    });
    res.redirect('/');
})

/*
* target of submit
* */
app.post("/editTODO", (req, res) => {

    todoModel.findById(req.body.id, (err, todo) => {
        if(err) console.log(err);

        res.render('edit', {_id: todo.id, description: todo.description, deadline: todo.deadline, progress: todo.progress});
    });
});

/*
*
* */
app.post("/updateTODO", (req, res) => {
    todoModel.findByIdAndUpdate(req.body.id, req.body, (err, todo) => {
        if(err) console.log(err);
    });
    res.redirect('/');
});

/*
*
* */
app.post("/deleteTODO", (req, res) => {
    todoModel.findByIdAndRemove(req.body.id, (err) => {
        if (err)
            console.log(err);
        else
            console.log("doc removed");
    });
    res.redirect('/');
});

/*
* list all todos
* */
app.get("/", (req, res) => {

    todoModel.find({}, (err, todo) => {
        if(err) console.log(err);

        var todos = todo.map((todo) => {
            return todo;
        });
        // send todos array to dynamically render table of todos in home.handlebars
        res.render('home', {title: 'List TODOs', todos: todos});
    });
});

/*
*
* */
app.get("/imprint", (req, res) => {
    //res.status(200);
    res.render('imprint', {title: 'Imprint'});
});

// 404 catch-all handler
app.use((req, res, next) => {
    res.status(404);
    res.render('404', {title: '404'});
})

// 500 error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500);
    res.render('500', {title: '500'});
})

//
app.listen(app.get('port'), () => {
    console.log( 'Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate...' );
})