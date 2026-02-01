import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

export const getUserByToken = async (
  token: string
): Promise<IUser | null> => {
  if (!token) return null;

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET as string
  ) as { id: string };

  const user = await User.findById(decoded.id);

  return user;
};
