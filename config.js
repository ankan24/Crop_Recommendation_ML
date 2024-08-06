const mongoose = require('mongoose');
const connect = mongoose.connect('mongodb+srv://demouser:123@cluster0.ap4zayq.mongodb.net/CropRecommendation?retryWrites=true&w=majority&appName=Cluster0');
connect.then(()=>{
    console.log('Connected Successfully');
}).catch(err=>{
    console.log(err);
})

//creating a schema

const loginSchema =({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    }
});

// creating  to collection
const collection = new mongoose.model("user",loginSchema);
module.exports = collection;

