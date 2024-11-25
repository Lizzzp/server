import express from "express"
import "./db/index"
import DailyLinkReportsRouter from './routes/link'
const app = express()
app.use(express.json())
app.use(express.urlencoded({
    extended: false
}))



app.get('/', (req, res) => {
    res.json({
        message: "BI"
    })
})

app.use('/link', DailyLinkReportsRouter);
const errorHandler: express.ErrorRequestHandler = (error, req, res, next) => {
    console.log(error);
    
    res.status(500).json({
        error: error.message
    })
}

app.use(errorHandler)

app.listen(8056, () => {
    console.log(8056);
})