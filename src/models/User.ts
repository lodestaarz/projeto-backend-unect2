import { Schema, model, Document } from 'mongoose'


export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;   
  image?: string;
}



const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String }
}, { timestamps: true })


export default model<IUser>('User', UserSchema)