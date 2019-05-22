var request = require('request');
var shelljs = require('shelljs');
var fs = require('fs');

function getScribd(url, folder, callbackMain){
    var pdf = new (require('pdfkit'))({
        autoFirstPage: false
    });
    if(fs.existsSync(folder+'output.pdf')){
        callbackMain(true);
        return;
    }
    shelljs.mkdir(folder);
    
    var urls = [];
    function getFile(url, callback){
        var requestSettings = {
            url: url,
            method: 'GET',
            encoding: null,
            headers: {
                "Accept-Encoding": "gzip"
            }
        };
        request.get(requestSettings, function (error, response, body) {
            if(error){
                callbackMain(false);
                return;
            }else if(response.statusCode == 403){
                if(url.includes('jpg')){
                    getFile(url.slice(0, -3)+'png', callback);
                }else{
                    callbackMain(false);
                    return;
                }
            }else if(response.statusCode == 404){
                callback(body, 'Not found');
            }else if(response.statusCode !== 200){
                callbackMain(false);
                return
            }else{
                callback(body);
            }
        });
    }
    
    var counted = 0;
    function downloadFile(url, filePath, count){
        getFile(url, function(data, err){
            if(err){
                
            }else{
                fs.writeFile(filePath, data, null, function(){
                    if(counted++ == urls.length-1){
                        bundlePDF();
                    }
                });
            }
        });
    }
    
    function convertLink(jsonpURL){
        var split = jsonpURL.split('/');
        return `https://${split[2]}/${split[3]}/images/${split[5].split('.')[0]}.jpg`;
    }
    
    function main(){
        for(var page = 0; page < urls.length; page++){
            downloadFile(urls[page], folder+page+'.jpg', page);
        }
    }
    
    function bundlePDF(){
        pdf.pipe(fs.createWriteStream(process.argv[2] || folder+'output.pdf'));
        
        for(var count = 0; count < urls.length; count++){
            if(fs.existsSync(folder+count+'.jpg')){
                var img = pdf.openImage(folder+count+'.jpg');
                pdf.addPage({size: [img.width, img.height]});
                pdf.image(img, 0, 0);
            }else{
            }
        }
        
        pdf.end();
        callbackMain(true);
        return;
    }
    
    request({url: url, gzip: true, headers:{"User-Agent": "Mozilla/5.0 (X11; CrOS x86_64 11895.95.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.125 Safari/537.36"}}, function(err, response, body){
        if(err){
            callbackMain(false);
            return;
        }
        var split = body.split('pageParams.contentUrl = "');
        for(var count = 1; count < split.length; count++){
            urls.push(convertLink(split[count].split('"')[0]));
        }
        if(!urls.length){
            callbackMain(false);
            return;
        }
        main();
    });
}

module.exports = getScribd;