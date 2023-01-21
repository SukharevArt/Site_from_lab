const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const render  = require("ejs");
const app = express();

const connection = mysql.createConnection({
    host : "localhost",
    user : "root",
    password : "root",
    database : "js_bd"
});
connection.connect(function(err) {
    if (err) {
        console.log('ошибка: ' + err.message);
        return;
    }
    console.log('Подключились к базе данных MySQL');
});

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(express.static('Bikes_img'));
app.use(express.static('css'));
app.use(express.static('font'));

app.set('veiws','./views');
app.set('view engine','ejs');

//......................................

app.get("/main",function(req,res){
    connection.query("SELECT * FROM bikes", function(err,rows){
        if(err){
            console.log(err);
            return;
        }
        res.render("main.ejs",{bikes:rows});
    });
});

app.get("/rent:code",function(req,res){
    connection.query("SELECT * FROM bikes WHERE idbike =? ",[req.params.code], function(err,rows){
        if(err){
            console.log(err);
            return;
        }
        connection.query("SELECT * FROM rental_points", function(err2,rows2){
            if(err2){
                console.log(err2);
                return;
            }
            res.render("rentpage.ejs",{tmpbike:rows[0],rental_points:rows2});
        });
    });
});

app.post("/getlink.html",function(req,res){//name,date_time,idbike,subjekt,tel_num
    num = Math.ceil(Math.random()*1e9);
    connection.query("INSERT INTO booking VALUES (?,?,?,?,?,?)",
                [num,   req.body.date_time,     req.body.idbike,
                req.body.subject,   req.body.name,      req.body.tel_num], function(err,rows){
        if(err){
            console.log(err);
            return;
        }
    });
    res.render("getlink.ejs",{link:"http://localhost:3000/link"+num.toString()});
});

app.get("/link:id",
    function(req,res,next){
    connection.query("SELECT * FROM booking JOIN bikes ON bikes.idbike=booking.idbike WHERE idrent =?",
            [req.params.id], function(err,rows){
        if(err){
            console.log(err);
            return;
        }
        if(rows[0]==null){
            next();
            return;
        }else{
            res.render("linkstart.ejs",{tmpbike:rows[0],idrent:req.params.id});
        }
    }); 
},  function(req,res,next){
        connection.query("SELECT * FROM rents JOIN bikes ON bikes.idbike=rents.idbike WHERE idrent =?",
                [req.params.id], function(err,rows){
            if(err){
                console.log(err);
                return;
            }
            if(rows[0]==null){
                next();
                return;
            }else{
                connection.query("SELECT * FROM rental_points", function(err2,rows2){
                    if(err2){
                        console.log(err2);
                        return;
                    }
                    res.render("linkrent.ejs",{tmprent:rows[0],rental_points:rows2});
                });
            }
        } 
    )
},function(req,res){
    console.log(req.params);
    connection.query("SELECT * FROM storage JOIN bikes ON bikes.idbike=storage.idbike WHERE idrent=?",[req.params.id], function(err,rows){
        if(err){
            console.log(err);
            return;
        }
        console.log(rows[0]);
        res.render("rentres.ejs",{time:rows[0].duration,sum:Math.ceil(rows[0].duration/3600)*rows[0].price,
            link:"http://localhost:3000/payment"+req.params.id});
    });   
}
);

app.get("/payment:id",function(req,res){
    res.end("TBD");
});

app.post("/postresult.html",function(req,res){//tmptime,idrent,type
    connection.query("SELECT * FROM booking WHERE idrent=?",[req.body.idrent], function(err,rows){
        if(err){
            console.log(err);
            return;
        }
        connection.query("INSERT INTO rents VALUES (?,?,?,?,?,?)",
                [req.body.idrent,   req.body.tmptime,   rows[0].idbike,
                rows[0].startpnt,   rows[0].client,    rows[0].tel_num], function(err2,rows2){
            if(err2){
                console.log(err2);
                return;
            }
        });    
        connection.query("DELETE FROM booking WHERE idrent=?",
                [req.body.idrent], function(err2,rows2){
            if(err2){
                console.log(err2);
                return;
            }
        });    
    });
    res.redirect("http://localhost:3000/link"+req.body.idrent);
});

app.post("/postresult2.html",function(req,res){//idrent,type,duration,subject
    connection.query("SELECT * FROM rents WHERE idrent=?",[req.body.idrent], function(err,rows){
        if(err){
            console.log(err);
            return;
        }
        // console.log(rows);
        // console.log(req.body);  
        connection.query("INSERT INTO storage VALUES (?,?,?,?,?,?,?,?)",
                [req.body.idrent,   rows[0].time_start,     req.body.duration,
                rows[0].idbike,     rows[0].startpnt,       req.body.subject,
                rows[0].client,     rows[0].tel_num], function(err2,rows2){
            if(err2){
                console.log(err2);
                return;
            }
        });    
        connection.query("DELETE FROM rents WHERE idrent=?",
                [req.body.idrent], function(err2,rows2){
            if(err2){
                console.log(err2);
                return;
            }
        });    
    });
    res.redirect("http://localhost:3000/link"+req.body.idrent);
});

//................................

app.listen(3000);
