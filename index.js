var app = require('express')();
var fs = require('fs');
var scribd = require('./main.js');
var web = fs.readFileSync('web.html', 'utf8');

var port = process.env.PORT || 8080;

function getID(url){
    try{
        var id = url.split('scribd.com/doc')[1].split('/')[1];
    }catch(e){
        return false;
    }
    if(id && !isNaN(id)){
        return id;
    }else{
        return false;
    }
}

app.get('/', function(req, res){
    var url = req.query.url;
    if(!url){
        res.send(web);
        return;
    }
    var id = getID(url);
    if(id === false){
        res.send('Invalid URL');
        return;
    }
    scribd(url, id+'/', function(success){
        if(!success){
            res.send('Invalid URL');
            return;
        }
        
        var filePath = id+'/output.pdf';
        res.status(200);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="scribdPDF.pdf"');
        fs.createReadStream(filePath, null).pipe(res);
    });
});

app.listen(port, ()=>console.log(`App is listening on ${port}!`));