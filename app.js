const express = require('express'); 

//express app
const app = express();

//for css/imgs/etc
app.use(express.static('public'));

//listen for requests
app.listen(3000);

app.get('/', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/main_page.html', { root: __dirname });
});

app.get('/add_establishment', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/add_establishment.html', { root: __dirname });
});

app.get('/admin_page', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/admin_page.html', { root: __dirname });
});

app.get('/edit_establishment', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/edit_establishment.html', { root: __dirname });
});

app.get('/edit_profile', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/edit_profile.html', { root: __dirname });
});

app.get('/edit_review', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/edit_review.html', { root: __dirname });
});

app.get('/login_as', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/login_as.html', { root: __dirname });
});

app.get('/login', (req, res) => {

    //res.send('<p>Home Page</p>');
    res.sendFile('./views/login.html', { root: __dirname });
});

app.get('/signup', (req, res) => {

    //res.send('<p>Home Page</p>');
    res.sendFile('./views/signup.html', { root: __dirname });
});

app.get('/view_establishment', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/view_establishment.html', { root: __dirname });
});

app.get('/view_profile', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/view_profile.html', { root: __dirname });
});

app.get('/visit_profile', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/visit_profile.html', { root: __dirname });
});

app.get('/write_review', (req, res) => {
    //res.send('<p>Home Page</p>');
    res.sendFile('./views/write_review.html', { root: __dirname });
});

//404 page
app.use((req, res) => {
    res.send ('404: Page Not Found');
});