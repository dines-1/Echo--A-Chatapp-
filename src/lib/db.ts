import mongoose from 'mongoose'

type ConnectionObject ={
    isConnected? :number
}

const connection : ConnectionObject = {}

async function  dbconnect(): Promise<void> {
    if (connection.isConnected){
        console.log('Already connected to database');
        return;
    }
    try{
       const db =  await mongoose.connect(process.env.MONGODB_URI || '',
        {})
        connection.isConnected = db.connections[0].readyState
        console.log('Database Connection Successfull ');

    }catch(error){
        console.log('DB connection failed')
        console.log(`ERROR: ${error}`)
        process.exit(1)
    }
}
export default dbconnect();