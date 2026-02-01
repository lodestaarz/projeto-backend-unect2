import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

export const createUserToken = (
  user: IUser,
  req: Request,
  res: Response
): void => {
  const token = jwt.sign(
    {
      name: user.name,
      id: user._id,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  res.status(200).json({
    message: "Você está autenticado",
    token,
    userId: user._id,
  });
};
