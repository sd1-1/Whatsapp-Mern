//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher"
import cors from "cors"
//app config
const app = express()
const port = process.env.PORT || 9000;


const pusher = new Pusher({
    appId: "1139103",
    key: "2e01607dd8bb419d031d",
    secret: "714f405304146cc05774",
    cluster: "eu",
    useTLS: true
  });





//middle-ware
app.use(express.json());
app.use(cors())




//DB config
const connection_url = 'mongodb+srv://admin:Uayx7CQbm0WCLW8e@cluster0.xcutx.mongodb.net/<whatsappdb>?retryWrites=true&w=majority'


mongoose.connect(connection_url,{
    useCreateIndex : true,
    useNewUrlParser: true,
    useUnifiedTopology: true,

})

const db = mongoose.connection;

db.once("open",()=>{
    console.log("Db connected")

    const msgCollection = db.collection("messagecontents")
    const changeStream = msgCollection.watch()

    changeStream.on("change",(change)=>{
        console.log(change)
        if(change.operationType === "insert"){
            const messageDetails = change.fullDocument;
            pusher.trigger("messages","inserted",
            {

                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received

            })
        }else{
            console.log("error triggerign pusher")
        }

    })
})







// apiu routes
app.get("/",(req,res) => res.status(200).send("Hello world"))

app.get("/messages/sync",(req,res)=>{
    Messages.find((err,data) =>{
        if (err){
            res.status(500).send(err)

        }else{
            res.status(200).send(data)
        }
    })
})





app.post("/messages/new",(req,res) =>{
    const dbMessage = req.body;
    Messages.create(dbMessage,(err,data) =>{
        if (err){
            res.status(500).send(err)

        }else{
            res.status(201).send(`New message created : \n ${data}`)
        }
    })
})



//listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`))