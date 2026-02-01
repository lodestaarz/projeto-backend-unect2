import { Request, Response } from "express";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";

import Pet, { IPet } from "../models/Pet";
import { IUser } from "../models/User";

import {getToken} from "../helpers/get-token";
import {getUserByToken} from "../helpers/get-user-by-token";

export default class PetController {
  static async create(req: Request, res: Response): Promise<Response> {
    
    console.log("BODY:", req.body);
    console.log("FILES RAW:", req.files);

    const { name, age, weight, color } = req.body;

    const files = req.files as Express.Multer.File[];

    if (!name) return res.status(422).json({ message: "O nome é obrigatório" });
    if (!age) return res.status(422).json({ message: "A idade é obrigatória" });
    if (!weight) return res.status(422).json({ message: "O peso é obrigatório" });
    if (!color) return res.status(422).json({ message: "A cor é obrigatória" });
    if (!files || files.length === 0)
      return res.status(422).json({ message: "A imagem é obrigatória" });

    const token = getToken(req);
    if (!token) return res.status(401).json({ message: "Acesso negado!" });

    const user = (await getUserByToken(token)) as IUser;

    const pet = new Pet({
      name,
      age,
      weight,
      color,
      avaliable: true,
      images: files.map((f) => f.filename),
      user: user._id,
    });

    try {
      const newPet = await pet.save();
      return res
        .status(201)
        .json({ message: "Pet cadastrado com sucesso!", newPet });
    } catch (err) {
      return res.status(500).json({ message: err });
    }
  }

  static async getAll(req: Request, res: Response): Promise<Response> {
    const pets = await Pet.find().sort("-createdAt");
    return res.status(200).json({ pets });
  }

  static async getAllUserPets(req: Request, res: Response): Promise<Response> {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({ message: "Acesso negado!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    const user = (await getUserByToken(token)) as IUser;

    const pets = await Pet.find({ user: user._id }).sort("-createdAt");
    return res.status(200).json({ pets });
  }

  static async getAllUserAdoptions(req: Request, res: Response): Promise<Response> {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({ message: "Acesso negado!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    const user = (await getUserByToken(token)) as IUser;

    const pets = await Pet.find({ adopter: user._id }).sort("-createdAt");
    return res.status(200).json({ pets });
  }

  static async getPetById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id))
      return res.status(422).json({ message: "ID inválido!" });

    const pet = await Pet.findById(id);
    if (!pet) return res.status(404).json({ message: "O pet não encontrado" });

    return res.status(200).json({ pet });
  }

  static async removePetById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id))
      return res.status(422).json({ message: "ID inválido!" });

    const pet = await Pet.findById(id);
    if (!pet) return res.status(404).json({ message: "Pet não encontrado" });

    const token = getToken(req);

    if (!token) {
      return res.status(401).json({ message: "Acesso negado!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    const user = (await getUserByToken(token)) as IUser;

    if (!pet.user.equals(user._id))
      return res.status(422).json({
        message:
          "Houve um problema em processar a sua solicitação, tente novamente mais tarde!",
      });

    await Pet.findByIdAndDelete(id);
    return res.status(200).json({ message: "Pet removido com sucesso" });
  }

  static async updatePet(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const pet = await Pet.findById(id);
    if (!pet) return res.status(404).json({ message: "Pet não encontrado" });

    const { name, age, weight, color } = req.body;
    const files = req.files as Express.Multer.File[];

    const token = getToken(req);

    if (!token) {
      return res.status(401).json({ message: "Acesso negado!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    const user = (await getUserByToken(token)) as IUser;

    if (!pet.user.equals(user._id))
      return res.status(422).json({
        message:
          "Houve um problema em processar a sua solicitação, tente novamente mais tarde!",
      });

    if (!name || !age || !weight || !color)
      return res.status(422).json({ message: "Todos os campos são obrigatórios" });

    if (!files || files.length === 0)
      return res.status(422).json({ message: "A imagem é obrigatória" });

    const updatedData: Partial<IPet> = {
      name,
      age,
      weight,
      color,
      images: files.map((f) => f.filename),
    };

    await Pet.findByIdAndUpdate(id, updatedData);

    return res.status(200).json({
      message: "Pet atualizado com sucesso!",
    });
  }

  static async schedule(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const pet = await Pet.findById(id).populate("user");
    if (!pet) return res.status(404).json({ message: "Pet não encontrado!" });

    const token = getToken(req);

    if (!token) {
      return res.status(401).json({ message: "Acesso negado!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    const user = (await getUserByToken(token)) as IUser;

    if (pet.user._id.equals(user._id))
      return res.status(422).json({
        message: "Você não pode agendar uma visita com o seu próprio pet!",
      });

    if (pet.adopter && pet.adopter.equals(user._id))
      return res.status(422).json({
        message: "Você já agendou uma visita para esse Pet!",
      });

    pet.adopter = user._id as Types.ObjectId;

    await pet.save();

    return res.status(200).json({
      message: `A visita foi agendada com sucesso, entre em contato com ${
        (pet.user as any).name
      } pelo telefone ${(pet.user as any).phone}`,
    });
  }

  static async concludeAdoption(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const pet = await Pet.findById(id);
    if (!pet) return res.status(404).json({ message: "Pet não encontrado!" });

    const token = getToken(req);

    if (!token) {
      return res.status(401).json({ message: "Acesso negado!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    const user = (await getUserByToken(token)) as IUser;

    if (!pet.user.equals(user._id))
      return res.status(422).json({
        message:
          "Houve um problema em processar a sua solicitação, tente novamente mais tarde",
      });

    pet.avaliable = false;
    await pet.save();

    return res.status(200).json({
      message: "Parabens, o ciclo de adoção foi finalizado com sucesso!",
    });
  }
}
