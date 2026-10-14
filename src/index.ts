import express, { Request, Response } from "express";

const app = express();

app.use(express.json());



app.get("/health",(req:Request,res:Response)=>{
  res.send("server worked correctly").status(200);
})
app.listen(8080, () => {
  console.log("Server running on port 8080");
});