import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getToken } from "./get-token";

interface JwtPayload {
  id: string;
  name: string;
}

export const checkToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Acesso negado!" });
  }

  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: "Acesso negado!" });
  }

  try {
    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    (req as any).user = verified;

    next();
  } catch (err) {
    return res.status(400).json({ message: "Token inválido!" });
  }
};
