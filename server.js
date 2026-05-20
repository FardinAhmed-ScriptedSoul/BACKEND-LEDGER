require('dotenv').config()
const app = require('./src/app.js')

const PORT = process.env.PORT || 4000
//starting the server
app.listen(PORT,()=>{
    console.log(`server is running on ${PORT}`)
})