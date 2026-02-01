import { Schema, model, Document, Types } from 'mongoose'


export interface IPet extends Document {
    name: string
    age: number
    weight: number
    color: string
    images: string[]
    avaliable: boolean
    user: Types.ObjectId
    adopter?: Types.ObjectId
}


const PetSchema = new Schema<IPet>({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    weight: { type: Number, required: true },
    color: { type: String, required: true },
    images: [{ type: String, required: true }],
    avaliable: { type: Boolean, default: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adopter: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })


export default model<IPet>('Pet', PetSchema)