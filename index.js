const express = require('express');
const app = express();
const PORT = process.env.PORT || 7080;
const cors = require('cors');
require('dotenv').config()
const connectDb = require('./db/db')
const adminRouter = require('./routes/admin.routes')
const studentRouter = require('./routes/student.routes')
const authRouter = require('./routes/auth.routes')
const facultyRouter = require('./routes/faculty.routes')
app.use(cors());
app.use(express.json())
app.use('/admin' , adminRouter);
app.use('/student' , studentRouter);
app.use('/auth' , authRouter)
app.use('/faculty' , facultyRouter)

app.get('/cornjob' , (req , res)=>{
    res.send('Hello from Express Server');
})


app.listen(PORT , ()=>{
    console.log(`Server is running on port ${PORT}`);
    connectDb()
})