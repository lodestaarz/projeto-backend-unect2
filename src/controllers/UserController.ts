import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import User, { IUser } from "../models/User";

import {createUserToken} from "../helpers/create-user-token";
import {getToken} from "../helpers/get-token";
import {getUserByToken} from "../helpers/get-user-by-token";

export default class UserController {
  static async register(req: Request, res: Response): Promise<Response> {
    const { name, email, phone, password, confirmpassword } = req.body;

    if (!name) return res.status(422).json({ message: "O nome é obrigatório!" });
    if (!email) return res.status(422).json({ message: "O email é obrigatório!" });
    if (!phone) return res.status(422).json({ message: "O telefone é obrigatório!" });
    if (!password) return res.status(422).json({ message: "A senha é obrigatória!" });
    if (!confirmpassword)
      return res.status(422).json({ message: "A confirmação de senha é obrigatória!" });

    if (password !== confirmpassword)
      return res
        .status(422)
        .json({ message: "A senha e a confirmação precisam ser iguais!" });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(422).json({ message: "Por favor, utilize outro email!" });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      phone,
      password: passwordHash,
    });

    try {
      const newUser = await user.save();
      await createUserToken(newUser, req, res);
      return res;
    } catch (err) {
      return res.status(500).json({ message: err });
    }
  }

  static async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    if (!email) return res.status(422).json({ message: "O email é obrigatório!" });
    if (!password) return res.status(422).json({ message: "A senha é obrigatória!" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(422).json({ message: "Usuário ou Senha inválido!" });

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword)
      return res.status(422).json({ message: "Usuário ou Senha inválido!" });

    await createUserToken(user, req, res);
    return res;
  }

  static async checkUser(req: Request, res: Response): Promise<Response> {
    let currentUser: IUser | null = null;

    if (req.headers.authorization) {
      const token = getToken(req);

      if (!token) {
        return res.status(401).json({ message: "Acesso negado!" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

      const userId = decoded.id;

      currentUser = await User.findById(decoded.id).select("-password");
    }

    return res.status(200).json(currentUser);
  }

  static async getUserById(req: Request, res: Response): Promise<Response> {
    const id = req.params.id;

    const user = await User.findById(id).select("-password");
    if (!user)
      return res.status(422).json({ message: "Usuário não encontrado!" });

    return res.status(200).json({ user });
  }

  static async editUser(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.id;

      const token = getToken(req);

      if (!token) {
        return res.status(401).json({ message: "Acesso negado!" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

      await getUserByToken(token);

      const { name, email, phone, password, confirmpassword } = req.body;

      if (!name)
        return res.status(422).json({ message: "O nome é obrigatório!" });
      if (!phone)
        return res.status(422).json({ message: "O telefone é obrigatório!" });

      const userToUpdate = await User.findById(id);
      if (!userToUpdate)
        return res.status(404).json({ message: "Usuário não encontrado!" });

      if (email) {
        const userExists = await User.findOne({ email });
        if (userExists && userExists._id.toString() !== id) {
          return res.status(422).json({ message: "Utilize outro email!" });
        }
      }

      let passwordHash = userToUpdate.password;

      if (password || confirmpassword) {
        if (password !== confirmpassword)
          return res.status(422).json({ message: "As senhas não conferem!" });

        const salt = await bcrypt.genSalt(12);
        passwordHash = await bcrypt.hash(password, salt);
      }

      const updateData: Partial<IUser> & { image?: string } = {
        name,
        email,
        phone,
        password: passwordHash,
      };

      if (req.file) {
        updateData.image = req.file.filename;
      }

      await User.findByIdAndUpdate(id, { $set: updateData });

      return res
        .status(200)
        .json({ message: "Usuário atualizado com sucesso!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
